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

  // Основний колір фону — як на Login.jsx (#1a1a1a)
  const navbarStyle = "fixed top-0 left-0 w-full bg-[#1a1a1a] backdrop-blur-md shadow-lg p-4 z-50 border-b border-black";

  return (
    <nav className={navbarStyle}>
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">

        {/* --- НОВИЙ градієнт flick.ly + інвертований hover --- */}
        <Link
          to={isAuthenticated ? "/movies" : "/login"}
          className="
            text-2xl font-extrabold 
            bg-gradient-to-r from-[#d6cecf] to-[#606aa2]
            uppercase 
            bg-clip-text text-transparent
            hover:from-[#606aa2] hover:to-[#d6cecf]
            transition-all duration-300
            cursor-pointer tracking-[0.05em]
          "
        >
          flick.ly
        </Link>

        <div className="flex flex-wrap gap-4 items-center justify-center md:justify-end">

          {isAuthenticated ? (
            <>
              <Link className="text-[#d6cecf] uppercase hover:text-white transition-colors text-sm font-medium cursor-pointer" 
              to="/people">People</Link>
              <Link className="text-[#d6cecf] uppercase hover:text-white transition-colors text-sm font-medium cursor-pointer"
              to="/users">Users</Link>
              <Link className="text-[#d6cecf] uppercase hover:text-white transition-colors text-sm font-medium cursor-pointer"
              to="/movies">Movies</Link>
              <Link className="text-[#d6cecf] uppercase hover:text-white transition-colors text-sm font-medium cursor-pointer"
              to="/recommendations">Recommendations</Link>

              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                <span className="text-[#d6cecf] uppercase hover:text-white text-sm font-medium hidden sm:block">My Profile</span>
                <Avatar src={user?.avatar_url} alt={user?.nickname} size="sm" />
              </Link>

              {/* --- світліша кнопка Logout --- */}
              <button
                onClick={logout}
                className="
                  bg-[#2e2e2e] 
                  hover:bg-[#3a3a3a]
                  text-[#d6cecf]
                  uppercase
                  px-4 py-2 
                  rounded-lg 
                  text-sm font-medium 
                  transition-colors 
                  border border-black
                  cursor-pointer
                "
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors font-medium cursor-pointer">Log In</Link>
              <Link to="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer">Sign Up</Link>
            </>
          )}

        </div>
      </div>
    </nav>
  );
}
