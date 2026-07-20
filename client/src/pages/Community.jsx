import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { C, S } from '../styles.js';
import Modal from '../components/Modal.jsx';

export default function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tab, setTab] = useState('posts');
  const [honors, setHonors] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    api.getPosts(page).then(d => { setPosts(d.posts || []); setTotalPages(d.totalPages || 1); }).catch(() => {});
    api.getHonors().then(setHonors).catch(() => {});
  }, [page]);

  const handlePost = async () => {
    if (!newTitle || !newContent) return;
    try {
      const { id } = await api.createPost({ title: newTitle, content: newContent });
      setShowNew(false); setNewTitle(''); setNewContent('');
      navigate(`/community/${id}`);
    } catch (e) { alert(e.message); }
  };

  const handleLike = async (postId, idx) => {
    if (!user) return;
    try {
      const { liked } = await api.likePost(postId);
      setPosts(prev => prev.map((p, i) => i === idx ? { ...p, liked, like_count: liked ? p.like_count + 1 : p.like_count - 1 } : p));
    } catch {}
  };

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={{ padding: '40px 0 20px', ...S.flexBetween }}>
          <div>
            <h1 style={{ color: C.accent, margin: '0 0 8px' }}>💬 玩家社区</h1>
            <p style={{ color: C.textMuted, margin: 0 }}>分享游戏心得，交流策略技巧</p>
          </div>
          {user && <button onClick={() => setShowNew(true)} style={S.btn}>✏️ 发帖</button>}
        </div>

        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
          <button onClick={() => setTab('posts')} style={S.tab(tab === 'posts')}>📋 帖子列表</button>
          <button onClick={() => setTab('honors')} style={S.tab(tab === 'honors')}>🏆 荣誉榜</button>
        </div>

        {tab === 'posts' && (
          <div>
            {posts.map((p, idx) => (
              <div key={p.id} style={{ ...S.card, padding: 18 }}>
                <div style={S.flex}>
                  <div style={{ ...S.avatar, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${C.accent}, ${C.yellow})`, color: C.dark, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{(p.nickname || '?')[0]}</div>
                  <div>
                    <span style={{ color: C.white, fontSize: 14, fontWeight: 500 }}>{p.nickname}</span>
                    <span style={{ color: C.textMuted, fontSize: 12, marginLeft: 8 }}>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Link to={`/community/${p.id}`} style={{ textDecoration: 'none' }}>
                  <h3 style={{ color: C.white, margin: '12px 0 6px', fontSize: 17 }}>{p.title}</h3>
                </Link>
                <p style={{ color: C.textMuted, margin: '0 0 12px', fontSize: 14, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>{p.content}</p>
                {p.attachments?.length > 0 && (
                  <div style={{ ...S.flex, marginBottom: 8, flexWrap: 'wrap' }}>
                    {p.attachments.slice(0, 3).map((a, i) => (
                      <img key={i} src={a.url || a} alt="" style={{ width: 80, height: 80, borderRadius: 6, objectFit: 'cover' }} />
                    ))}
                    {p.attachments.length > 3 && <span style={{ color: C.textMuted, fontSize: 12 }}>+{p.attachments.length - 3}</span>}
                  </div>
                )}
                <div style={S.flex}>
                  <button onClick={() => handleLike(p.id, idx)} style={S.likeBtn(p.liked)}>
                    {p.liked ? '❤️' : '🤍'} {p.like_count}
                  </button>
                  <Link to={`/community/${p.id}`} style={{ ...S.likeBtn(false), textDecoration: 'none', color: C.textMuted }}>💬 {p.comment_count}</Link>
                </div>
              </div>
            ))}

            {posts.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>还没有帖子，来发第一帖吧！</div>}

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '20px 0' }}>
                {page > 1 && <button onClick={() => setPage(page - 1)} style={S.btnOutline}>上一页</button>}
                <span style={{ padding: '8px 16px', color: C.textMuted }}>{page} / {totalPages}</span>
                {page < totalPages && <button onClick={() => setPage(page + 1)} style={S.btnOutline}>下一页</button>}
              </div>
            )}
          </div>
        )}

        {tab === 'honors' && (
          <div style={S.card}>
            <h3 style={{ color: C.yellow, margin: '0 0 16px' }}>🏆 荣誉榜</h3>
            {honors.length === 0 ? <p style={{ color: C.textMuted }}>暂无荣誉记录</p> : (
              <div>
                {honors.map((h, i) => (
                  <div key={h.id} style={{ ...S.flex, padding: '12px 0', borderBottom: i < honors.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ fontSize: 20, width: 32, textAlign: 'center' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                    <div style={{ ...S.avatar, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${C.yellow}, ${C.accent})`, color: C.dark, fontWeight: 700, fontSize: 13 }}>{(h.nickname || '?')[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: C.white, fontSize: 14 }}>{h.nickname}</div>
                      <div style={{ color: C.textMuted, fontSize: 12 }}>{h.game_title} · {h.achievement}</div>
                    </div>
                    <span style={{ color: C.textMuted, fontSize: 11 }}>{new Date(h.awarded_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New post modal */}
        <Modal show={showNew} onClose={() => setShowNew(false)} title="✏️ 发布帖子">
          <div style={S.formGroup}>
            <label style={S.label}>标题</label>
            <input style={S.input} value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="帖子标题" />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>内容</label>
            <textarea style={S.textarea} value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="分享你的想法..." />
          </div>
          <button onClick={handlePost} style={S.btn} disabled={!newTitle || !newContent}>发布</button>
        </Modal>
      </div>
    </div>
  );
}
