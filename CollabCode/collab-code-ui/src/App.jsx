import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import NotFound from './pages/NotFound';
import Trash from './pages/Trash';

function App() {
  return (
    <ErrorBoundary>
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
                  <Editor />
                </ErrorBoundary>
              </PrivateRoute>
            } />
            
            {/* Moved Trash above the catch-all */}
            <Route path="/trash" element={
              <PrivateRoute>
                <Trash />
              </PrivateRoute>
            } />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all route MUST be at the very bottom */}
            <Route path="*" element={<NotFound />} />
            
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;