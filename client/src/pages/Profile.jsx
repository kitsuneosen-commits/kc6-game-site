import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../api.js';
import { C, S } from '../styles.js';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [msg, setMsg] = useState('');
  const [games, setGames] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) { nav('/login'); return; }
    setNickname(user.nickname || '');
    setBio(user.bio || '');
    setAvatar(user.avatar || '');
    api.myOrders().then(setOrders).catch(() => {});
  }, [user, nav]);

  const handleSave = async () => {
    try {
      await api.updateProfile({ nickname, bio, avatar });
      if (refreshUser) refreshUser();
      setEditing(false);
      setMsg('✅ 资料已更新');
    } catch (e) { setMsg(`❌ ${e.message}`); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.upload(file);
      setAvatar(res.url);
    } catch (err) { setMsg('头像上传失败'); }
  };

  if (!user) return null;

  const titleMap = {
    newcomer: '🌱 新手玩家',
    active: '⭐ 活跃玩家',
    veteran: '🏅 资深玩家',
    master: '👑 大师玩家'
  };

  return (
    <div style={S.page}>
      <div style={{ ...S.container, maxWidth: 700 }}>
        <div style={{ padding: '40px 0 20px' }}>
          <h1 style={{ color: C.yellow, margin: '0 0 8px' }}>👤 个人中心</h1>
        </div>

        {msg && <div style={{ background: 'rgba(255,215,0,0.08)', border: `1px solid ${C.yellow}`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: C.yellow, fontSize: 13 }} onClick={() => setMsg('')}>{msg}</div>}

        <div style={S.card}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', background: C.cardBorder,
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `3px solid ${user.is_verified ? C.accentGreen : C.cardBorder}`
              }}>
                {avatar ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 36 }}>👤</span>}
              </div>
              {editing && (
                <label style={{ position: 'absolute', bottom: -4, right: -4, background: C.yellow, color: C.bg, borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  📷 <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            <div style={{ flex: 1 }}>
              {!editing ? (
                <>
                  <h2 style={{ color: C.white, margin: '0 0 4px' }}>
                    {user.nickname || user.mis_id}
                    {user.is_verified && <span style={{ marginLeft: 8, fontSize: 14, color: C.accentGreen }}>✅ 已认证</span>}
                  </h2>
                  <p style={{ color: C.textMuted, margin: '0 0 4px', fontSize: 13 }}>MIS ID: {user.mis_id}</p>
                  <p style={{ color: C.textSecondary, margin: '0 0 8px', fontSize: 14 }}>{user.bio || '这个人很懒，什么都没写'}</p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ ...S.tag, color: C.yellow }}>💰 {user.points || 0} 积分</span>
                    <span style={{ ...S.tag, color: C.purple }}>{titleMap[user.title] || '🌱 新手玩家'}</span>
                    {user.is_admin && <span style={{ ...S.tag, color: C.red }}>🔑 管理员</span>}
                  </div>
                </>
              ) : (
                <div>
                  <div style={S.formGroup}>
                    <label style={S.label}>昵称</label>
                    <input style={S.input} value={nickname} onChange={e => setNickname(e.target.value)} />
                  </div>
                  <div style={S.formGroup}>
                    <label style={S.label}>个人简介</label>
                    <textarea style={S.textarea} value={bio} onChange={e => setBio(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)} style={S.btn}>✏️ 编辑资料</button>
                <button onClick={() => nav('/messages')} style={{ ...S.btn, ...S.btnOutline }}>💬 私信</button>
                {user.is_admin && <button onClick={() => nav('/admin')} style={{ ...S.btn, background: C.red }}>🔑 管理后台</button>}
              </>
            ) : (
              <>
                <button onClick={handleSave} style={S.btn}>💾 保存</button>
                <button onClick={() => { setEditing(false); setNickname(user.nickname || ''); setBio(user.bio || ''); }} style={{ ...S.btn, ...S.btnOutline }}>取消</button>
              </>
            )}
          </div>
        </div>

        <div style={S.card}>
          <h3 style={{ color: C.white, margin: '0 0 16px' }}>📊 我的数据</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: '积分', value: user.points || 0, color: C.yellow },
              { label: '注册天数', value: Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000), color: C.blue },
              { label: '订单数', value: orders.length, color: C.purple }
            ].map((d, i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: d.color }}>{d.value}</div>
                <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => { logout(); nav('/'); }} style={{ ...S.btn, background: 'transparent', border: `1px solid ${C.red}`, color: C.red, width: '100%', marginTop: 8 }}>
          🚪 退出登录
        </button>
      </div>
    </div>
  );
}
