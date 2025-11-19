import { Link, useNavigate } from "react-router-dom"
import { useAuth } from '../hooks/useAuth'; 

export default function Header() {
  const { isAuthenticated, isModerator, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    window.location.reload(); 
  };

  if (isLoading) {
    return (
      <nav className="fixed top-0 left-0 w-full bg-gray-900/95 backdrop-blur-md shadow-lg p-4 z-50 flex justify-between items-center border-b border-gray-700">
        <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
          flick.ly
        </span>
        <div className="text-gray-400">Завантаження...</div>
      </nav>
    )
  }

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-900/95 backdrop-blur-md shadow-lg p-4 z-50 flex justify-between items-center border-b border-gray-700">
      <Link
        to={isAuthenticated ? "/movies" : "/login"}
        className="text-2xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent hover:from-blue-300 hover:to-blue-200 transition-all duration-300"
      >
        flick.ly
      </Link>
      <div className="flex gap-6 items-center">
        {isAuthenticated ? (
          <>
            {isAdmin && (
              <Link to="/admin/people" className="nav-link">
                Люди
              </Link>
            )}

            {isModerator && (
              <Link to="/admin/users" className="nav-link">
                Користувачі
              </Link>
            )}

            <Link to="/movies" className="nav-link">
              Фільми
            </Link>
            
            <Link to="/recommendations" className="nav-link">
              Рекомендації
            </Link>

            <Link to="/profile" className="nav-link">
              Мій Профіль
            </Link>
            <button
              onClick={logout}
              className="btn-secondary"
            >
              Вийти
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Вхід
            </Link>
            <Link to="/register" className="nav-link">
              Реєстрація
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}