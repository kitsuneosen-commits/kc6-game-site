import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../api.js';
import { C, S } from '../styles.js';
import Modal from '../components/Modal.jsx';
import { Link } from 'react-router-dom';

export default function Shop() {
  const { user, refreshUser } = useAuth();
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('shop');
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    api.shopItems().then(setItems).catch(() => {});
    if (user) api.myOrders().then(setOrders).catch(() => {});
  }, [user]);

  const handleBuy = async (item) => {
    try {
      await api.purchaseItem(item.id);
      setMsg(`✅ 成功兑换「${item.name}」`);
      setConfirm(null);
      api.myOrders().then(setOrders);
      if (refreshUser) refreshUser();
    } catch (e) {
      setMsg(`❌ ${e.message}`);
      setConfirm(null);
    }
  };

  const statusMap = { pending: '处理中', completed: '已完成', cancelled: '已取消' };

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={{ padding: '40px 0 20px' }}>
          <h1 style={{ color: C.purple, margin: '0 0 8px' }}>🛒 积分商店</h1>
          <p style={{ color: C.textMuted, margin: 0 }}>使用积分兑换专属奖励</p>
          {user && <p style={{ color: C.yellow, margin: '8px 0 0', fontSize: 14 }}>💰 当前积分：{user.points || 0}</p>}
        </div>

        {msg && <div style={{ background: 'rgba(255,215,0,0.08)', border: `1px solid ${C.yellow}`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: C.yellow, fontSize: 13 }} onClick={() => setMsg('')}>{msg}</div>}

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['shop', 'orders'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ ...S.btn, ...(tab !== t ? S.btnOutline : {}) }}>
              {t === 'shop' ? '🏪 商品' : '📦 我的订单'}
            </button>
          ))}
        </div>

        {tab === 'shop' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {items.length === 0 ? (
              <div style={{ ...S.card, gridColumn: '1/-1', textAlign: 'center', padding: 40, color: C.textMuted }}>暂无商品，敬请期待</div>
            ) : items.map(item => (
              <div key={item.id} style={{ ...S.card, display: 'flex', flexDirection: 'column' }}>
                {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />}
                <h4 style={{ color: C.white, margin: '0 0 6px' }}>{item.name}</h4>
                <p style={{ color: C.textMuted, fontSize: 13, margin: '0 0 12px', flex: 1 }}>{item.description}</p>
                <div style={S.flexBetween}>
                  <span style={{ color: C.yellow, fontWeight: 700 }}>💰 {item.price} 积分</span>
                  <span style={{ color: C.textMuted, fontSize: 12 }}>库存 {item.stock}</span>
                </div>
                {user ? (
                  <button onClick={() => setConfirm(item)} style={{ ...S.btn, marginTop: 12, width: '100%' }}
                    disabled={item.stock <= 0 || (user.points || 0) < item.price}>
                    {item.stock <= 0 ? '已售罄' : (user.points || 0) < item.price ? '积分不足' : '立即兑换'}
                  </button>
                ) : (
                  <Link to="/login" style={{ ...S.btn, ...S.btnOutline, marginTop: 12, width: '100%', textDecoration: 'none', display: 'block', textAlign: 'center' }}>登录后兑换</Link>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'orders' && (
          !user ? (
            <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
              <p style={{ color: C.textMuted }}>请先登录</p>
              <Link to="/login" style={{ ...S.btn, textDecoration: 'none' }}>去登录</Link>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ ...S.card, textAlign: 'center', padding: 40, color: C.textMuted }}>还没有订单</div>
          ) : (
            orders.map(o => (
              <div key={o.id} style={S.card}>
                <div style={S.flexBetween}>
                  <h4 style={{ color: C.white, margin: 0 }}>{o.item_name}</h4>
                  <span style={{ ...S.tag, color: o.status === 'completed' ? C.accentGreen : C.yellow }}>{statusMap[o.status]}</span>
                </div>
                <div style={{ marginTop: 8, color: C.textMuted, fontSize: 13 }}>
                  <span>花费 {o.total_price} 积分</span>
                  <span style={{ marginLeft: 16 }}>x{o.quantity}</span>
                  <span style={{ marginLeft: 16 }}>{new Date(o.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )
        )}

        <Modal show={!!confirm} onClose={() => setConfirm(null)} title="确认兑换">
          {confirm && (
            <div>
              <p style={{ color: C.textSecondary }}>确定要用 <span style={{ color: C.yellow, fontWeight: 700 }}>{confirm.price} 积分</span> 兑换「{confirm.name}」吗？</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button onClick={() => handleBuy(confirm)} style={S.btn}>确认兑换</button>
                <button onClick={() => setConfirm(null)} style={{ ...S.btn, ...S.btnOutline }}>取消</button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
