import { Router } from 'express';
import { authMiddleware, optionalAuth, adminOnly } from '../middleware/auth.js';

export default function gamesRouter(db) {
  const router = Router();

  // List all games
  router.get('/', optionalAuth, (req, res) => {
    const games = db.prepare('SELECT * FROM games ORDER BY created_at DESC').all();
    res.json(games);
  });

  // Get single game with cards, props, events
  router.get('/:id', optionalAuth, (req, res) => {
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
    if (!game) return res.status(404).json({ error: '游戏不存在' });
    const cards = db.prepare('SELECT * FROM cards WHERE game_id = ? ORDER BY sort_order').all(game.id);
    const props = db.prepare('SELECT * FROM game_props WHERE game_id = ? ORDER BY sort_order').all(game.id);
    const ratings = db.prepare(`SELECT gr.*, u.nickname, u.avatar FROM game_ratings gr JOIN users u ON gr.user_id = u.id WHERE gr.game_id = ? ORDER BY gr.created_at DESC`).all(game.id);
    const events = db.prepare('SELECT * FROM events WHERE game_id = ? ORDER BY event_date DESC').all(game.id);
    let userVerified = false;
    let userRating = null;
    if (req.user) {
      const pg = db.prepare('SELECT verified FROM player_games WHERE user_id = ? AND game_id = ?').get(req.user.id, game.id);
      userVerified = pg ? pg.verified === 1 : false;
      userRating = db.prepare('SELECT * FROM game_ratings WHERE user_id = ? AND game_id = ?').get(req.user.id, game.id);
    }
    res.json({ ...game, cards, props, ratings, events, userVerified, userRating });
  });

  // Admin: create game
  router.post('/', authMiddleware, adminOnly, (req, res) => {
    const { title, cover, summary, rules, background, game_type, is_card_game } = req.body;
    const info = db.prepare('INSERT INTO games (title, cover, summary, rules, background, game_type, is_card_game, created_by) VALUES (?,?,?,?,?,?,?,?)').run(title, cover, summary, rules, background, game_type || 'board', is_card_game ? 1 : 0, req.user.id);
    // Notify all users about new game
    const users = db.prepare('SELECT id FROM users WHERE id != ?').all(req.user.id);
    const insert = db.prepare("INSERT INTO messages (from_user_id, to_user_id, msg_type, title, content) VALUES (?, ?, 'game_update', ?, ?)");
    const tx = db.transaction(() => {
      for (const u of users) {
        insert.run(req.user.id, u.id, '新游戏上线', `新游戏「${title}」已上线，快来看看吧！`);
      }
    });
    tx();
    res.json({ id: info.lastInsertRowid });
  });

  // Admin: update game
  router.put('/:id', authMiddleware, adminOnly, (req, res) => {
    const { title, cover, summary, rules, background, game_type, is_card_game } = req.body;
    db.prepare("UPDATE games SET title=?, cover=?, summary=?, rules=?, background=?, game_type=?, is_card_game=?, updated_at=datetime('now') WHERE id=?").run(title, cover, summary, rules, background, game_type, is_card_game ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  // Admin: delete game
  router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
    db.prepare('DELETE FROM games WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Admin: add card
  router.post('/:id/cards', authMiddleware, adminOnly, (req, res) => {
    const { name, image, description, card_type, sort_order } = req.body;
    const info = db.prepare('INSERT INTO cards (game_id, name, image, description, card_type, sort_order) VALUES (?,?,?,?,?,?)').run(req.params.id, name, image, description, card_type || 'normal', sort_order || 0);
    res.json({ id: info.lastInsertRowid });
  });

  // Admin: add prop
  router.post('/:id/props', authMiddleware, adminOnly, (req, res) => {
    const { name, image, description, sort_order } = req.body;
    const info = db.prepare('INSERT INTO game_props (game_id, name, image, description, sort_order) VALUES (?,?,?,?,?)').run(req.params.id, name, image, description, sort_order || 0);
    res.json({ id: info.lastInsertRowid });
  });

  // Rate a game (must be verified player)
  router.post('/:id/rate', authMiddleware, (req, res) => {
    const { score, comment } = req.body;
    if (!score || score < 1 || score > 10) return res.status(400).json({ error: '评分1-10' });
    const pg = db.prepare('SELECT verified FROM player_games WHERE user_id = ? AND game_id = ?').get(req.user.id, req.params.id);
    if (!pg || !pg.verified) return res.status(403).json({ error: '需要先认证为该游戏玩家' });
    const existing = db.prepare('SELECT id FROM game_ratings WHERE user_id = ? AND game_id = ?').get(req.user.id, req.params.id);
    if (existing) {
      db.prepare('UPDATE game_ratings SET score = ?, comment = ? WHERE id = ?').run(score, comment, existing.id);
    } else {
      db.prepare('INSERT INTO game_ratings (game_id, user_id, score, comment) VALUES (?,?,?,?)').run(req.params.id, req.user.id, score, comment);
    }
    // Update avg
    const stats = db.prepare('SELECT AVG(score) as avg, COUNT(*) as cnt FROM game_ratings WHERE game_id = ?').get(req.params.id);
    db.prepare('UPDATE games SET avg_score = ?, total_ratings = ? WHERE id = ?').run(Math.round(stats.avg * 10) / 10, stats.cnt, req.params.id);
    res.json({ success: true });
  });

  // Rate a card
  router.post('/cards/:cardId/rate', authMiddleware, (req, res) => {
    const { score, comment } = req.body;
    if (!score || score < 1 || score > 10) return res.status(400).json({ error: '评分1-10' });
    const card = db.prepare('SELECT game_id FROM cards WHERE id = ?').get(req.params.cardId);
    if (!card) return res.status(404).json({ error: '卡牌不存在' });
    const pg = db.prepare('SELECT verified FROM player_games WHERE user_id = ? AND game_id = ?').get(req.user.id, card.game_id);
    if (!pg || !pg.verified) return res.status(403).json({ error: '需要先认证为该游戏玩家' });
    const existing = db.prepare('SELECT id FROM card_ratings WHERE user_id = ? AND card_id = ?').get(req.user.id, req.params.cardId);
    if (existing) {
      db.prepare('UPDATE card_ratings SET score = ?, comment = ? WHERE id = ?').run(score, comment, existing.id);
    } else {
      db.prepare('INSERT INTO card_ratings (card_id, user_id, score, comment) VALUES (?,?,?,?)').run(req.params.cardId, req.user.id, score, comment);
    }
    const stats = db.prepare('SELECT AVG(score) as avg, COUNT(*) as cnt FROM card_ratings WHERE card_id = ?').get(req.params.cardId);
    db.prepare('UPDATE cards SET avg_score = ?, total_ratings = ? WHERE id = ?').run(Math.round(stats.avg * 10) / 10, stats.cnt, req.params.cardId);
    res.json({ success: true });
  });

  // Get card ratings
  router.get('/cards/:cardId/ratings', (req, res) => {
    const ratings = db.prepare(`SELECT cr.*, u.nickname, u.avatar FROM card_ratings cr JOIN users u ON cr.user_id = u.id WHERE cr.card_id = ? ORDER BY cr.created_at DESC`).all(req.params.cardId);
    res.json(ratings);
  });

  // Like a game rating
  router.post('/ratings/:id/like', authMiddleware, (req, res) => {
    const existing = db.prepare("SELECT id FROM likes WHERE user_id = ? AND target_type = 'game_rating' AND target_id = ?").get(req.user.id, req.params.id);
    if (existing) {
      db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
      res.json({ liked: false });
    } else {
      db.prepare("INSERT INTO likes (user_id, target_type, target_id) VALUES (?, 'game_rating', ?)").run(req.user.id, req.params.id);
      // Notify the rating author
      const rating = db.prepare('SELECT user_id FROM game_ratings WHERE id = ?').get(req.params.id);
      if (rating && rating.user_id !== req.user.id) {
        const me = db.prepare('SELECT nickname FROM users WHERE id = ?').get(req.user.id);
        db.prepare("INSERT INTO messages (from_user_id, to_user_id, msg_type, title, content) VALUES (?, ?, 'like', '收到点赞', ?)").run(req.user.id, rating.user_id, `${me.nickname} 赞了你的游戏评价`);
      }
      res.json({ liked: true });
    }
  });

  // Events: register
  router.post('/events/:id/register', authMiddleware, (req, res) => {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ error: '活动不存在' });
    if (event.status !== 'open') return res.status(400).json({ error: '报名已关闭' });
    const pg = db.prepare('SELECT verified FROM player_games WHERE user_id = ? AND game_id = ?').get(req.user.id, event.game_id);
    if (!pg || !pg.verified) return res.status(403).json({ error: '需要先认证为该游戏玩家才能报名' });
    if (event.max_participants > 0) {
      const count = db.prepare('SELECT COUNT(*) as c FROM event_registrations WHERE event_id = ?').get(event.id);
      if (count.c >= event.max_participants) return res.status(400).json({ error: '报名已满' });
    }
    try {
      db.prepare('INSERT INTO event_registrations (event_id, user_id) VALUES (?,?)').run(event.id, req.user.id);
      res.json({ success: true });
    } catch {
      res.status(409).json({ error: '已报名' });
    }
  });

  // Admin: create event
  router.post('/events', authMiddleware, adminOnly, (req, res) => {
    const { game_id, title, description, event_date, location, max_participants } = req.body;
    const info = db.prepare('INSERT INTO events (game_id, title, description, event_date, location, max_participants, created_by) VALUES (?,?,?,?,?,?,?)').run(game_id, title, description, event_date, location, max_participants || 0, req.user.id);
    res.json({ id: info.lastInsertRowid });
  });

  return router;
}
