import { Link } from "react-router-dom"

export default function MovieCard({ movie }) {
  return (
    <Link
      to={`/movie/${movie.id}`}
      className="movie-card group"
    >
      <div className="overflow-hidden rounded-t-xl">
        <img
          src={movie.cover_url || "https://placehold.co/300x450/374151/FFFFFF?text=No+Image"}
          alt={movie.title}
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105 group-hover:brightness-110"
        />
      </div>
      <div className="p-4 bg-gradient-to-t from-gray-900 to-gray-800/40">
        <h3
          className="text-base font-semibold text-white truncate group-hover:text-blue-300 transition-colors duration-200"
          title={movie.title}
        >
          {movie.title}
        </h3>
        <p className="text-blue-400/80 text-sm mt-1">Рейтинг: {movie.rating || 0} ★</p>
      </div>
    </Link>
  )
}