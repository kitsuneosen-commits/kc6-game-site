import { Router } from 'express';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export default function shopRouter(db) {
  const router = Router();

  // List shop items
  router.get('/', (req, res) => {
    const items = db.prepare('SELECT * FROM shop_items WHERE stock > 0 ORDER BY created_at DESC').all()
      .map(i => ({ ...i, price: i.points_cost, image_url: i.image }));
    res.json(items);
  });

  // Admin: add item
  router.post('/', authMiddleware, adminOnly, (req, res) => {
    const { name, image, image_url, points_cost, price, stock, item_type, description } = req.body;
    const imgVal = image || image_url || '';
    const costVal = points_cost || price || 0;
    const info = db.prepare('INSERT INTO shop_items (name, image, points_cost, stock, item_type, description, created_by) VALUES (?,?,?,?,?,?,?)').run(name, imgVal, costVal, stock || 0, item_type || 'online', description, req.user.id);
    res.json({ id: info.lastInsertRowid });
  });

  // Admin: update item
  router.put('/:id', authMiddleware, adminOnly, (req, res) => {
    const { name, image, image_url, points_cost, price, stock, item_type, description } = req.body;
    const imgVal = image || image_url || '';
    const costVal = points_cost || price || 0;
    db.prepare('UPDATE shop_items SET name=?, image=?, points_cost=?, stock=?, item_type=?, description=? WHERE id=?').run(name, imgVal, costVal, stock, item_type || 'online', description, req.params.id);
    res.json({ success: true });
  });

  // Admin: delete item
  router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
    db.prepare('DELETE FROM shop_items WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Purchase item
  router.post('/:id/purchase', authMiddleware, (req, res) => {
    const { delivery_type, shipping_name, shipping_phone, shipping_address } = req.body;
    const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: '商品不存在' });
    if (item.stock <= 0) return res.status(400).json({ error: '库存不足' });
    const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user.id);
    if (user.points < item.points_cost) return res.status(400).json({ error: `积分不足，需要${item.points_cost}，当前${user.points}` });
    if (delivery_type === 'shipping' && (!shipping_name || !shipping_phone || !shipping_address)) {
      return res.status(400).json({ error: '邮寄需填写收件信息' });
    }
    const tx = db.transaction(() => {
      db.prepare('UPDATE users SET points = points - ? WHERE id = ?').run(item.points_cost, req.user.id);
      db.prepare('UPDATE shop_items SET stock = stock - 1 WHERE id = ?').run(item.id);
      db.prepare('INSERT INTO orders (user_id, item_id, delivery_type, shipping_name, shipping_phone, shipping_address) VALUES (?,?,?,?,?,?)').run(req.user.id, item.id, delivery_type || 'pickup', shipping_name, shipping_phone, shipping_address);
    });
    tx();
    res.json({ success: true });
  });

  // My orders
  router.get('/orders/mine', authMiddleware, (req, res) => {
    const orders = db.prepare(`SELECT o.*, si.name as item_name, si.image as item_image FROM orders o JOIN shop_items si ON o.item_id = si.id WHERE o.user_id = ? ORDER BY o.created_at DESC`).all(req.user.id);
    res.json(orders);
  });

  // Admin: list all orders
  router.get('/orders/all', authMiddleware, adminOnly, (req, res) => {
    const orders = db.prepare(`SELECT o.*, si.name as item_name, u.nickname, u.mis_id FROM orders o JOIN shop_items si ON o.item_id = si.id JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC`).all();
    res.json(orders);
  });

  // Admin: update order status
  router.put('/orders/:id/status', authMiddleware, adminOnly, (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  });

  return router;
}
