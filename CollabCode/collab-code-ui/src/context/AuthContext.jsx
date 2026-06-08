import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore user from localStorage on page refresh
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    const { token, userName, userId } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ userName, userId }));
    setUser({ userName, userId });
    return response.data;
  };

  const register = async (userName, email, password) => {
    const response = await axiosInstance.post('/auth/register', {
      userName, email, password
    });
    const { token, userName: name, userId } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ userName: name, userId }));
    setUser({ userName: name, userId });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);