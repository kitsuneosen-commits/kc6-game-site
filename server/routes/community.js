import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

export default function communityRouter(db) {
  const router = Router();

  // List posts
  router.get('/posts', optionalAuth, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const posts = db.prepare(`SELECT cp.*, u.nickname, u.avatar FROM community_posts cp JOIN users u ON cp.user_id = u.id ORDER BY cp.created_at DESC LIMIT ? OFFSET ?`).all(limit, offset);
    const total = db.prepare('SELECT COUNT(*) as c FROM community_posts').get().c;
    // Check if current user liked each post
    const result = posts.map(p => {
      let liked = false;
      if (req.user) {
        liked = !!db.prepare("SELECT id FROM likes WHERE user_id = ? AND target_type = 'post' AND target_id = ?").get(req.user.id, p.id);
      }
      return { ...p, liked, attachments: JSON.parse(p.attachments || '[]') };
    });
    res.json({ posts: result, total, page, totalPages: Math.ceil(total / limit) });
  });

  // Get single post with comments
  router.get('/posts/:id', optionalAuth, (req, res) => {
    const post = db.prepare(`SELECT cp.*, u.nickname, u.avatar FROM community_posts cp JOIN users u ON cp.user_id = u.id WHERE cp.id = ?`).get(req.params.id);
    if (!post) return res.status(404).json({ error: '帖子不存在' });
    const comments = db.prepare(`SELECT c.*, u.nickname, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC`).all(post.id);
    let liked = false;
    if (req.user) {
      liked = !!db.prepare("SELECT id FROM likes WHERE user_id = ? AND target_type = 'post' AND target_id = ?").get(req.user.id, post.id);
    }
    const commentsWithLike = comments.map(c => {
      let cLiked = false;
      if (req.user) {
        cLiked = !!db.prepare("SELECT id FROM likes WHERE user_id = ? AND target_type = 'comment' AND target_id = ?").get(req.user.id, c.id);
      }
      return { ...c, liked: cLiked };
    });
    res.json({ ...post, attachments: JSON.parse(post.attachments || '[]'), liked, comments: commentsWithLike });
  });

  // Create post
  router.post('/posts', authMiddleware, (req, res) => {
    const { title, content, attachments } = req.body;
    if (!title || !content) return res.status(400).json({ error: '标题和内容必填' });
    const info = db.prepare('INSERT INTO community_posts (user_id, title, content, attachments) VALUES (?,?,?,?)').run(req.user.id, title, content, JSON.stringify(attachments || []));
    res.json({ id: info.lastInsertRowid });
  });

  // Comment on post
  router.post('/posts/:id/comments', authMiddleware, (req, res) => {
    const { content, parent_id } = req.body;
    if (!content) return res.status(400).json({ error: '评论内容必填' });
    const info = db.prepare('INSERT INTO comments (post_id, user_id, content, parent_id) VALUES (?,?,?,?)').run(req.params.id, req.user.id, content, parent_id || null);
    db.prepare('UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = ?').run(req.params.id);
    // Notify post author
    const post = db.prepare('SELECT user_id FROM community_posts WHERE id = ?').get(req.params.id);
    if (post && post.user_id !== req.user.id) {
      const me = db.prepare('SELECT nickname FROM users WHERE id = ?').get(req.user.id);
      db.prepare("INSERT INTO messages (from_user_id, to_user_id, msg_type, title, content) VALUES (?, ?, 'comment_reply', '新评论', ?)").run(req.user.id, post.user_id, `${me.nickname} 评论了你的帖子`);
    }
    res.json({ id: info.lastInsertRowid });
  });

  // Like post
  router.post('/posts/:id/like', authMiddleware, (req, res) => {
    const existing = db.prepare("SELECT id FROM likes WHERE user_id = ? AND target_type = 'post' AND target_id = ?").get(req.user.id, req.params.id);
    if (existing) {
      db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
      db.prepare('UPDATE community_posts SET like_count = MAX(0, like_count - 1) WHERE id = ?').run(req.params.id);
      res.json({ liked: false });
    } else {
      db.prepare("INSERT INTO likes (user_id, target_type, target_id) VALUES (?, 'post', ?)").run(req.user.id, req.params.id);
      db.prepare('UPDATE community_posts SET like_count = like_count + 1 WHERE id = ?').run(req.params.id);
      const post = db.prepare('SELECT user_id FROM community_posts WHERE id = ?').get(req.params.id);
      if (post && post.user_id !== req.user.id) {
        const me = db.prepare('SELECT nickname FROM users WHERE id = ?').get(req.user.id);
        db.prepare("INSERT INTO messages (from_user_id, to_user_id, msg_type, title, content) VALUES (?, ?, 'like', '收到点赞', ?)").run(req.user.id, post.user_id, `${me.nickname} 赞了你的帖子`);
      }
      res.json({ liked: true });
    }
  });

  // Like comment
  router.post('/comments/:id/like', authMiddleware, (req, res) => {
    const existing = db.prepare("SELECT id FROM likes WHERE user_id = ? AND target_type = 'comment' AND target_id = ?").get(req.user.id, req.params.id);
    if (existing) {
      db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
      db.prepare('UPDATE comments SET like_count = MAX(0, like_count - 1) WHERE id = ?').run(req.params.id);
      res.json({ liked: false });
    } else {
      db.prepare("INSERT INTO likes (user_id, target_type, target_id) VALUES (?, 'comment', ?)").run(req.user.id, req.params.id);
      db.prepare('UPDATE comments SET like_count = like_count + 1 WHERE id = ?').run(req.params.id);
      res.json({ liked: true });
    }
  });

  // Honor board
  router.get('/honors', (req, res) => {
    const honors = db.prepare(`SELECT h.*, u.nickname, u.avatar, g.title as game_title FROM honors h JOIN users u ON h.user_id = u.id JOIN games g ON h.game_id = g.id ORDER BY h.awarded_at DESC LIMIT 50`).all();
    res.json(honors);
  });

  return router;
}
