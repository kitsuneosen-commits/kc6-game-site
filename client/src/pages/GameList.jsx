import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { C, S } from '../styles.js';

export default function GameList() {
  const [games, setGames] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { api.getGames().then(setGames).catch(() => {}); }, []);

  const filtered = filter === 'all' ? games : games.filter(g => g.game_type === filter);
  const typeLabel = { board: '桌游', card: '卡牌', icebreaker: '破冰', other: '其他' };

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={{ padding: '40px 0 20px' }}>
          <h1 style={{ color: C.yellow, margin: '0 0 8px' }}>🎮 游戏专区</h1>
          <p style={{ color: C.textMuted, margin: 0 }}>探索原创桌游与破冰游戏，开启你的游戏之旅</p>
        </div>

        <div style={{ ...S.flex, marginBottom: 24 }}>
          {['all', 'board', 'card', 'icebreaker', 'other'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...S.tab(filter === f), borderRadius: 20, border: `1px solid ${filter === f ? C.yellow : C.border}`, padding: '6px 16px', fontSize: 13 }}>
              {f === 'all' ? '全部' : typeLabel[f]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: C.textMuted }}>
            <span style={{ fontSize: 48 }}>🎲</span>
            <p>暂无游戏，敬请期待</p>
          </div>
        ) : (
          <div style={S.grid3}>
            {filtered.map(g => (
              <Link key={g.id} to={`/games/${g.id}`} style={{ textDecoration: 'none' }}>
                <div style={S.card} onMouseEnter={e => Object.assign(e.currentTarget.style, S.cardHover)} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ height: 160, borderRadius: 8, background: g.cover ? `url(${g.cover}) center/cover` : `linear-gradient(135deg, ${C.dark}, ${C.blue})`, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {!g.cover && <span style={{ fontSize: 56 }}>🎲</span>}
                  </div>
                  <h3 style={{ color: C.white, margin: '0 0 8px', fontSize: 17 }}>{g.title}</h3>
                  <p style={{ color: C.textMuted, margin: '0 0 12px', fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{g.summary || '暂无简介'}</p>
                  <div style={{ ...S.flexBetween }}>
                    <div style={{ ...S.flex }}>
                      {g.avg_score > 0 && <span style={{ color: C.yellow, fontWeight: 700, fontSize: 15 }}>★ {g.avg_score}</span>}
                      <span style={{ color: C.textMuted, fontSize: 12 }}>{g.total_ratings}人评</span>
                    </div>
                    <span style={{ ...S.tag, background: 'rgba(255,215,0,0.12)', color: C.yellow }}>{typeLabel[g.game_type] || '桌游'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
