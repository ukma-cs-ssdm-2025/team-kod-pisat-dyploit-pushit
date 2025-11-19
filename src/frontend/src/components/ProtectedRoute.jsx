import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, adminOnly = false, moderatorRequired = false }) {
  
  const { isAuthenticated, isAdmin, isModerator, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-amber-400">Перевірка доступу...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (moderatorRequired && !isModerator) {
    return <Navigate to="/movies" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/movies" replace />;
  }

  return children;
}