import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';

export default function usersRouter(db) {
  const router = Router();

  // Register
  router.post('/register', (req, res) => {
    const { mis_id, password, nickname } = req.body;
    if (!mis_id || !password) return res.status(400).json({ error: 'mis_id和密码必填' });
    const existing = db.prepare('SELECT id FROM users WHERE mis_id = ?').get(mis_id);
    if (existing) return res.status(409).json({ error: '该MIS ID已注册' });
    // 第一个注册的用户自动成为管理员
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const role = userCount === 0 ? 'admin' : 'player';
    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare('INSERT INTO users (mis_id, nickname, password_hash, role) VALUES (?, ?, ?, ?)').run(mis_id, nickname || mis_id, hash, role);
    const user = db.prepare('SELECT id, mis_id, nickname, role FROM users WHERE id = ?').get(info.lastInsertRowid);
    if (role === 'admin') {
      console.log(`[KC-6] 🔑 首位用户 "${mis_id}" 已自动设为管理员`);
    }
    res.json({ token: generateToken(user), user });
  });

  // Login
  router.post('/login', (req, res) => {
    const { mis_id, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE mis_id = ?').get(mis_id);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: '账号或密码错误' });
    }
    const { password_hash, ...safeUser } = user;
    res.json({ token: generateToken(user), user: safeUser });
  });

  // Get current user profile
  router.get('/me', (req, res) => {
    const user = db.prepare('SELECT id, mis_id, nickname, avatar, gender, bio, role, points, nickname_changed_at, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    const games = db.prepare(`SELECT pg.*, g.title, g.cover FROM player_games pg JOIN games g ON pg.game_id = g.id WHERE pg.user_id = ? AND pg.verified = 1`).all(req.user.id);
    const honors = db.prepare(`SELECT h.*, g.title as game_title FROM honors h JOIN games g ON h.game_id = g.id WHERE h.user_id = ?`).all(req.user.id);
    res.json({ ...user, is_admin: user.role === 'admin', is_verified: user.role === 'verified' || user.role === 'admin', title: user.role === 'admin' ? 'master' : 'active', games, honors });
  });

  // Update profile
  router.put('/me', (req, res) => {
    const { nickname, avatar, gender, bio } = req.body;
    const user = db.prepare('SELECT nickname_changed_at FROM users WHERE id = ?').get(req.user.id);
    if (nickname && user.nickname_changed_at) {
      const last = new Date(user.nickname_changed_at);
      const diff = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
      if (diff < 30) return res.status(400).json({ error: `昵称修改冷却中，还需${Math.ceil(30 - diff)}天` });
    }
    const updates = [];
    const values = [];
    if (nickname) { updates.push('nickname = ?'); values.push(nickname); updates.push("nickname_changed_at = datetime('now')"); }
    if (avatar) { updates.push('avatar = ?'); values.push(avatar); }
    if (gender) { updates.push('gender = ?'); values.push(gender); }
    if (bio !== undefined) { updates.push('bio = ?'); values.push(bio); }
    if (updates.length === 0) return res.status(400).json({ error: '没有要更新的字段' });
    updates.push("updated_at = datetime('now')");
    values.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json({ success: true });
  });

  // Get user public profile (by id or mis_id)
  router.get('/:id', (req, res) => {
    let user = db.prepare('SELECT id, mis_id, nickname, avatar, gender, bio, role, points, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) user = db.prepare('SELECT id, mis_id, nickname, avatar, gender, bio, role, points, created_at FROM users WHERE mis_id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    const games = db.prepare(`SELECT pg.*, g.title, g.cover FROM player_games pg JOIN games g ON pg.game_id = g.id WHERE pg.user_id = ? AND pg.verified = 1`).all(user.id);
    const honors = db.prepare(`SELECT h.*, g.title as game_title FROM honors h JOIN games g ON h.game_id = g.id WHERE h.user_id = ?`).all(user.id);
    res.json({ ...user, is_admin: user.role === 'admin', is_verified: user.role === 'verified' || user.role === 'admin', games, honors });
  });

  // Admin: award points & title to user
  router.post('/admin/award', (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
    const { user_mis_id, mis_id, game_id, points, title, reason } = req.body;
    const targetMis = user_mis_id || mis_id;
    if (!targetMis) return res.status(400).json({ error: '请指定用户 MIS ID' });
    const target = db.prepare('SELECT id FROM users WHERE mis_id = ?').get(targetMis);
    if (!target) return res.status(404).json({ error: '用户不存在' });

    // If game_id provided, ensure player_games record
    if (game_id) {
      const pg = db.prepare('SELECT id FROM player_games WHERE user_id = ? AND game_id = ?').get(target.id, game_id);
      if (!pg) {
        db.prepare("INSERT INTO player_games (user_id, game_id, verified, verified_at) VALUES (?, ?, 1, datetime('now'))").run(target.id, game_id);
      } else {
        db.prepare("UPDATE player_games SET verified = 1, verified_at = datetime('now') WHERE user_id = ? AND game_id = ?").run(target.id, game_id);
      }
      if (points) {
        db.prepare('UPDATE player_games SET points_earned = points_earned + ? WHERE user_id = ? AND game_id = ?').run(points, target.id, game_id);
      }
      if (title) {
        db.prepare('UPDATE player_games SET title = ? WHERE user_id = ? AND game_id = ?').run(title, target.id, game_id);
        db.prepare("INSERT INTO honors (user_id, game_id, achievement) VALUES (?, ?, ?)").run(target.id, game_id, title);
      }
    }

    if (points) {
      db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(points, target.id);
    }

    // Send notification
    const desc = reason || `${points ? `增加了${points}积分` : ''}${points && title ? '，' : ''}${title ? `授予了称号「${title}」` : ''}`;
    db.prepare("INSERT INTO messages (from_user_id, to_user_id, msg_type, title, content) VALUES (?, ?, 'notification', ?, ?)").run(
      req.user.id, target.id, '积分/称号更新', `管理员为你${desc}`
    );
    res.json({ success: true });
  });

  // Admin: verify player for a game (or just set verified flag)
  router.post('/admin/verify-player', (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
    const { user_id, mis_id, game_id } = req.body;
    let targetId = user_id;
    if (!targetId && mis_id) {
      const u = db.prepare('SELECT id FROM users WHERE mis_id = ?').get(mis_id);
      if (!u) return res.status(404).json({ error: '用户不存在' });
      targetId = u.id;
    }
    if (!targetId) return res.status(400).json({ error: '请指定用户' });
    // If no game_id, just mark user as verified
    if (!game_id) {
      db.prepare("UPDATE users SET role = CASE WHEN role = 'admin' THEN 'admin' ELSE 'verified' END WHERE id = ?").run(targetId);
      return res.json({ success: true });
    }
    const pg = db.prepare('SELECT id FROM player_games WHERE user_id = ? AND game_id = ?').get(targetId, game_id);
    if (pg) {
      db.prepare("UPDATE player_games SET verified = 1, verified_at = datetime('now') WHERE user_id = ? AND game_id = ?").run(targetId, game_id);
    } else {
      db.prepare("INSERT INTO player_games (user_id, game_id, verified, verified_at) VALUES (?, ?, 1, datetime('now'))").run(targetId, game_id);
    }
    res.json({ success: true });
  });

  // Player request to be verified for a game
  router.post('/request-verify', (req, res) => {
    const { game_id } = req.body;
    const existing = db.prepare('SELECT id, verified FROM player_games WHERE user_id = ? AND game_id = ?').get(req.user.id, game_id);
    if (existing && existing.verified) return res.json({ message: '已认证' });
    if (!existing) {
      db.prepare("INSERT INTO player_games (user_id, game_id, verified) VALUES (?, ?, 0)").run(req.user.id, game_id);
    }
    res.json({ success: true, message: '认证申请已提交，等待管理员审核' });
  });

  // Admin: list pending verifications
  router.get('/admin/pending-verifications', (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
    const list = db.prepare(`SELECT pg.*, u.mis_id, u.nickname, g.title as game_title FROM player_games pg JOIN users u ON pg.user_id = u.id JOIN games g ON pg.game_id = g.id WHERE pg.verified = 0`).all();
    res.json(list);
  });

  return router;
}
