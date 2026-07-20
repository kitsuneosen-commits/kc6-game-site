import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../api.js';
import { C, S } from '../styles.js';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal.jsx';

export default function Admin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('games');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user?.is_admin) nav('/');
  }, [user, nav]);

  if (!user?.is_admin) return null;

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={{ padding: '40px 0 20px' }}>
          <h1 style={{ color: C.red, margin: '0 0 8px' }}>🔑 管理后台</h1>
          <p style={{ color: C.textMuted, margin: 0 }}>管理游戏、用户、审核和商店</p>
        </div>

        {msg && <div style={{ background: 'rgba(255,215,0,0.08)', border: `1px solid ${C.yellow}`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: C.yellow, fontSize: 13 }} onClick={() => setMsg('')}>{msg}</div>}

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { key: 'games', label: '🎮 游戏管理' },
            { key: 'users', label: '👥 用户管理' },
            { key: 'creatives', label: '💡 创意审核' },
            { key: 'shop', label: '🛒 商店管理' },
            { key: 'announce', label: '📢 公告管理' }
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ ...S.btn, ...(tab !== t.key ? S.btnOutline : {}), fontSize: 13 }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'games' && <GameAdmin onMsg={setMsg} />}
        {tab === 'users' && <UserAdmin onMsg={setMsg} />}
        {tab === 'creatives' && <CreativeAdmin onMsg={setMsg} />}
        {tab === 'shop' && <ShopAdmin onMsg={setMsg} />}
        {tab === 'announce' && <AnnounceAdmin onMsg={setMsg} />}
      </div>
    </div>
  );
}

function GameAdmin({ onMsg }) {
  const [games, setGames] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: '', game_type: 'board', summary: '', rules: '', cover: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { api.games().then(setGames).catch(() => {}); }, []);

  const handleSave = async () => {
    try {
      if (editId) await api.updateGame(editId, form);
      else await api.createGame(form);
      onMsg(editId ? '✅ 游戏已更新' : '✅ 游戏已创建');
      setShow(false); setEditId(null); setForm({ title: '', game_type: 'board', summary: '', rules: '', cover: '' });
      api.games().then(setGames);
    } catch (e) { onMsg(`❌ ${e.message}`); }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除？')) return;
    try { await api.deleteGame(id); onMsg('已删除'); api.games().then(setGames); } catch (e) { onMsg(`❌ ${e.message}`); }
  };

  const edit = (g) => { setForm({ title: g.title, game_type: g.game_type, summary: g.summary || '', rules: g.rules || '', cover: g.cover || '' }); setEditId(g.id); setShow(true); };

  return (
    <div>
      <button onClick={() => { setEditId(null); setForm({ title: '', game_type: 'board', summary: '', rules: '', cover: '' }); setShow(true); }} style={{ ...S.btn, marginBottom: 16 }}>➕ 添加游戏</button>
      {games.map(g => (
        <div key={g.id} style={S.card}>
          <div style={S.flexBetween}>
            <div>
              <h4 style={{ color: C.white, margin: 0 }}>{g.title}</h4>
              <span style={{ color: C.textMuted, fontSize: 12 }}>{g.game_type} · 评分 {g.avg_score || '-'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => edit(g)} style={{ ...S.btn, fontSize: 12, padding: '4px 12px' }}>编辑</button>
              <button onClick={() => handleDelete(g.id)} style={{ ...S.btn, fontSize: 12, padding: '4px 12px', background: C.red }}>删除</button>
            </div>
          </div>
        </div>
      ))}
      <Modal show={show} onClose={() => setShow(false)} title={editId ? '编辑游戏' : '添加游戏'}>
        <div style={S.formGroup}>
          <label style={S.label}>名称</label>
          <input style={S.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>类型</label>
          <select style={S.input} value={form.game_type} onChange={e => setForm({ ...form, game_type: e.target.value })}>
            <option value="board">桌游</option><option value="card">卡牌</option><option value="icebreaker">破冰</option><option value="other">其他</option>
          </select>
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>简介</label>
          <textarea style={S.textarea} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>规则</label>
          <textarea style={S.textarea} value={form.rules} onChange={e => setForm({ ...form, rules: e.target.value })} />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>封面图URL</label>
          <input style={S.input} value={form.cover} onChange={e => setForm({ ...form, cover: e.target.value })} />
        </div>
        <button onClick={handleSave} style={S.btn}>{editId ? '保存修改' : '创建游戏'}</button>
      </Modal>
    </div>
  );
}

