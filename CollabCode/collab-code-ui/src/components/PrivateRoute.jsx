import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen"
      style={{ background: 'var(--bg-primary)' }}>
      <div style={{ color: 'var(--accent-purple)', fontSize: '24px' }}>
        Loading...
      </div>
    </div>
  );

  return user ? children : <Navigate to="/login" replace />;
}