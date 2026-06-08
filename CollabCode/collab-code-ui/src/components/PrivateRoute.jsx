import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  // Premium loading state while checking authentication
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0F] font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
        <p className="text-sm font-medium text-zinc-500 tracking-wide">
          Verifying session...
        </p>
      </div>
    );
  }

  // Redirect to login if unauthenticated, otherwise render the protected component
  return user ? children : <Navigate to="/login" replace />;
}