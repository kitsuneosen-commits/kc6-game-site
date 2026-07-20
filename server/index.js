import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { initDB } from './db/schema.js';
import { authMiddleware } from './middleware/auth.js';
import usersRouter from './routes/users.js';
import gamesRouter from './routes/games.js';
import communityRouter from './routes/community.js';
import creativeRouter from './routes/creative.js';
import shopRouter from './routes/shop.js';
import messagesRouter from './routes/messages.js';
import uploadRouter from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

// Initialize database
const db = new Database(path.join(__dirname, 'db', 'kc6.db'));
initDB(db);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve client build in production
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// Public routes
app.use('/api/users', (req, res, next) => {
  if (['POST'].includes(req.method) && ['/register', '/login'].includes(req.path)) {
    return next();
  }
  if (req.method === 'GET' && req.path.match(/^\/\d+$/)) {
    return next();
  }
  authMiddleware(req, res, next);
}, usersRouter(db));

app.use('/api/games', gamesRouter(db));
app.use('/api/community', communityRouter(db));
app.use('/api/creative', authMiddleware, creativeRouter(db));
app.use('/api/shop', shopRouter(db));
app.use('/api/messages', messagesRouter(db));
app.use('/api/upload', authMiddleware, uploadRouter());

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[KC-6 Game Server] 已启动！`);
  console.log(`  本机访问: http://localhost:${PORT}`);
  console.log(`  内网访问: http://11.4.25.110:${PORT}`);
  console.log(`  把内网地址发给同事即可访问 🎮`);
});
