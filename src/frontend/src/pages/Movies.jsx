import { useState, useEffect, useMemo } from "react"
import { getAllMovies } from "../api"
import MovieCard from "../components/MovieCard"

const SearchIcon = () => (
  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
      clipRule="evenodd"
    />
  </svg>
)

export default function Movies() {
  const [movies, setMovies] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({ director: "", year: "" })
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getAllMovies().then((data) => {
      setMovies(data)
      setIsLoading(false)
    })
  }, [])

  const filteredMovies = useMemo(() => {
    let tempMovies = [...movies]

    if (searchTerm) {
      tempMovies = tempMovies.filter((movie) => movie.title.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (filters.director) {
      tempMovies = tempMovies.filter((movie) => movie.director.toLowerCase().includes(filters.director.toLowerCase()))
    }

    if (filters.year) {
      tempMovies = tempMovies.filter((movie) => movie.year.toString().includes(filters.year))
    }

    return tempMovies
  }, [movies, searchTerm, filters])

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

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
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
          Огляд Фільмів
        </h1>

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
              {showFilters ? "Сховати" : "Фільтри"}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t border-amber-500/20 pt-4">
              <input
                type="text"
                name="director"
                placeholder="Фільтрувати за режисером..."
                value={filters.director}
                onChange={handleFilterChange}
                className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-all"
              />
              <input
                type="text"
                name="year"
                placeholder="Фільтрувати за роком..."
                value={filters.year}
                onChange={handleFilterChange}
                className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-all"
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
          <p className="text-center text-gray-400 text-lg mt-12">На жаль, за вашим запитом нічого не знайдено.</p>
        )}
      </div>
    </div>
  )
}
