import { useEffect, useState } from "react";
import { getUserData } from "../api";
import { Link } from "react-router-dom";

const likedMovies = [
  { id: 1, title: "Inception", year: 2010, imageUrl: "https://via.placeholder.com/150x225?text=Inception" },
  { id: 2, title: "Interstellar", year: 2014, imageUrl: "https://via.placeholder.com/150x225?text=Interstellar" },
  { id: 3, title: "The Dark Knight", year: 2008, imageUrl: "https://via.placeholder.com/150x225?text=The+Dark+Knight" },
];
const userReviews = [
  { id: 1, movieId: 1, movieTitle: "Inception", rating: 5, text: "Чудовий фільм, 10/10! Повністю змінив моє сприйняття." },
  { id: 2, movieId: 2, movieTitle: "Interstellar", rating: 4, text: "Дуже емоційно та красиво. Музика просто неймовірна." },
];

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login"; 
      return;
    }
    getUserData(token).then(setUser);
  }, []);

  if (!user) return <div className="text-center mt-20 text-lg">Завантаження профілю...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pt-24 pb-8">
      <div className="flex flex-col md:flex-row items-center md:items-start bg-white shadow-lg rounded-lg p-6 mb-8">
        <img
          src={`https://via.placeholder.com/150/007BFF/FFFFFF?text=${user.username[1].toUpperCase()}`}
          alt="Profile"
          className="w-36 h-36 rounded-full border-4 border-blue-500 object-cover mb-4 md:mb-0 md:mr-6"
        />
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold">{user.nickname}</h1>
          <p className="text-lg text-gray-600">{user.username}</p>
          <p className="text-gray-700 mt-2">Email: {user.email}</p>
          <p className="text-gray-700">Роль: {user.role}</p>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Вподобані фільми</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {likedMovies.map((movie) => (
            <Link to={`/movie/${movie.id}`} key={movie.id} className="group text-center">
              <img
                src={movie.imageUrl}
                alt={movie.title}
                className="rounded-lg w-full h-auto object-cover transition-transform transform group-hover:scale-105 shadow-md"
              />
              <h3 className="mt-2 font-medium group-hover:text-blue-500">
                {movie.title} ({movie.year})
              </h3>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Мої відгуки</h2>
        <div className="space-y-4">
          {userReviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <h3 className="text-lg font-semibold">
                <Link to={`/movie/${review.movieId}`} className="hover:text-blue-500">
                  {review.movieTitle}
                </Link>
                <span className="ml-2 text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </h3>
              <p className="text-gray-700 mt-1">{review.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}