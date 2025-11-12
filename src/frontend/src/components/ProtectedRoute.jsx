import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

// Додаємо новий prop 'moderatorRequired'
export default function ProtectedRoute({ children, adminOnly = false, moderatorRequired = false }) {
  
  // Тепер отримуємо 'isModerator' з хука
  const { isAuthenticated, isAdmin, isModerator, isLoading } = useAuth();

  // Поки йде перевірка автентифікації, показуємо завантаження
  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-center pt-32 text-lg text-amber-400">Перевірка доступу...</div>;
  }

  // Якщо не залогінений
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // --- НОВИЙ БЛОК ПЕРЕВІРКИ ---
  // Якщо потрібен модератор (або адмін), а користувач не є ним
  if (moderatorRequired && !isModerator) {
    return <Navigate to="/movies" replace />; // Недостатньо прав
  }
  // -----------------------------

  // Якщо потрібен *тільки* адмін, а користувач не адмін
  if (adminOnly && !isAdmin) {
    return <Navigate to="/movies" replace />; // Недостатньо прав
  }

  // Якщо всі перевірки пройдено
  return children;
}