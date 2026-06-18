import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react'; // Utilizing Lucide icon for the spinner
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext'; 
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import Trash from './pages/Trash';

// Lazy load Editor — only downloaded when user opens a room
const Editor = lazy(() => import('./pages/Editor'));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              
              <Route path="/editor/:roomId" element={
                <PrivateRoute>
                  <ErrorBoundary>
                    <Suspense fallback={
                      <div className="min-h-screen bg-theme-base flex flex-col items-center justify-center gap-4 transition-colors duration-300">
                        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                        <p className="text-theme-muted text-sm font-medium tracking-wide animate-pulse">
                          Loading workspace...
                        </p>
                      </div>
                    }>
                      <Editor />
                    </Suspense>
                  </ErrorBoundary>
                </PrivateRoute>
              } />
              
              <Route path="/trash" element={
                <PrivateRoute>
                  <Trash />
                </PrivateRoute>
              } />
              
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;