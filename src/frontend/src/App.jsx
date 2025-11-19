import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile"
import Movie from "./pages/Movie"
import Movies from "./pages/Movies"
import Header from "./components/Header"
import UserList from "./pages/UserList"
import AddMovie from "./pages/AddMovie"
import ProtectedRoute from "./components/ProtectedRoute"
import PeopleList from "./pages/PeopleList"
import AddPerson from "./pages/AddPerson"
import Person from "./pages/Person"
import Recommendations from "./pages/Recommendations"

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
          
          <Route path="/recommendations" element={
            <ProtectedRoute>
              <Recommendations />
            </ProtectedRoute>
          } />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/movie/:id" element={<Movie />} />
          <Route path="/people/:id" element={<Person />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user/:username" element={<Profile />} />

          <Route
            path="/users" 
            element={
              <ProtectedRoute>
                <UserList />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/movies/new" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AddMovie />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/people" 
            element={
              <ProtectedRoute>
                <PeopleList />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/people/new" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AddPerson />
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