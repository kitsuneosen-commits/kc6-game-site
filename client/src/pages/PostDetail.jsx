import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { C, S } from '../styles.js';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');

  const load = () => api.getPost(id).then(setPost).catch(() => {});
  useEffect(() => { load(); }, [id]);

  if (!post) return <div style={{ ...S.page, padding: 80, textAlign: 'center', color: C.textMuted }}>加载中...</div>;

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      await api.addComment(post.id, { content: comment });
      setComment(''); load();
    } catch (e) { alert(e.message); }
  };

  const handleLikePost = async () => {
    if (!user) return;
    const { liked } = await api.likePost(post.id);
    setPost(prev => ({ ...prev, liked, like_count: liked ? prev.like_count + 1 : prev.like_count - 1 }));
  };

  const handleLikeComment = async (cid, idx) => {
    if (!user) return;
    const { liked } = await api.likeComment(cid);
    setPost(prev => ({
      ...prev,
      comments: prev.comments.map((c, i) => i === idx ? { ...c, liked, like_count: liked ? c.like_count + 1 : c.like_count - 1 } : c)
    }));
  };

  return (
    <div style={S.page}>
      <div style={{ ...S.container, maxWidth: 800 }}>
        <div style={{ padding: '30px 0 10px' }}>
          <Link to="/community" style={{ color: C.textMuted, textDecoration: 'none', fontSize: 14 }}>← 返回社区</Link>
        </div>

        <div style={S.card}>
          <div style={S.flex}>
            <div style={{ ...S.avatar, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${C.accent}, ${C.yellow})`, color: C.dark, fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{(post.nickname || '?')[0]}</div>
            <div>
              <div style={{ color: C.white, fontWeight: 500 }}>{post.nickname}</div>
              <div style={{ color: C.textMuted, fontSize: 12 }}>{new Date(post.created_at).toLocaleString()}</div>
            </div>
          </div>
          <h2 style={{ color: C.white, margin: '16px 0 12px' }}>{post.title}</h2>
          <p style={{ color: C.text, lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: '0 0 16px' }}>{post.content}</p>

          {post.attachments?.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {post.attachments.map((a, i) => (
                <a key={i} href={a.url || a} target="_blank" rel="noreferrer">
                  <img src={a.url || a} alt="" style={{ maxWidth: 300, borderRadius: 8 }} />
                </a>
              ))}
            </div>
          )}

          <div style={S.flex}>
            <button onClick={handleLikePost} style={S.likeBtn(post.liked)}>{post.liked ? '❤️' : '🤍'} {post.like_count}</button>
            <span style={{ color: C.textMuted, fontSize: 13 }}>💬 {post.comments?.length || 0}</span>
          </div>
        </div>

        {/* Comments */}
        <div style={{ margin: '24px 0 16px' }}>
          <h3 style={{ color: C.white, margin: '0 0 16px' }}>评论 ({post.comments?.length || 0})</h3>

          {user && (
            <div style={{ ...S.card, padding: 16 }}>
              <textarea style={{ ...S.textarea, minHeight: 60 }} value={comment} onChange={e => setComment(e.target.value)} placeholder="写下你的评论..." />
              <button onClick={handleComment} style={{ ...S.btn, ...S.btnSmall, marginTop: 8 }} disabled={!comment.trim()}>发表评论</button>
            </div>
          )}
          {!user && <div style={{ ...S.card, padding: 16, textAlign: 'center' }}><Link to="/login" style={{ color: C.yellow }}>登录后评论</Link></div>}

          {post.comments?.map((c, idx) => (
            <div key={c.id} style={{ ...S.card, padding: 14, marginTop: 8 }}>
              <div style={S.flexBetween}>
                <div style={S.flex}>
                  <div style={{ ...S.avatar, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${C.blue}, ${C.accent})`, color: C.white, fontWeight: 600, fontSize: 12, flexShrink: 0 }}>{(c.nickname || '?')[0]}</div>
                  <span style={{ color: C.white, fontSize: 13, fontWeight: 500 }}>{c.nickname}</span>
                  <span style={{ color: C.textMuted, fontSize: 11 }}>{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <button onClick={() => handleLikeComment(c.id, idx)} style={S.likeBtn(c.liked)}>{c.liked ? '❤️' : '🤍'} {c.like_count}</button>
              </div>
              <p style={{ color: C.text, margin: '8px 0 0', fontSize: 14, lineHeight: 1.6 }}>{c.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
