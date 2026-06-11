import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://localhost:7222/api',
  withCredentials: true,
});

// Attach token from localStorage
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — try refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');
    const is401 = error.response?.status === 401;
    const notRetried = !originalRequest._retry;

    if (is401 && notRetried && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axiosInstance.post('/auth/refresh', {}, {
          headers: { 'X-Refresh-Token': refreshToken }
        });

        localStorage.setItem('token', res.data.token);
        localStorage.setItem('refreshToken', res.data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
        return axiosInstance(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;