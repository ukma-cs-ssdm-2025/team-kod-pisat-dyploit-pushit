import { Link } from 'react-router-dom';

export default function MovieCard({ movie }) {
  return (
    <Link
      to={`/movie/${movie.id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden group transition-all duration-300 hover:shadow-xl"
    >
      <div className="overflow-hidden">
        <img
          src={movie.imageUrl}
          alt={movie.title}
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold truncate group-hover:text-blue-600" title={movie.title}>
          {movie.title}
        </h3>
        <p className="text-gray-600 text-sm">{movie.year}</p>
        <p className="text-gray-500 text-sm truncate" title={movie.director}>
          Реж: {movie.director}
        </p>
      </div>
    </Link>
  );
}