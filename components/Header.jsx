import { Link, useNavigate } from "react-router-dom"
import { useAuth } from '../hooks/useAuth';
import Avatar from "./Avatar";

export default function Header() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    window.location.reload();
  };

  if (isLoading) {
    return (
      <nav className="fixed top-0 left-0 w-full bg-gray-900/95 backdrop-blur-md shadow-lg p-4 z-50 flex justify-between items-center border-b border-gray-700">
        <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent cursor-default">
          flick.ly
        </span>
      </nav>
    )
  }

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-900/95 backdrop-blur-md shadow-lg p-4 z-50 border-b border-gray-700">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
        <Link
          to={isAuthenticated ? "/movies" : "/login"}
          className="text-2xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent hover:from-blue-300 hover:to-blue-200 transition-all duration-300 cursor-pointer"
        >
          flick.ly
        </Link>
        
        <div className="flex flex-wrap gap-4 items-center justify-center md:justify-end">
          {isAuthenticated ? (
            <>
              <Link to="/people" className="text-gray-300 hover:text-white transition-colors text-sm font-medium cursor-pointer">
                People
              </Link>

              <Link to="/users" className="text-gray-300 hover:text-white transition-colors text-sm font-medium cursor-pointer">
                Users
              </Link>

              <Link to="/movies" className="text-gray-300 hover:text-white transition-colors text-sm font-medium cursor-pointer">
                Movies
              </Link>
              
              <Link to="/recommendations" className="text-gray-300 hover:text-white transition-colors text-sm font-medium cursor-pointer">
                Recommendations
              </Link>

              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                <span className="text-gray-300 hover:text-white text-sm font-medium hidden sm:block">My Profile</span>
                <Avatar src={user?.avatar_url} alt={user?.nickname} size="sm" />
              </Link>
              
              <button
                onClick={logout}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-700 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors font-medium cursor-pointer">
                Log In
              </Link>
              <Link to="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}