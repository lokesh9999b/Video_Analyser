/**
 * Authentication Context.
 * Manages user state, JWT tokens, login/register/logout flows.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getMe } from '../api/auth.api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('pulse_token'));

  // On mount, check if we have a saved token and load user
  useEffect(() => {
    const loadUser = async () => {
      const savedToken = localStorage.getItem('pulse_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await getMe();
        setUser(res.data.data.user);
      } catch {
        localStorage.removeItem('pulse_token');
        localStorage.removeItem('pulse_user');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await loginUser(credentials);
    const { user: userData, token: newToken } = res.data.data;
    localStorage.setItem('pulse_token', newToken);
    localStorage.setItem('pulse_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    toast.success(`Welcome back, ${userData.name}!`);
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    const res = await registerUser(data);
    const { user: userData, token: newToken } = res.data.data;
    localStorage.setItem('pulse_token', newToken);
    localStorage.setItem('pulse_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    toast.success('Account created successfully!');
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pulse_token');
    localStorage.removeItem('pulse_user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const isAdmin = user?.role === 'admin';
  const isEditor = user?.role === 'editor' || user?.role === 'admin';
  const isViewer = user?.role === 'viewer';

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, isAdmin, isEditor, isViewer }}
    >
      {children}
    </AuthContext.Provider>
  );
};
