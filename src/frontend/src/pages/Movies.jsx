import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"; 
import { getAllMovies, getAllPeople } from "../api" 
import MovieCard from "../components/MovieCard"
import { useAuth } from '../hooks/useAuth'; 

const SearchIcon = () => (
  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
)

export default function Movies() {
  const { isAdmin } = useAuth();
  const [movies, setMovies] = useState([])
  const [allPeople, setAllPeople] = useState([]) // Зберігаємо повні об'єкти людей

  const [searchTerm, setSearchTerm] = useState("")
  const [genreFilter, setGenreFilter] = useState("")
  const [peopleSearchTerm, setPeopleSearchTerm] = useState("") // Текстовий пошук людей
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

    // 1. Пошук за назвою фільму
    if (searchTerm) {
      tempMovies = tempMovies.filter((movie) => movie.title.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // 2. Фільтрація за жанром
    if (genreFilter) {
      tempMovies = tempMovies.filter((movie) => movie.genre?.toLowerCase().includes(genreFilter.toLowerCase()))
    }

    // 3. Пошук за людьми (Текстове поле)
    if (peopleSearchTerm) {
      const term = peopleSearchTerm.toLowerCase();
      tempMovies = tempMovies.filter(movie => {
        // Перевіряємо, чи є люди у фільмі
        if (!movie.people_ids || !Array.isArray(movie.people_ids)) return false;
        
        // Знаходимо імена людей за їх ID
        const actorsInMovie = allPeople.filter(p => movie.people_ids.includes(p.id));
        
        // Перевіряємо, чи містить ім'я або прізвище пошуковий запит
        return actorsInMovie.some(person => 
          person.first_name.toLowerCase().includes(term) || 
          person.last_name.toLowerCase().includes(term)
        );
      });
    }

    // 4. Сортування
    tempMovies.sort((a, b) => {
      const ratingA = a.rating !== null ? parseFloat(a.rating) : 0;
      const ratingB = b.rating !== null ? parseFloat(b.rating) : 0;

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
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-center pt-32 text-lg text-amber-400">
        Завантаження фільмів...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950">
      <div className="max-w-7xl mx-auto p-4 pt-24 pb-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
            Огляд Фільмів
          </h1>
          {isAdmin && (
            <Link
              to="/movies/new"
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-6 py-3 rounded-lg transition-all font-medium border border-green-400/30"
            >
              + Додати фільм
            </Link>
          )}
        </div>

        <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 p-6 rounded-xl shadow-lg mb-8 sticky top-16 z-10 border border-amber-500/20 backdrop-blur">
            <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Шукати фільм за назвою..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 bg-transparent border-2 border-amber-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all"
              />
              <div className="absolute top-0 left-0 p-3">
                <SearchIcon />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gradient-to-r from-amber-600/80 to-amber-500/80 hover:from-amber-500 hover:to-amber-400 text-white px-6 py-3 rounded-lg transition-all font-medium border border-amber-400/30"
            >
              {showFilters ? "Сховати" : "Фільтри та Сортування"}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t border-amber-500/20 pt-4">
              <div>
                <label className="block text-amber-400 mb-2 text-sm">Жанр</label>
                <input
                  type="text"
                  placeholder="Жанр"
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                  className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-amber-400 mb-2 text-sm">Актори / Режисери / Продюсери</label>
                <input
                  type="text"
                  placeholder="Актори / Режисери / Продюсери"
                  value={peopleSearchTerm}
                  onChange={(e) => setPeopleSearchTerm(e.target.value)}
                  className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-amber-400 mb-2 text-sm">Сортувати за</label>
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400 transition-all"
                >
                  <option value="newest" className="bg-purple-900">Спочатку нові</option>
                  <option value="oldest" className="bg-purple-900">Спочатку старі</option>
                  <option value="title_asc" className="bg-purple-900">Назва (А-Я)</option>
                  <option value="rating_desc" className="bg-purple-900">Рейтинг (високий - низький)</option>
                  <option value="rating_asc" className="bg-purple-900">Рейтинг (низький - високий)</option>
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