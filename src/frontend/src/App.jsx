import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile"
import Movie from "./pages/Movie"
import Movies from "./pages/Movies"
import Header from "./components/Header"

function AppContent() {
  const { pathname } = useLocation()
  const hideHeader = pathname === "/login" || pathname === "/register"

  return (
    <>
      {!hideHeader && <Header />}
      <main className={hideHeader ? "" : "pt-16"}>
        <Routes>
          <Route path="/" element={<Movies />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/movie/:id" element={<Movie />} />
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
