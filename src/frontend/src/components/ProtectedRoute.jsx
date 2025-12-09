import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, adminOnly = false, moderatorRequired = false }) {
  
  const { isAuthenticated, isAdmin, isModerator, isLoading } = useAuth();

   if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-lg text-[#606aa2]"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        <div className="text-lg font-extrabold tracking-[0.18em] uppercase text-[#d6cecf]">
          Validating...
        </div>
      </div>
    );
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