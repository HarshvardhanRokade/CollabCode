import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  // ── Declare logout first so refreshToken can use it ──
  const logout = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (storedRefreshToken) {
      try {
        await axiosInstance.post('/auth/logout', {
          refreshToken: storedRefreshToken
        });
      } catch {}
    }

    if (refreshTimerRef.current)
      clearTimeout(refreshTimerRef.current);

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // ── Declare scheduleRefresh before useEffect ──
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current)
      clearTimeout(refreshTimerRef.current);

    refreshTimerRef.current = setTimeout(async () => {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        logout();
        return;
      }

      try {
        const response = await axiosInstance.post('/auth/refresh', {
          refreshToken: storedRefreshToken
        });

        const { token, refreshToken: newRefreshToken, userName, userId } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        localStorage.setItem('user', JSON.stringify({ userName, userId }));

        setUser({ userName, userId });
        scheduleRefresh();
      } catch {
        logout();
      }
    }, 14 * 60 * 1000);
  }, [logout]);

  // ── useEffect after all functions declared ──
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        setUser(JSON.parse(savedUser));
        scheduleRefresh();
        setLoading(false);
      }, 0);
    } else {
      setLoading(false);
    }

    return () => {
      if (refreshTimerRef.current)
        clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  const login = async (email, password) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    const { token, refreshToken, userName, userId } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify({ userName, userId }));
    setUser({ userName, userId });
    scheduleRefresh();
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
    scheduleRefresh();
    return response.data;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);