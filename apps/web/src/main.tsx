import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import App from './App.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import SearchResults from './pages/SearchResults.tsx';
import Dashboard from './pages/Dashboard.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
