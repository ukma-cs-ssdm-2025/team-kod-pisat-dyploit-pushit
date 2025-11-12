import { Link, useNavigate } from "react-router-dom"
import { useAuth } from '../hooks/useAuth'; // Наш новий робочий хук

export default function Header() {
  // Тепер хук повертає стан завантаження
  const { isAuthenticated, isModerator, isLoading } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    // Перезавантажуємо сторінку, щоб скинути стан useAuth
    navigate("/login");
    window.location.reload(); 
  };

  // Поки хук завантажує дані, нічого не показуємо
  if (isLoading) {
    return (
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-purple-950 via-purple-900 to-purple-950 shadow-lg p-4 z-50 flex justify-between items-center border-b border-amber-500/30">
        <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
          flick.ly
        </span>
        <div className="text-gray-400">Завантаження...</div>
      </nav>
    )
  }

  return (
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-purple-950 via-purple-900 to-purple-950 shadow-lg p-4 z-50 flex justify-between items-center border-b border-amber-500/30">
      <Link
        to={isAuthenticated ? "/movies" : "/login"}
        className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent hover:from-amber-300 hover:to-amber-200"
      >
        flick.ly
      </Link>
      <div className="flex gap-6 items-center">
        {isAuthenticated ? (
          <>
            {/* Посилання на керування користувачами (тільки для модераторів/адмінів) */}
            {isModerator && (
              <Link to="/admin/users" className="text-gray-300 hover:text-amber-400 transition-colors font-medium">
                Користувачі
              </Link>
            )}

            <Link to="/movies" className="text-gray-300 hover:text-amber-400 transition-colors font-medium">
              Фільми
            </Link>
            <Link to="/profile" className="text-gray-300 hover:text-amber-400 transition-colors font-medium">
              Мій Профіль
            </Link>
            <button
              onClick={logout}
              className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-2 rounded-lg hover:from-amber-500 hover:to-amber-400 transition-all font-medium"
            >
              Вийти
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-300 hover:text-amber-400 transition-colors font-medium">
              Вхід
            </Link>
            <Link to="/register" className="text-gray-300 hover:text-amber-400 transition-colors font-medium">
              Реєстрація
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}