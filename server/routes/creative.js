import { Router } from 'express';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export default function creativeRouter(db) {
  const router = Router();

  // Submit creative idea
  router.post('/', authMiddleware, (req, res) => {
    const { title, content, attachments } = req.body;
    if (!title || !content) return res.status(400).json({ error: '标题和内容必填' });
    const info = db.prepare('INSERT INTO creative_submissions (user_id, title, content, attachments) VALUES (?,?,?,?)').run(req.user.id, title, content, JSON.stringify(attachments || []));
    res.json({ id: info.lastInsertRowid });
  });

  // My submissions
  router.get('/mine', authMiddleware, (req, res) => {
    const list = db.prepare('SELECT * FROM creative_submissions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(list.map(s => ({ ...s, attachments: JSON.parse(s.attachments || '[]') })));
  });

  // Admin: list all submissions
  router.get('/admin/all', authMiddleware, adminOnly, (req, res) => {
    const list = db.prepare(`SELECT cs.*, u.nickname, u.mis_id FROM creative_submissions cs JOIN users u ON cs.user_id = u.id ORDER BY cs.created_at DESC`).all();
    res.json(list.map(s => ({ ...s, attachments: JSON.parse(s.attachments || '[]') })));
  });

  // Admin: review submission
  router.put('/:id/review', authMiddleware, adminOnly, (req, res) => {
    const { status, review_note } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: '无效状态' });
    db.prepare("UPDATE creative_submissions SET status = ?, review_note = ?, reviewed_by = ?, updated_at = datetime('now') WHERE id = ?").run(status, review_note, req.user.id, req.params.id);
    const sub = db.prepare('SELECT user_id, title FROM creative_submissions WHERE id = ?').get(req.params.id);
    if (sub) {
      db.prepare("INSERT INTO messages (from_user_id, to_user_id, msg_type, title, content) VALUES (?, ?, 'system', ?, ?)").run(
        req.user.id, sub.user_id,
        '创意审核结果',
        `你的创意「${sub.title}」已被${status === 'approved' ? '通过' : '拒绝'}${review_note ? `，备注：${review_note}` : ''}`
      );
    }
    res.json({ success: true });
  });

  return router;
}
