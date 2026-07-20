// Database schema initialization
export function initDB(db) {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Users table
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mis_id TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    avatar TEXT DEFAULT '/default-avatar.png',
    gender TEXT DEFAULT 'unknown',
    bio TEXT DEFAULT '',
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'player' CHECK(role IN ('player','admin')),
    points INTEGER DEFAULT 0,
    nickname_changed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  // Games table
  db.exec(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    cover TEXT,
    summary TEXT,
    rules TEXT,
    background TEXT,
    game_type TEXT DEFAULT 'board' CHECK(game_type IN ('board','icebreaker','card','other')),
    is_card_game INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    avg_score REAL DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  // Cards belonging to a game
  db.exec(`CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image TEXT,
    description TEXT,
    card_type TEXT DEFAULT 'normal',
    avg_score REAL DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  // Game props/items
  db.exec(`CREATE TABLE IF NOT EXISTS game_props (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0
  )`);

  // Player game verification (played this game)
  db.exec(`CREATE TABLE IF NOT EXISTS player_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    game_id INTEGER NOT NULL REFERENCES games(id),
    verified INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    title TEXT DEFAULT '',
    verified_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, game_id)
  )`);

  // Game ratings
  db.exec(`CREATE TABLE IF NOT EXISTS game_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    score INTEGER NOT NULL CHECK(score >= 1 AND score <= 10),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, game_id)
  )`);

  // Card ratings
  db.exec(`CREATE TABLE IF NOT EXISTS card_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    score INTEGER NOT NULL CHECK(score >= 1 AND score <= 10),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, card_id)
  )`);

  // Likes (polymorphic: game_rating, card_rating, community_post, comment)
  db.exec(`CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, target_type, target_id)
  )`);

  // Events (offline tournaments)
  db.exec(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL REFERENCES games(id),
    title TEXT NOT NULL,
    description TEXT,
    event_date TEXT,
    location TEXT,
    max_participants INTEGER DEFAULT 0,
    status TEXT DEFAULT 'open' CHECK(status IN ('open','closed','finished')),
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  // Event registrations
  db.exec(`CREATE TABLE IF NOT EXISTS event_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(event_id, user_id)
  )`);

  // Community posts
  db.exec(`CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT DEFAULT '[]',
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  // Comments (for posts)
  db.exec(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES comments(id),
    like_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  // Honor board
  db.exec(`CREATE TABLE IF NOT EXISTS honors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    game_id INTEGER NOT NULL REFERENCES games(id),
    achievement TEXT NOT NULL,
    awarded_at TEXT DEFAULT (datetime('now'))
  )`);

  // Creative submissions
  db.exec(`CREATE TABLE IF NOT EXISTS creative_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT DEFAULT '[]',
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    review_note TEXT,
    reviewed_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  // Shop items
  db.exec(`CREATE TABLE IF NOT EXISTS shop_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image TEXT,
    points_cost INTEGER NOT NULL,
    stock INTEGER DEFAULT 0,
    item_type TEXT DEFAULT 'online' CHECK(item_type IN ('online','offline')),
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  // Orders
  db.exec(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    item_id INTEGER NOT NULL REFERENCES shop_items(id),
    delivery_type TEXT DEFAULT 'pickup' CHECK(delivery_type IN ('pickup','shipping')),
    shipping_name TEXT,
    shipping_phone TEXT,
    shipping_address TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','completed','cancelled')),
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  // Messages (private messages + notifications)
  db.exec(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER REFERENCES users(id),
    to_user_id INTEGER NOT NULL REFERENCES users(id),
    msg_type TEXT DEFAULT 'private' CHECK(msg_type IN ('private','system','game_update','comment_reply','like','announcement')),
    title TEXT,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  console.log('[DB] Schema initialized successfully');
}
