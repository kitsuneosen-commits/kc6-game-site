import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import Nav from './components/Nav.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import GameList from './pages/GameList.jsx';
import GameDetail from './pages/GameDetail.jsx';
import Community from './pages/Community.jsx';
import PostDetail from './pages/PostDetail.jsx';
import Creative from './pages/Creative.jsx';
import Shop from './pages/Shop.jsx';
import Profile from './pages/Profile.jsx';
import Messages from './pages/Messages.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/games" element={<GameList />} />
          <Route path="/games/:id" element={<GameDetail />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/:id" element={<PostDetail />} />
          <Route path="/creative" element={<Creative />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
