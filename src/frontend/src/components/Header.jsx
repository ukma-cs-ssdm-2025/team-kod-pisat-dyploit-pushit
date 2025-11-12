"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"

export default function Header() {
  const [token, setToken] = useState(localStorage.getItem("token"))
  const navigate = useNavigate()

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"))
    }

    window.addEventListener("storage", handleStorageChange)

    handleStorageChange()

    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    navigate("/login")
  }

  return (
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-purple-950 via-purple-900 to-purple-950 shadow-lg p-4 z-50 flex justify-between items-center border-b border-amber-500/30">
      <Link
        to={token ? "/movies" : "/login"}
        className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent hover:from-amber-300 hover:to-amber-200"
      >
        flick.ly
      </Link>
      <div className="flex gap-6 items-center">
        {token ? (
          <>
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
