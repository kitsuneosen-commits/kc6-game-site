import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../api.js';
import { C } from '../styles.js';

export default function Nav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      api.getUnreadCount().then(d => setUnread(d.count)).catch(() => {});
      const interval = setInterval(() => {
        api.getUnreadCount().then(d => setUnread(d.count)).catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const links = [
    { to: '/', label: '首页', icon: '🏠' },
    { to: '/games', label: '游戏专区', icon: '🎮' },
    { to: '/community', label: '玩家社区', icon: '💬' },
    { to: '/creative', label: '创意收集', icon: '💡' },
    { to: '/shop', label: '积分商城', icon: '🛒' },
  ];

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <nav style={{ background: 'rgba(15,15,35,0.95)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🎮</span>
          <span style={{ fontSize: 20, fontWeight: 800, background: `linear-gradient(135deg, ${C.yellow}, ${C.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KC-6游戏站</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {links.map(l => (
            <Link key={l.to} to={l.to} style={{ textDecoration: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 14, color: isActive(l.to) ? C.yellow : C.textMuted, background: isActive(l.to) ? 'rgba(255,215,0,0.1)' : 'transparent', fontWeight: isActive(l.to) ? 600 : 400, transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
              <span style={{ marginRight: 4 }}>{l.icon}</span>{l.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <Link to="/messages" style={{ textDecoration: 'none', position: 'relative', padding: 6 }}>
                <span style={{ fontSize: 20 }}>🔔</span>
                {unread > 0 && <span style={{ position: 'absolute', top: 0, right: 0, background: C.red, color: C.white, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{unread > 9 ? '9+' : unread}</span>}
              </Link>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${C.yellow}, ${C.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: C.dark, fontWeight: 700 }}>{(user.nickname || user.mis_id)[0].toUpperCase()}</div>
                  <span style={{ color: C.text, fontSize: 14 }}>{user.nickname || user.mis_id}</span>
                </button>
                {menuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 44, background: C.darkCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 8, minWidth: 160, boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }} onMouseLeave={() => setMenuOpen(false)}>
                    <Link to="/profile" style={{ display: 'block', padding: '10px 16px', color: C.text, textDecoration: 'none', borderRadius: 8, fontSize: 14 }} onClick={() => setMenuOpen(false)}>👤 个人中心</Link>
                    <Link to="/messages" style={{ display: 'block', padding: '10px 16px', color: C.text, textDecoration: 'none', borderRadius: 8, fontSize: 14 }} onClick={() => setMenuOpen(false)}>📨 私信 {unread > 0 && `(${unread})`}</Link>
                    <Link to="/orders" style={{ display: 'block', padding: '10px 16px', color: C.text, textDecoration: 'none', borderRadius: 8, fontSize: 14 }} onClick={() => setMenuOpen(false)}>📦 我的订单</Link>
                    {user.is_admin && <Link to="/admin" style={{ display: 'block', padding: '10px 16px', color: C.yellow, textDecoration: 'none', borderRadius: 8, fontSize: 14 }} onClick={() => setMenuOpen(false)}>⚙️ 管理后台</Link>}
                    <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
                    <button onClick={() => { logout(); setMenuOpen(false); }} style={{ display: 'block', width: '100%', padding: '10px 16px', color: C.red, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: 14 }}>🚪 退出登录</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" style={{ textDecoration: 'none', background: `linear-gradient(135deg, ${C.yellow}, ${C.yellowHover})`, color: C.dark, padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>登录 / 注册</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
