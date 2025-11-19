import { Link } from "react-router-dom"

export default function MovieCard({ movie }) {
  return (
    <Link
      to={`/movie/${movie.id}`}
      className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:transform hover:scale-105"
    >
      <div className="absolute inset-0 z-10"></div>
      <div className="absolute inset-0 border-2 border-amber-500/0 group-hover:border-amber-500/50 rounded-xl z-20 transition-all duration-300"></div>

      <div className="overflow-hidden rounded-xl shadow-xl">
        <img
          src={movie.cover_url || "https://placehold.co/300x450/666/FFFFFF?text=No+Image"}
          alt={movie.title}
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110 filter group-hover:brightness-110"
        />
      </div>
      <div className="p-4 bg-gradient-to-t from-purple-950 to-purple-900/40 backdrop-blur">
        <h3
          className="text-base font-semibold text-white truncate group-hover:text-amber-400 transition-colors"
          title={movie.title}
        >
          {movie.title}
        </h3>
        <p className="text-amber-400/80 text-sm">Рейтинг: {movie.rating !== null ? parseFloat(movie.rating).toFixed(1) : '0.0'} ★</p>
      </div>
    </Link>
  )
}