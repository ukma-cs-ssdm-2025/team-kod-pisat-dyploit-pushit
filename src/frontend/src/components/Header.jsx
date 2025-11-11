import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    handleStorageChange();

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md p-4 z-50 flex justify-between items-center">
      <Link to={token ? "/movies" : "/login"} className="text-2xl font-bold text-blue-600">
        MovieReview
      </Link>
      <div className="flex gap-4 items-center">
        {token ? (
          <>
            <Link to="/movies" className="text-gray-700 hover:text-blue-500">
              Фільми
            </Link>
            <Link to="/profile" className="text-gray-700 hover:text-blue-500">
              Мій Профіль
            </Link>
            <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
              Вийти
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-700 hover:text-blue-500">
              Вхід
            </Link>
            <Link to="/register" className="text-gray-700 hover:text-blue-500">
              Реєстрація
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}