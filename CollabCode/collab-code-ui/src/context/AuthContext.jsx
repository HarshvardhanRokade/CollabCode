import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (!savedToken || !savedUser) {
        setLoading(false);
        return;
      }

      try {
        // Verify token is still valid
        const res = await axiosInstance.get('/auth/me');
        setUser({
          userName: res.data.userName,
          userId: res.data.userId
        });
      } catch (err) {
        if (err.response?.status === 401) {
          // Try refresh
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');

            const res = await axiosInstance.post('/auth/refresh', {}, {
              headers: { 'X-Refresh-Token': refreshToken }
            });

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            localStorage.setItem('user', JSON.stringify({
              userName: res.data.userName,
              userId: res.data.userId
            }));
            setUser({
              userName: res.data.userName,
              userId: res.data.userId
            });
          } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    const { token, refreshToken, userName, userId } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify({ userName, userId }));
    setUser({ userName, userId });
    return response.data;
  };

  const register = async (userName, email, password) => {
    const response = await axiosInstance.post('/auth/register', {
      userName, email, password
    });
    const { token, refreshToken, userName: name, userId } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify({ userName: name, userId }));
    setUser({ userName: name, userId });
    return response.data;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);