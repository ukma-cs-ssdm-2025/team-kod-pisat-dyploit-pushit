import { useState, useEffect } from 'react';
import { useParams, Link } from "react-router-dom";
import { getMovieById } from '../api';
const mockReviews = [
  { id: 1, user: "admin_user", rating: 5, text: "Чудовий фільм, 10/10!" },
  { id: 2, user: "test_user", rating: 4, text: "Дуже емоційно та красиво." },
];

export default function Movie() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    getMovieById(id).then((data) => {
      setMovie(data);
    });
  }, [id]);

  if (!movie) {
    return <div className="text-center mt-20 pt-10 text-lg">Завантаження фільму...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 pt-24 pb-8">
      <div className="flex flex-col md:flex-row bg-white shadow-lg rounded-lg p-6">
        <img
          src={movie.imageUrl}
          alt={movie.title}
          className="w-full md:w-1/3 h-auto object-cover rounded-lg shadow-md"
        />

        <div className="md:ml-6 mt-4 md:mt-0">
          <h1 className="text-4xl font-bold">{movie.title} <span className="text-3xl text-gray-500">({movie.year})</span></h1>
          <p className="text-lg text-gray-700 mt-2"><strong>Режисер:</strong> {movie.director}</p>
          <p className="text-lg text-gray-700 mt-1"><strong>Актори:</strong> {movie.actors.join(", ")}</p>
          <p className="text-gray-800 mt-4 text-justify">{movie.description || "Опис для цього фільму скоро з'явиться."}</p>
          
          <div className="mt-6 flex gap-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
              Додати в улюбленe
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
              Написати відгук
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 mt-8">
        <h2 className="text-2xl font-semibold mb-4">Відгуки користувачів</h2>
        <div className="space-y-6">
          {mockReviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-center mb-1">
                <strong className="text-lg">{review.user}</strong>
                <span className="ml-3 text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              <p className="text-gray-700">{review.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}