function UserAdmin({ onMsg }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [showAward, setShowAward] = useState(null);
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState('');

  useEffect(() => {
    // We'll load from a simple search or list
  }, []);

  const handleSearch = async () => {
    if (!search) return;
    try {
      const u = await api.getUser(search);
      setUsers(u ? [u] : []);
    } catch { setUsers([]); }
  };

  const handleVerify = async (misId) => {
    try { await api.adminVerify(misId); onMsg('✅ 已认证'); handleSearch(); } catch (e) { onMsg(`❌ ${e.message}`); }
  };

  const handleAward = async () => {
    if (!showAward) return;
    try {
      await api.adminAward(showAward, { points, reason });
      onMsg(`✅ 已奖励 ${points} 积分`);
      setShowAward(null); setPoints(0); setReason('');
      handleSearch();
    } catch (e) { onMsg(`❌ ${e.message}`); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input style={{ ...S.input, flex: 1 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="输入 MIS ID 搜索用户" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button onClick={handleSearch} style={S.btn}>🔍 搜索</button>
      </div>
      {users.map(u => (
        <div key={u.id || u.mis_id} style={S.card}>
          <div style={S.flexBetween}>
            <div>
              <h4 style={{ color: C.white, margin: 0 }}>{u.nickname || u.mis_id}</h4>
              <span style={{ color: C.textMuted, fontSize: 12 }}>
                MIS: {u.mis_id} · 积分: {u.points} · {u.is_verified ? '已认证✅' : '未认证'}
                {u.is_admin && ' · 管理员'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!u.is_verified && <button onClick={() => handleVerify(u.mis_id)} style={{ ...S.btn, fontSize: 12, padding: '4px 12px', background: C.accentGreen }}>认证</button>}
              <button onClick={() => setShowAward(u.mis_id)} style={{ ...S.btn, fontSize: 12, padding: '4px 12px' }}>奖励积分</button>
            </div>
          </div>
        </div>
      ))}
      <Modal show={!!showAward} onClose={() => setShowAward(null)} title="奖励积分">
        <div style={S.formGroup}>
          <label style={S.label}>积分数量</label>
          <input style={S.input} type="number" value={points} onChange={e => setPoints(Number(e.target.value))} />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>原因</label>
          <input style={S.input} value={reason} onChange={e => setReason(e.target.value)} placeholder="奖励原因" />
        </div>
        <button onClick={handleAward} style={S.btn}>确认奖励</button>
      </Modal>
    </div>
  );
}

function CreativeAdmin({ onMsg }) {
  const [list, setList] = useState([]);
  const [note, setNote] = useState('');

  useEffect(() => { loadList(); }, []);
  const loadList = () => api.allCreatives ? api.allCreatives().then(setList).catch(() => {}) : {};

  const handleReview = async (id, status) => {
    try {
      await api.reviewCreative(id, { status, review_note: note });
      onMsg(`✅ 已${status === 'approved' ? '通过' : '拒绝'}`);
      setNote('');
      loadList();
    } catch (e) { onMsg(`❌ ${e.message}`); }
  };

  return (
    <div>
      <h3 style={{ color: C.white, margin: '0 0 16px' }}>待审核投稿</h3>
      {list.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: 40, color: C.textMuted }}>暂无待审核投稿</div>
      ) : list.map(s => (
        <div key={s.id} style={S.card}>
          <div style={S.flexBetween}>
            <h4 style={{ color: C.white, margin: 0 }}>{s.title}</h4>
            <span style={{ ...S.tag, color: s.status === 'pending' ? C.yellow : s.status === 'approved' ? C.accentGreen : C.red }}>
              {s.status === 'pending' ? '待审核' : s.status === 'approved' ? '已通过' : '已拒绝'}
            </span>
          </div>
          <p style={{ color: C.textMuted, fontSize: 13, margin: '8px 0' }}>投稿人：{s.mis_id}</p>
          <p style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.6 }}>{s.content}</p>
          {s.status === 'pending' && (
            <div style={{ marginTop: 12 }}>
              <input style={{ ...S.input, marginBottom: 8 }} value={note} onChange={e => setNote(e.target.value)} placeholder="审核备注（选填）" />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleReview(s.id, 'approved')} style={{ ...S.btn, background: C.accentGreen }}>✅ 通过</button>
                <button onClick={() => handleReview(s.id, 'rejected')} style={{ ...S.btn, background: C.red }}>❌ 拒绝</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ShopAdmin({ onMsg }) {
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: 100, stock: 10, image_url: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { api.shopItems().then(setItems).catch(() => {}); }, []);

  const handleSave = async () => {
    try {
      if (editId) await api.updateShopItem(editId, form);
      else await api.createShopItem(form);
      onMsg(editId ? '✅ 商品已更新' : '✅ 商品已上架');
      setShow(false); setEditId(null); setForm({ name: '', description: '', price: 100, stock: 10, image_url: '' });
      api.shopItems().then(setItems);
    } catch (e) { onMsg(`❌ ${e.message}`); }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除？')) return;
    try { await api.deleteShopItem(id); onMsg('已删除'); api.shopItems().then(setItems); } catch (e) { onMsg(`❌ ${e.message}`); }
  };

  return (
    <div>
      <button onClick={() => { setEditId(null); setForm({ name: '', description: '', price: 100, stock: 10, image_url: '' }); setShow(true); }} style={{ ...S.btn, marginBottom: 16 }}>➕ 上架商品</button>
      {items.map(item => (
        <div key={item.id} style={S.card}>
          <div style={S.flexBetween}>
            <div>
              <h4 style={{ color: C.white, margin: 0 }}>{item.name}</h4>
              <span style={{ color: C.textMuted, fontSize: 12 }}>💰 {item.price} 积分 · 库存 {item.stock}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setForm({ name: item.name, description: item.description, price: item.price, stock: item.stock, image_url: item.image_url || '' }); setEditId(item.id); setShow(true); }} style={{ ...S.btn, fontSize: 12, padding: '4px 12px' }}>编辑</button>
              <button onClick={() => handleDelete(item.id)} style={{ ...S.btn, fontSize: 12, padding: '4px 12px', background: C.red }}>删除</button>
            </div>
          </div>
        </div>
      ))}
      <Modal show={show} onClose={() => setShow(false)} title={editId ? '编辑商品' : '上架商品'}>
        <div style={S.formGroup}>
          <label style={S.label}>名称</label>
          <input style={S.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>描述</label>
          <textarea style={S.textarea} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ ...S.formGroup, flex: 1 }}>
            <label style={S.label}>价格（积分）</label>
            <input style={S.input} type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
          </div>
          <div style={{ ...S.formGroup, flex: 1 }}>
            <label style={S.label}>库存</label>
            <input style={S.input} type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
          </div>
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>图片URL</label>
          <input style={S.input} value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
        </div>
        <button onClick={handleSave} style={S.btn}>{editId ? '保存修改' : '上架商品'}</button>
      </Modal>
    </div>
  );
}

function AnnounceAdmin({ onMsg }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSend = async () => {
    if (!title || !content) return;
    try {
      await api.sendAnnouncement({ title, content });
      onMsg('✅ 公告已发布');
      setTitle(''); setContent('');
    } catch (e) { onMsg(`❌ ${e.message}`); }
  };

  return (
    <div>
      <div style={S.card}>
        <h3 style={{ color: C.white, margin: '0 0 16px' }}>📢 发布公告</h3>
        <div style={S.formGroup}>
          <label style={S.label}>公告标题</label>
          <input style={S.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="公告标题" />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>公告内容</label>
          <textarea style={{ ...S.textarea, minHeight: 120 }} value={content} onChange={e => setContent(e.target.value)} placeholder="公告正文..." />
        </div>
        <button onClick={handleSend} style={S.btn} disabled={!title || !content}>发布公告</button>
      </div>
    </div>
  );
}
