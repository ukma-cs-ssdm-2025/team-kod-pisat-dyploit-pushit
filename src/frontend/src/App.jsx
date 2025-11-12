import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile"
import Movie from "./pages/Movie"
import Movies from "./pages/Movies"
import Header from "./components/Header"
import UserList from "./pages/UserList"
import AddMovie from "./pages/AddMovie"
import ProtectedRoute from "./components/ProtectedRoute" // Імпорт ProtectedRoute

function AppContent() {
  const { pathname } = useLocation()
  const hideHeader = pathname === "/login" || pathname === "/register"

  return (
    <>
      {!hideHeader && <Header />}
      <main className={hideHeader ? "" : "pt-16"}>
        <Routes>
          {/* Головні роути */}
          <Route path="/" element={<Movies />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/movie/:id" element={<Movie />} />
          
          {/* Динамічні профілі */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/user/:username" element={<Profile />} />

          {/* --- Адмін-панель (ОНОВЛЕНО) --- */}
          
          <Route 
            path="/admin/users" 
            element={
              // Додаємо 'moderatorRequired'
              <ProtectedRoute moderatorRequired={true}>
                <UserList />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/movies/new" 
            element={
              // 'adminOnly' залишається, як було
              <ProtectedRoute adminOnly={true}>
                <AddMovie />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}