const API = '/api';

function getToken() {
  return localStorage.getItem('kc6_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

export const api = {
  // Auth
  register: (body) => request('/users/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/users/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/users/me'),
  updateMe: (body) => request('/users/me', { method: 'PUT', body: JSON.stringify(body) }),
  updateProfile: (body) => request('/users/me', { method: 'PUT', body: JSON.stringify(body) }),
  getUser: (id) => request(`/users/${id}`),
  requestVerify: (game_id) => request('/users/request-verify', { method: 'POST', body: JSON.stringify({ game_id }) }),

  // Admin user management
  adminAward: (mis_id, body) => request('/users/admin/award', { method: 'POST', body: JSON.stringify({ mis_id, ...body }) }),
  adminVerify: (mis_id) => request('/users/admin/verify-player', { method: 'POST', body: JSON.stringify({ mis_id }) }),
  adminPendingVerifications: () => request('/users/admin/pending-verifications'),

  // Games
  games: () => request('/games'),
  getGames: () => request('/games'),
  getGame: (id) => request(`/games/${id}`),
  createGame: (body) => request('/games', { method: 'POST', body: JSON.stringify(body) }),
  updateGame: (id, body) => request(`/games/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteGame: (id) => request(`/games/${id}`, { method: 'DELETE' }),
  addCard: (gameId, body) => request(`/games/${gameId}/cards`, { method: 'POST', body: JSON.stringify(body) }),
  addProp: (gameId, body) => request(`/games/${gameId}/props`, { method: 'POST', body: JSON.stringify(body) }),
  rateGame: (gameId, body) => request(`/games/${gameId}/rate`, { method: 'POST', body: JSON.stringify(body) }),
  rateCard: (cardId, body) => request(`/games/cards/${cardId}/rate`, { method: 'POST', body: JSON.stringify(body) }),
  getCardRatings: (cardId) => request(`/games/cards/${cardId}/ratings`),
  likeGameRating: (id) => request(`/games/ratings/${id}/like`, { method: 'POST' }),
  registerEvent: (id) => request(`/games/events/${id}/register`, { method: 'POST' }),
  createEvent: (body) => request('/games/events', { method: 'POST', body: JSON.stringify(body) }),

  // Community
  getPosts: (page = 1) => request(`/community/posts?page=${page}`),
  getPost: (id) => request(`/community/posts/${id}`),
  createPost: (body) => request('/community/posts', { method: 'POST', body: JSON.stringify(body) }),
  addComment: (postId, body) => request(`/community/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(body) }),
  likePost: (id) => request(`/community/posts/${id}/like`, { method: 'POST' }),
  likeComment: (id) => request(`/community/comments/${id}/like`, { method: 'POST' }),
  getHonors: () => request('/community/honors'),

  // Creative
  submitCreative: (body) => request('/creative', { method: 'POST', body: JSON.stringify(body) }),
  myCreatives: () => request('/creative/mine'),
  allCreatives: () => request('/creative/admin/all'),
  adminCreatives: () => request('/creative/admin/all'),
  reviewCreative: (id, body) => request(`/creative/${id}/review`, { method: 'PUT', body: JSON.stringify(body) }),

  // Shop
  shopItems: () => request('/shop'),
  getShopItems: () => request('/shop'),
  createShopItem: (body) => request('/shop', { method: 'POST', body: JSON.stringify(body) }),
  updateShopItem: (id, body) => request(`/shop/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteShopItem: (id) => request(`/shop/${id}`, { method: 'DELETE' }),
  purchaseItem: (id, body) => request(`/shop/${id}/purchase`, { method: 'POST', body: JSON.stringify(body) }),
  myOrders: () => request('/shop/orders/mine'),
  adminOrders: () => request('/shop/orders/all'),

  // Messages
  getMessages: (type) => request(`/messages${type ? `?type=${type}` : ''}`),
  myMessages: () => request('/messages?type=received'),
  sentMessages: () => request('/messages?type=sent'),
  notifications: () => request('/messages?type=notification'),
  announcements: () => request('/messages?type=announcement'),
  getUnreadCount: () => request('/messages/unread-count'),
  markRead: (id) => request(`/messages/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/messages/read-all', { method: 'PUT' }),
  sendMessage: (body) => request('/messages/send', { method: 'POST', body: JSON.stringify(body) }),
  sendAnnouncement: (body) => request('/messages/announcement', { method: 'POST', body: JSON.stringify(body) }),

  // Upload
  upload: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    if (!res.ok) throw new Error('上传失败');
    return res.json();
  },
  uploadFile: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    if (!res.ok) throw new Error('上传失败');
    return res.json();
  }
};
