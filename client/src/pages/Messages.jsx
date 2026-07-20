import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../api.js';
import { C, S } from '../styles.js';
import { useNavigate } from 'react-router-dom';

export default function Messages() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [sent, setSent] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [toMis, setToMis] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [msg, setMsg] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!user) { nav('/login'); return; }
    loadData();
  }, [user, nav]);

  const loadData = () => {
    api.myMessages().then(setMessages).catch(() => {});
    api.sentMessages().then(setSent).catch(() => {});
    api.notifications().then(setNotifications).catch(() => {});
    api.announcements().then(setAnnouncements).catch(() => {});
  };

  const handleSend = async () => {
    if (!toMis || !content) return;
    try {
      await api.sendMessage({ to_mis_id: toMis, subject, content });
      setShowNew(false); setToMis(''); setSubject(''); setContent('');
      setMsg('✅ 消息已发送');
      loadData();
    } catch (e) { setMsg(`❌ ${e.message}`); }
  };

  const handleMarkRead = async (id) => {
    try { await api.markRead(id); loadData(); } catch {}
  };

  if (!user) return null;

  const tabs = [
    { key: 'inbox', label: `📥 收件箱 (${messages.filter(m => !m.is_read).length})` },
    { key: 'sent', label: '📤 已发送' },
    { key: 'notifications', label: `🔔 通知 (${notifications.filter(n => !n.is_read).length})` },
    { key: 'announcements', label: '📢 公告' }
  ];

  const current = tab === 'inbox' ? messages : tab === 'sent' ? sent : tab === 'notifications' ? notifications : announcements;

  return (
    <div style={S.page}>
      <div style={{ ...S.container, maxWidth: 800 }}>
        <div style={{ padding: '40px 0 20px', ...S.flexBetween }}>
          <h1 style={{ color: C.blue, margin: 0 }}>💬 消息中心</h1>
          <button onClick={() => setShowNew(true)} style={S.btn}>✉️ 写私信</button>
        </div>

        {msg && <div style={{ background: 'rgba(255,215,0,0.08)', border: `1px solid ${C.yellow}`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: C.yellow, fontSize: 13 }} onClick={() => setMsg('')}>{msg}</div>}

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSelected(null); }} style={{ ...S.btn, ...(tab !== t.key ? S.btnOutline : {}), fontSize: 13 }}>
              {t.label}
            </button>
          ))}
        </div>

        {selected ? (
          <div style={S.card}>
            <button onClick={() => setSelected(null)} style={{ ...S.btn, ...S.btnOutline, marginBottom: 16, fontSize: 12 }}>← 返回列表</button>
            <h3 style={{ color: C.white, margin: '0 0 8px' }}>{selected.subject || '(无主题)'}</h3>
            <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 12 }}>
              {selected.from_nickname || selected.from_mis_id || '系统'} · {new Date(selected.created_at).toLocaleString()}
            </div>
            <p style={{ color: C.textSecondary, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.content}</p>
          </div>
        ) : (
          current.length === 0 ? (
            <div style={{ ...S.card, textAlign: 'center', padding: 40, color: C.textMuted }}>暂无消息</div>
          ) : current.map(m => (
            <div key={m.id} onClick={() => { setSelected(m); if (!m.is_read && (tab === 'inbox' || tab === 'notifications')) handleMarkRead(m.id); }}
              style={{ ...S.card, cursor: 'pointer', borderLeft: !m.is_read ? `3px solid ${C.yellow}` : '3px solid transparent' }}>
              <div style={S.flexBetween}>
                <h4 style={{ color: !m.is_read ? C.white : C.textSecondary, margin: 0, fontWeight: !m.is_read ? 600 : 400 }}>
                  {m.subject || '(无主题)'}
                </h4>
                <span style={{ color: C.textMuted, fontSize: 12 }}>{new Date(m.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ color: C.textMuted, margin: '6px 0 0', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tab === 'inbox' && <span style={{ color: C.blue }}>{m.from_nickname || m.from_mis_id} → </span>}
                {tab === 'sent' && <span style={{ color: C.accentGreen }}>→ {m.to_nickname || m.to_mis_id} </span>}
                {m.content}
              </p>
            </div>
          ))
        )}

        {showNew && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onClick={() => setShowNew(false)}>
            <div style={{ background: C.card, borderRadius: 12, padding: 24, width: '90%', maxWidth: 500, border: `1px solid ${C.cardBorder}` }}
              onClick={e => e.stopPropagation()}>
              <h3 style={{ color: C.white, margin: '0 0 16px' }}>✉️ 发送私信</h3>
              <div style={S.formGroup}>
                <label style={S.label}>对方 MIS ID</label>
                <input style={S.input} value={toMis} onChange={e => setToMis(e.target.value)} placeholder="输入对方的 MIS ID" />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>主题（选填）</label>
                <input style={S.input} value={subject} onChange={e => setSubject(e.target.value)} placeholder="消息主题" />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>内容</label>
                <textarea style={{ ...S.textarea, minHeight: 100 }} value={content} onChange={e => setContent(e.target.value)} placeholder="输入消息内容..." />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={handleSend} style={S.btn} disabled={!toMis || !content}>发送</button>
                <button onClick={() => setShowNew(false)} style={{ ...S.btn, ...S.btnOutline }}>取消</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
