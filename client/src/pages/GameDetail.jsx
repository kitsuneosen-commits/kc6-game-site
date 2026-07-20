import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { C, S } from '../styles.js';
import StarRating from '../components/StarRating.jsx';
import Modal from '../components/Modal.jsx';

export default function GameDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [tab, setTab] = useState('info');
  const [rateScore, setRateScore] = useState(0);
  const [rateComment, setRateComment] = useState('');
  const [cardModal, setCardModal] = useState(null);
  const [cardScore, setCardScore] = useState(0);
  const [cardComment, setCardComment] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api.getGame(id).then(setGame).catch(() => {});
  useEffect(() => { load(); }, [id]);

  if (!game) return <div style={{ ...S.page, padding: 80, textAlign: 'center', color: C.textMuted }}>加载中...</div>;

  const handleRate = async () => {
    try {
      await api.rateGame(game.id, { score: rateScore, comment: rateComment });
      setMsg('评价成功！'); setRateScore(0); setRateComment(''); load();
    } catch (e) { setMsg(e.message); }
  };

  const handleCardRate = async () => {
    if (!cardModal) return;
    try {
      await api.rateCard(cardModal.id, { score: cardScore, comment: cardComment });
      setMsg('卡牌评价成功！'); setCardModal(null); setCardScore(0); setCardComment(''); load();
    } catch (e) { setMsg(e.message); }
  };

  const handleVerify = async () => {
    try {
      const r = await api.requestVerify(game.id);
      setMsg(r.message); load();
    } catch (e) { setMsg(e.message); }
  };

  const handleEventRegister = async (eventId) => {
    try {
      await api.registerEvent(eventId);
      setMsg('报名成功！'); load();
    } catch (e) { setMsg(e.message); }
  };

  const tabs = [
    { key: 'info', label: '📖 规则玩法' },
    ...(game.cards?.length ? [{ key: 'cards', label: `🃏 卡牌 (${game.cards.length})` }] : []),
    ...(game.props?.length ? [{ key: 'props', label: `🧩 道具 (${game.props.length})` }] : []),
    { key: 'ratings', label: `⭐ 评价 (${game.total_ratings})` },
    ...(game.events?.length ? [{ key: 'events', label: `🏆 赛事 (${game.events.length})` }] : []),
  ];

  return (
    <div style={S.page}>
      <div style={S.container}>
        {msg && <div style={{ background: 'rgba(255,215,0,0.1)', border: `1px solid ${C.yellow}`, borderRadius: 8, padding: '10px 16px', margin: '16px 0', color: C.yellow, fontSize: 13, ...S.flexBetween }}><span>{msg}</span><button onClick={() => setMsg('')} style={{ background: 'none', border: 'none', color: C.yellow, cursor: 'pointer' }}>✕</button></div>}

        {/* Header */}
        <div style={{ display: 'flex', gap: 28, padding: '40px 0 24px', flexWrap: 'wrap' }}>
          <div style={{ width: 280, height: 200, borderRadius: 12, background: game.cover ? `url(${game.cover}) center/cover` : `linear-gradient(135deg, ${C.dark}, ${C.blue})`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {!game.cover && <span style={{ fontSize: 80 }}>🎲</span>}
          </div>
          <div style={{ flex: 1, minWidth: 250 }}>
            <h1 style={{ color: C.white, margin: '0 0 8px', fontSize: 28 }}>{game.title}</h1>
            <div style={{ ...S.flex, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ ...S.tag, background: 'rgba(255,215,0,0.15)', color: C.yellow }}>
                {game.game_type === 'card' ? '🃏 卡牌游戏' : game.game_type === 'icebreaker' ? '🧊 破冰游戏' : '🎲 桌游'}
              </span>
              {game.is_card_game ? <span style={{ ...S.tag, background: 'rgba(80,250,123,0.15)', color: C.accentGreen }}>含卡牌</span> : null}
            </div>
            <div style={{ ...S.flex, marginBottom: 16 }}>
              <StarRating value={game.avg_score} readonly />
              <span style={{ color: C.textMuted, fontSize: 13 }}>({game.total_ratings}人评价)</span>
            </div>
            <p style={{ color: C.textMuted, margin: 0, lineHeight: 1.6 }}>{game.summary || '暂无简介'}</p>
            {user && !game.userVerified && (
              <button onClick={handleVerify} style={{ ...S.btn, marginTop: 16 }}>🎯 申请认证（我玩过）</button>
            )}
            {game.userVerified && <span style={{ ...S.tag, background: 'rgba(80,250,123,0.2)', color: C.accentGreen, marginTop: 16, display: 'inline-block' }}>✅ 已认证玩家</span>}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
          {tabs.map(t => <button key={t.key} onClick={() => setTab(t.key)} style={S.tab(tab === t.key)}>{t.label}</button>)}
        </div>

        {/* Tab content */}
        {tab === 'info' && (
          <div style={S.card}>
            <h3 style={{ color: C.yellow, margin: '0 0 12px' }}>📖 游戏背景</h3>
            <p style={{ color: C.text, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{game.background || '暂无背景介绍'}</p>
            <div style={S.divider} />
            <h3 style={{ color: C.yellow, margin: '0 0 12px' }}>📜 规则玩法</h3>
            <p style={{ color: C.text, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{game.rules || '暂无规则说明'}</p>
          </div>
        )}

        {tab === 'cards' && (
          <div style={S.grid3}>
            {game.cards.map(c => (
              <div key={c.id} style={{ ...S.card, cursor: 'pointer' }} onClick={() => { setCardModal(c); setCardScore(0); setCardComment(''); }}>
                <div style={{ height: 140, borderRadius: 8, background: c.image ? `url(${c.image}) center/cover` : `linear-gradient(135deg, ${C.darkBg}, ${C.border})`, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!c.image && <span style={{ fontSize: 40 }}>🃏</span>}
                </div>
                <h4 style={{ color: C.white, margin: '0 0 6px' }}>{c.name}</h4>
                <span style={{ ...S.tag, background: 'rgba(98,114,164,0.2)', color: C.blue, marginBottom: 8, display: 'inline-block' }}>{c.card_type}</span>
                <p style={{ color: C.textMuted, margin: '6px 0', fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description || ''}</p>
                {c.avg_score > 0 && <div style={{ color: C.yellow, fontSize: 13 }}>★ {c.avg_score} ({c.total_ratings}人评)</div>}
              </div>
            ))}
          </div>
        )}

        {tab === 'props' && (
          <div style={S.grid3}>
            {game.props.map(p => (
              <div key={p.id} style={S.card}>
                <div style={{ height: 120, borderRadius: 8, background: p.image ? `url(${p.image}) center/cover` : `linear-gradient(135deg, ${C.darkBg}, ${C.border})`, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!p.image && <span style={{ fontSize: 36 }}>🧩</span>}
                </div>
                <h4 style={{ color: C.white, margin: '0 0 6px' }}>{p.name}</h4>
                <p style={{ color: C.textMuted, margin: 0, fontSize: 13 }}>{p.description || ''}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'ratings' && (
          <div>
            {/* Rate form */}
            {user && game.userVerified && !game.userRating && (
              <div style={{ ...S.card, marginBottom: 24 }}>
                <h3 style={{ color: C.yellow, margin: '0 0 12px' }}>写下你的评价</h3>
                <StarRating value={rateScore} onChange={setRateScore} />
                <textarea style={{ ...S.textarea, marginTop: 12 }} value={rateComment} onChange={e => setRateComment(e.target.value)} placeholder="分享你的游戏体验..." />
                <button onClick={handleRate} style={{ ...S.btn, marginTop: 12 }} disabled={!rateScore}>提交评价</button>
              </div>
            )}
            {user && game.userRating && (
              <div style={{ ...S.card, marginBottom: 24, borderColor: C.accentGreen }}>
                <span style={{ color: C.accentGreen, fontSize: 13 }}>✅ 你已评价 · 评分 {game.userRating.score}/10</span>
              </div>
            )}
            {!user && <div style={{ ...S.card, marginBottom: 24, textAlign: 'center' }}><Link to="/login" style={{ color: C.yellow }}>登录后评价</Link></div>}
            {user && !game.userVerified && <div style={{ ...S.card, marginBottom: 24, textAlign: 'center', color: C.textMuted }}>需要认证为该游戏玩家后才能评价</div>}

            {/* Ratings list */}
            {game.ratings?.map(r => (
              <div key={r.id} style={{ ...S.card, padding: 16 }}>
                <div style={S.flexBetween}>
                  <div style={S.flex}>
                    <div style={{ ...S.avatar, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${C.yellow}, ${C.accent})`, color: C.dark, fontWeight: 700, fontSize: 13 }}>{(r.nickname || '?')[0]}</div>
                    <div>
                      <div style={{ color: C.white, fontSize: 14, fontWeight: 500 }}>{r.nickname}</div>
                      <div style={{ color: C.textMuted, fontSize: 11 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span style={{ color: C.yellow, fontWeight: 700 }}>★ {r.score}</span>
                </div>
                {r.comment && <p style={{ color: C.text, margin: '10px 0 0', fontSize: 14, lineHeight: 1.6 }}>{r.comment}</p>}
              </div>
            ))}
            {(!game.ratings || game.ratings.length === 0) && <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>暂无评价</div>}
          </div>
        )}

        {tab === 'events' && (
          <div>
            {game.events?.map(ev => (
              <div key={ev.id} style={S.card}>
                <div style={S.flexBetween}>
                  <h3 style={{ color: C.white, margin: 0 }}>{ev.title}</h3>
                  <span style={{ ...S.tag, background: ev.status === 'open' ? 'rgba(80,250,123,0.15)' : 'rgba(255,85,85,0.15)', color: ev.status === 'open' ? C.accentGreen : C.red }}>
                    {ev.status === 'open' ? '报名中' : ev.status === 'closed' ? '报名已关闭' : '已结束'}
                  </span>
                </div>
                <p style={{ color: C.textMuted, margin: '8px 0', fontSize: 14 }}>{ev.description}</p>
                <div style={{ ...S.flex, fontSize: 13, color: C.textMuted }}>
                  <span>📅 {ev.event_date || '待定'}</span>
                  <span>📍 {ev.location || '待定'}</span>
                  {ev.max_participants > 0 && <span>👥 限{ev.max_participants}人</span>}
                </div>
                {user && ev.status === 'open' && <button onClick={() => handleEventRegister(ev.id)} style={{ ...S.btn, ...S.btnSmall, marginTop: 12 }}>立即报名</button>}
              </div>
            ))}
          </div>
        )}

        {/* Card detail modal */}
        <Modal show={!!cardModal} onClose={() => setCardModal(null)} title={cardModal?.name} width={550}>
          {cardModal && (
            <div>
              {cardModal.image && <img src={cardModal.image} alt={cardModal.name} style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} />}
              <span style={{ ...S.tag, background: 'rgba(98,114,164,0.2)', color: C.blue }}>{cardModal.card_type}</span>
              <p style={{ color: C.text, margin: '12px 0', lineHeight: 1.6 }}>{cardModal.description || '暂无描述'}</p>
              {cardModal.avg_score > 0 && <div style={{ marginBottom: 12 }}><StarRating value={cardModal.avg_score} readonly /></div>}

              {user && game.userVerified && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 16 }}>
                  <h4 style={{ color: C.yellow, margin: '0 0 8px' }}>评价这张卡牌</h4>
                  <StarRating value={cardScore} onChange={setCardScore} size={20} />
                  <textarea style={{ ...S.textarea, marginTop: 8, minHeight: 60 }} value={cardComment} onChange={e => setCardComment(e.target.value)} placeholder="你对这张卡牌的评价..." />
                  <button onClick={handleCardRate} style={{ ...S.btn, ...S.btnSmall, marginTop: 8 }} disabled={!cardScore}>提交</button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
