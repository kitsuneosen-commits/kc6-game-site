import { Router } from 'express';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export default function messagesRouter(db) {
  const router = Router();

  // Get my messages
  router.get('/', authMiddleware, (req, res) => {
    const type = req.query.type;
    if (type === 'sent') {
      const msgs = db.prepare(`SELECT m.*, u.nickname as to_nickname, u.mis_id as to_mis_id FROM messages m LEFT JOIN users u ON m.to_user_id = u.id WHERE m.from_user_id = ? AND m.msg_type = 'private' ORDER BY m.created_at DESC LIMIT 100`).all(req.user.id);
      return res.json(msgs);
    }
    let sql = `SELECT m.*, u.nickname as from_nickname, u.avatar as from_avatar, u.mis_id as from_mis_id FROM messages m LEFT JOIN users u ON m.from_user_id = u.id WHERE m.to_user_id = ?`;
    const params = [req.user.id];
    if (type === 'received') { sql += " AND m.msg_type = 'private'"; }
    else if (type === 'notification') { sql += " AND m.msg_type = 'notification'"; }
    else if (type === 'announcement') { sql += " AND m.msg_type = 'announcement'"; }
    else if (type) { sql += ' AND m.msg_type = ?'; params.push(type); }
    sql += ' ORDER BY m.created_at DESC LIMIT 100';
    const msgs = db.prepare(sql).all(...params);
    res.json(msgs);
  });

  // Unread count
  router.get('/unread-count', authMiddleware, (req, res) => {
    const result = db.prepare('SELECT COUNT(*) as c FROM messages WHERE to_user_id = ? AND is_read = 0').get(req.user.id);
    res.json({ count: result.c });
  });

  // Mark as read
  router.put('/:id/read', authMiddleware, (req, res) => {
    db.prepare('UPDATE messages SET is_read = 1 WHERE id = ? AND to_user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Mark all as read
  router.put('/read-all', authMiddleware, (req, res) => {
    db.prepare('UPDATE messages SET is_read = 1 WHERE to_user_id = ? AND is_read = 0').run(req.user.id);
    res.json({ success: true });
  });

  // Send private message
  router.post('/send', authMiddleware, (req, res) => {
    const { to_user_id, to_mis_id, subject, content } = req.body;
    if (!content) return res.status(400).json({ error: '内容必填' });
    let target;
    if (to_mis_id) {
      target = db.prepare('SELECT id FROM users WHERE mis_id = ?').get(to_mis_id);
    } else if (to_user_id) {
      target = db.prepare('SELECT id FROM users WHERE id = ?').get(to_user_id);
    }
    if (!target) return res.status(404).json({ error: '用户不存在' });
    const me = db.prepare('SELECT nickname FROM users WHERE id = ?').get(req.user.id);
    const title = subject || `来自 ${me.nickname} 的私信`;
    db.prepare("INSERT INTO messages (from_user_id, to_user_id, msg_type, title, content) VALUES (?, ?, 'private', ?, ?)").run(req.user.id, target.id, title, content);
    res.json({ success: true });
  });

  // Admin: send announcement
  router.post('/announcement', authMiddleware, adminOnly, (req, res) => {
    const { title, content } = req.body;
    const users = db.prepare('SELECT id FROM users').all();
    const insert = db.prepare("INSERT INTO messages (from_user_id, to_user_id, msg_type, title, content) VALUES (?, ?, 'announcement', ?, ?)");
    const tx = db.transaction(() => {
      for (const u of users) {
        insert.run(req.user.id, u.id, title || '全站公告', content);
      }
    });
    tx();
    res.json({ success: true, sent: users.length });
  });

  return router;
}
