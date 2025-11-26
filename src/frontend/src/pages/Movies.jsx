import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"; 
import { getAllMovies, getAllPeople } from "../api" 
import MovieCard from "../components/MovieCard"
import { useAuth } from '../hooks/useAuth'; 

const SearchIcon = () => (
  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
)

export default function Movies() {
  const { isAdmin } = useAuth();
  const [movies, setMovies] = useState([])
  const [allPeople, setAllPeople] = useState([])

  const [searchTerm, setSearchTerm] = useState("")
  const [genreFilter, setGenreFilter] = useState("")
  const [peopleSearchTerm, setPeopleSearchTerm] = useState("")
  const [sortOption, setSortOption] = useState("newest") 
  
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesData, peopleData] = await Promise.all([
          getAllMovies(),
          getAllPeople()
        ]);
        
        setMovies(moviesData);
        setAllPeople(peopleData);

      } catch (err) {
        console.error("Не вдалося завантажити дані:", err)
      } finally {
        setIsLoading(false)
      }
    };

    fetchData();
  }, [])

  const processedMovies = useMemo(() => {
    let tempMovies = [...movies]

    if (searchTerm) {
      tempMovies = tempMovies.filter((movie) => movie.title.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (genreFilter) {
      tempMovies = tempMovies.filter((movie) => movie.genre?.toLowerCase().includes(genreFilter.toLowerCase()))
    }

    if (peopleSearchTerm) {
      const term = peopleSearchTerm.toLowerCase();
      tempMovies = tempMovies.filter(movie => {
        if (!movie.people_ids || !Array.isArray(movie.people_ids)) return false;
        
        const actorsInMovie = allPeople.filter(p => movie.people_ids.includes(p.id));
        
        return actorsInMovie.some(person => 
          person.first_name.toLowerCase().includes(term) || 
          person.last_name.toLowerCase().includes(term)
        );
      });
    }

    tempMovies.sort((a, b) => {
      const ratingA = parseFloat(a.rating) || 0;
      const ratingB = parseFloat(b.rating) || 0;

      switch (sortOption) {
        case "title_asc":
          return a.title.localeCompare(b.title);
        case "rating_desc":
          return ratingB - ratingA;
        case "rating_asc":
          return ratingA - ratingB;
        case "oldest":
          return a.id - b.id;
        case "newest":
        default:
          return b.id - a.id;
      }
    });

    return tempMovies
  }, [movies, allPeople, searchTerm, genreFilter, peopleSearchTerm, sortOption])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400">
        Завантаження фільмів...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto p-4 pt-24 pb-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="section-title">
            Огляд фільмів
          </h1>
          {isAdmin && (
            <Link
              to="/movies/new"
              className="btn-primary"
            >
              + Додати фільм
            </Link>
          )}
        </div>

        <div className="card p-6 mb-8 sticky top-16 z-10">
            <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Шукати фільм за назвою..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
              <div className="absolute top-0 left-0 p-3">
                <SearchIcon />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary"
            >
              {showFilters ? "Сховати" : "Фільтри та Сортування"}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t border-gray-700 pt-4">
              <div>
                <label className="block text-blue-400 mb-2 text-sm font-medium">Жанр</label>
                <input
                  type="text"
                  placeholder="Жанр"
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-blue-400 mb-2 text-sm font-medium">Актори / Режисери</label>
                <input
                  type="text"
                  placeholder="Актори / Режисери / Продюсери"
                  value={peopleSearchTerm}
                  onChange={(e) => setPeopleSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-blue-400 mb-2 text-sm font-medium">Сортувати за</label>
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="form-input"
                >
                  <option value="newest" className="bg-gray-800">Спочатку нові</option>
                  <option value="oldest" className="bg-gray-800">Спочатку старі</option>
                  <option value="title_asc" className="bg-gray-800">Назва (А-Я)</option>
                  <option value="rating_desc" className="bg-gray-800">Рейтинг (високий - низький)</option>
                  <option value="rating_asc" className="bg-gray-800">Рейтинг (низький - високий)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {processedMovies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {processedMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-lg mt-12">На жаль, за вашим запитом нічого не знайдено.</p>
        )}
      </div>
    </div>
  )
}