import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllMovies } from '../api';
import MovieCard from '../components/MovieCard'; // Імпортуємо нову картку

// Іконка для пошуку (SVG)
const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
);

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [filters, setFilters] = useState({ director: '', year: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAllMovies().then((data) => {
      setMovies(data);
      setIsLoading(false);
    });
  }, []);

  const filteredMovies = useMemo(() => {
    let tempMovies = [...movies];

    if (searchTerm) {
      tempMovies = tempMovies.filter((movie) =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.director) {
      tempMovies = tempMovies.filter((movie) =>
        movie.director.toLowerCase().includes(filters.director.toLowerCase())
      );
    }

    if (filters.year) {
      tempMovies = tempMovies.filter((movie) =>
        movie.year.toString().includes(filters.year)
      );
    }

    return tempMovies;
  }, [movies, searchTerm, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  if (isLoading) {
    return <div className="text-center mt-20 pt-10 text-lg">Завантаження фільмів...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 pt-24 pb-8">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Огляд Фільмів</h1>

      <div className="bg-white p-4 rounded-lg shadow-md mb-8 sticky top-16 z-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Шукати фільм за назвою..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute top-0 left-0 p-3">
              <SearchIcon />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {showFilters ? 'Сховати Фільтри' : 'Показати Фільтри'}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t border-gray-200 pt-4">
            <input
              type="text"
              name="director"
              placeholder="Фільтрувати за режисером..."
              value={filters.director}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="year"
              placeholder="Фільтрувати за роком..."
              value={filters.year}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 text-lg">
          На жаль, за вашим запитом нічого не знайдено.
        </p>
      )}
    </div>
  );
}