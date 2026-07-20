import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { C, S } from '../styles.js';

export default function Home() {
  const [games, setGames] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api.getGames().then(setGames).catch(() => {});
    api.getPosts(1).then(d => setPosts(d.posts?.slice(0, 4) || [])).catch(() => {});
  }, []);

  const sections = [
    { icon: '🎮', title: '游戏专区', desc: '原创桌游与破冰游戏，体验独特玩法', to: '/games', color: C.yellow },
    { icon: '💬', title: '玩家社区', desc: '分享心得，交流策略，结识同好', to: '/community', color: C.accent },
    { icon: '💡', title: '创意收集', desc: '投稿你的原创游戏创意', to: '/creative', color: C.accentGreen },
    { icon: '🛒', title: '积分商城', desc: '积分兑换精美奖品', to: '/shop', color: '#6272a4' },
  ];

  return (
    <div style={S.page}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '80px 20px 60px', background: `radial-gradient(ellipse at center, rgba(255,215,0,0.08) 0%, transparent 70%)` }}>
        <h1 style={{ fontSize: 56, fontWeight: 900, margin: 0, background: `linear-gradient(135deg, ${C.yellow}, ${C.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KC-6游戏站</h1>
        <p style={{ fontSize: 20, color: C.textMuted, marginTop: 16, maxWidth: 600, margin: '16px auto 0' }}>原创桌游 · 破冰游戏 · 玩家社区 · 积分乐园</p>
        <div style={{ marginTop: 32, display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Link to="/games" style={{ ...S.btn, textDecoration: 'none', padding: '14px 36px', fontSize: 16 }}>探索游戏 🎮</Link>
          <Link to="/community" style={{ ...S.btnOutline, textDecoration: 'none', padding: '14px 36px', fontSize: 16 }}>加入社区</Link>
        </div>
      </div>

      <div style={S.container}>
        {/* Section cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 60 }}>
          {sections.map(s => (
            <Link key={s.to} to={s.to} style={{ textDecoration: 'none' }}>
              <div style={{ ...S.card, padding: 28, textAlign: 'center', cursor: 'pointer', borderColor: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{s.icon}</div>
                <h3 style={{ color: s.color, margin: '0 0 8px', fontSize: 20 }}>{s.title}</h3>
                <p style={{ color: C.textMuted, margin: 0, fontSize: 14 }}>{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Latest games */}
        {games.length > 0 && (
          <div style={{ marginBottom: 60 }}>
            <div style={S.flexBetween}>
              <h2 style={{ color: C.yellow, margin: '0 0 20px' }}>🎮 最新游戏</h2>
              <Link to="/games" style={{ color: C.yellow, textDecoration: 'none', fontSize: 14 }}>查看全部 →</Link>
            </div>
            <div style={S.grid3}>
              {games.slice(0, 6).map(g => (
                <Link key={g.id} to={`/games/${g.id}`} style={{ textDecoration: 'none' }}>
                  <div style={S.card} onMouseEnter={e => Object.assign(e.currentTarget.style, S.cardHover)} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ height: 140, borderRadius: 8, background: g.cover ? `url(${g.cover}) center/cover` : `linear-gradient(135deg, ${C.dark}, ${C.blue})`, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {!g.cover && <span style={{ fontSize: 48 }}>🎲</span>}
                    </div>
                    <h3 style={{ color: C.white, margin: '0 0 8px', fontSize: 16 }}>{g.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {g.avg_score > 0 && <span style={{ color: C.yellow, fontWeight: 700 }}>★ {g.avg_score}</span>}
                      <span style={{ ...S.tag, background: 'rgba(255,215,0,0.15)', color: C.yellow }}>{g.game_type === 'card' ? '卡牌' : g.game_type === 'icebreaker' ? '破冰' : '桌游'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Latest posts */}
        {posts.length > 0 && (
          <div style={{ marginBottom: 60 }}>
            <div style={S.flexBetween}>
              <h2 style={{ color: C.accent, margin: '0 0 20px' }}>💬 社区动态</h2>
              <Link to="/community" style={{ color: C.accent, textDecoration: 'none', fontSize: 14 }}>查看全部 →</Link>
            </div>
            {posts.map(p => (
              <Link key={p.id} to={`/community/${p.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ ...S.card, padding: 16 }} onMouseEnter={e => e.currentTarget.style.borderColor = C.accent} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                  <div style={S.flex}>
                    <div style={{ ...S.avatar, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${C.accent}, ${C.yellow})`, color: C.dark, fontWeight: 700, fontSize: 14 }}>{(p.nickname || '?')[0]}</div>
                    <span style={{ color: C.textMuted, fontSize: 13 }}>{p.nickname}</span>
                    <span style={{ color: C.border, fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 style={{ color: C.white, margin: '10px 0 6px' }}>{p.title}</h4>
                  <p style={{ color: C.textMuted, margin: 0, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.content}</p>
                  <div style={{ ...S.flex, marginTop: 8, fontSize: 12, color: C.textMuted }}>
                    <span>❤️ {p.like_count}</span>
                    <span>💬 {p.comment_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '40px 0 60px', color: C.textMuted, fontSize: 13 }}>
          © 2026 KC-6游戏站 · 用游戏连接每一个人
        </div>
      </div>
    </div>
  );
}
