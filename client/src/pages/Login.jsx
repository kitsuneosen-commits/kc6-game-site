import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { C, S } from '../styles.js';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [misId, setMisId] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(misId, password, nickname || misId);
      } else {
        await login(misId, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...S.card, maxWidth: 420, width: '90%', padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 48 }}>🎮</span>
          <h2 style={{ margin: '12px 0 4px', color: C.yellow, fontSize: 24 }}>KC-6游戏站</h2>
          <p style={{ color: C.textMuted, margin: 0, fontSize: 14 }}>{isRegister ? '创建新账号' : '欢迎回来'}</p>
        </div>

        {error && <div style={{ background: 'rgba(255,85,85,0.1)', border: `1px solid ${C.red}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: C.red, fontSize: 13 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={S.formGroup}>
            <label style={S.label}>MIS ID</label>
            <input style={S.input} value={misId} onChange={e => setMisId(e.target.value)} placeholder="输入你的MIS ID" required />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>密码</label>
            <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="输入密码" required />
          </div>
          {isRegister && (
            <div style={S.formGroup}>
              <label style={S.label}>昵称（可选）</label>
              <input style={S.input} value={nickname} onChange={e => setNickname(e.target.value)} placeholder="给自己取个昵称" />
            </div>
          )}
          <button type="submit" style={{ ...S.btn, width: '100%', padding: 14, fontSize: 16, marginTop: 8 }} disabled={loading}>
            {loading ? '处理中...' : isRegister ? '注册' : '登录'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => { setIsRegister(!isRegister); setError(''); }} style={{ background: 'none', border: 'none', color: C.yellow, cursor: 'pointer', fontSize: 14 }}>
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
        </div>
      </div>
    </div>
  );
}
