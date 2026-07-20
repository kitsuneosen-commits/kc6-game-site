import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../api.js';
import { C, S } from '../styles.js';
import Modal from '../components/Modal.jsx';
import { Link } from 'react-router-dom';

export default function Creative() {
  const { user } = useAuth();
  const [myList, setMyList] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) api.myCreatives().then(setMyList).catch(() => {});
  }, [user]);

  const handleSubmit = async () => {
    if (!title || !content) return;
    try {
      await api.submitCreative({ title, content });
      setShowNew(false); setTitle(''); setContent('');
      setMsg('投稿成功！等待管理员审核');
      api.myCreatives().then(setMyList);
    } catch (e) { setMsg(e.message); }
  };

  const statusLabel = { pending: '⏳ 审核中', approved: '✅ 已通过', rejected: '❌ 未通过' };
  const statusColor = { pending: C.yellow, approved: C.accentGreen, rejected: C.red };

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={{ padding: '40px 0 20px', ...S.flexBetween }}>
          <div>
            <h1 style={{ color: C.accentGreen, margin: '0 0 8px' }}>💡 创意收集</h1>
            <p style={{ color: C.textMuted, margin: 0 }}>投稿你的原创游戏创意，通过审核后可加入游戏专区</p>
          </div>
          {user && <button onClick={() => setShowNew(true)} style={S.btn}>📝 投稿创意</button>}
        </div>

        {msg && <div style={{ background: 'rgba(80,250,123,0.1)', border: `1px solid ${C.accentGreen}`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: C.accentGreen, fontSize: 13 }}>{msg}</div>}

        {!user && (
          <div style={{ ...S.card, textAlign: 'center', padding: 60 }}>
            <span style={{ fontSize: 48 }}>💡</span>
            <p style={{ color: C.textMuted, margin: '16px 0' }}>登录后即可投稿你的原创游戏创意</p>
            <Link to="/login" style={{ ...S.btn, textDecoration: 'none' }}>去登录</Link>
          </div>
        )}

        {user && (
          <div>
            <h3 style={{ color: C.white, margin: '0 0 16px' }}>我的投稿</h3>
            {myList.length === 0 ? (
              <div style={{ ...S.card, textAlign: 'center', padding: 40, color: C.textMuted }}>
                还没有投稿，快来分享你的创意吧！
              </div>
            ) : (
              myList.map(s => (
                <div key={s.id} style={S.card}>
                  <div style={S.flexBetween}>
                    <h4 style={{ color: C.white, margin: 0 }}>{s.title}</h4>
                    <span style={{ ...S.tag, color: statusColor[s.status] }}>{statusLabel[s.status]}</span>
                  </div>
                  <p style={{ color: C.textMuted, margin: '8px 0', fontSize: 14, lineHeight: 1.6 }}>{s.content}</p>
                  {s.review_note && <p style={{ color: C.blue, fontSize: 13, margin: '4px 0' }}>审核备注：{s.review_note}</p>}
                  <span style={{ color: C.textMuted, fontSize: 12 }}>{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        )}

        <Modal show={showNew} onClose={() => setShowNew(false)} title="📝 投稿创意">
          <div style={S.formGroup}>
            <label style={S.label}>游戏名称</label>
            <input style={S.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="你的游戏叫什么？" />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>创意描述</label>
            <textarea style={{ ...S.textarea, minHeight: 150 }} value={content} onChange={e => setContent(e.target.value)} placeholder="详细描述你的游戏创意，包括规则、玩法、背景等..." />
          </div>
          <button onClick={handleSubmit} style={S.btn} disabled={!title || !content}>提交投稿</button>
        </Modal>
      </div>
    </div>
  );
}
