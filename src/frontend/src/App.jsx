import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Movie from "./pages/Movie";
import Movies from "./pages/Movies";
import Header from "./components/Header";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Movies />} /> 
          <Route path="/movies" element={<Movies />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/movie/:id" element={<Movie />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}