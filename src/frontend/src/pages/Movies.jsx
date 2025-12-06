import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"; 
import { getPaginatedMovies, getMoviesStats, getMoviesGenres } from "../api" 
import MovieCard from "../components/MovieCard"
import Pagination from "../components/Pagination"
import { useAuth } from '../hooks/useAuth'; 

const SearchIcon = () => (
  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
)

export default function Movies() {
  const { isAdmin } = useAuth();
  const [movies, setMovies] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    avgRating: 0,
    genres: []
  });
  const [allGenres, setAllGenres] = useState([])
  
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [genreFilter, setGenreFilter] = useState("")
  const [peopleSearchTerm, setPeopleSearchTerm] = useState("")
  const [debouncedPeopleSearchTerm, setDebouncedPeopleSearchTerm] = useState("")
  const [sortOption, setSortOption] = useState("newest") 
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const MOVIES_PER_PAGE = 20;

  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedPeopleSearchTerm(peopleSearchTerm);
      setCurrentPage(1);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [peopleSearchTerm]);

  const fetchMoviesData = useCallback(async (page = 1, search = '', genre = '', person = '', sort = 'newest') => {
    setIsLoading(true);
    try {
      const [statsData, genresData, moviesData] = await Promise.all([
        getMoviesStats(),
        getMoviesGenres(),
        getPaginatedMovies(page, MOVIES_PER_PAGE, search, genre, person, sort)
      ]);

      setStats(statsData);
      setAllGenres(genresData);
      setMovies(moviesData.movies || moviesData);
      setTotalMovies(moviesData.total || 0);
      setTotalPages(moviesData.totalPages || 1);
    } catch (err) {
      console.error("Failed to load data:", err)
      setMovies([]);
      setTotalMovies(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false)
    }
  }, [MOVIES_PER_PAGE]);

  useEffect(() => {
    fetchMoviesData(currentPage, debouncedSearchTerm, genreFilter, debouncedPeopleSearchTerm, sortOption);
  }, [currentPage, debouncedSearchTerm, genreFilter, debouncedPeopleSearchTerm, sortOption, fetchMoviesData]);

  const handleSearchChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const handleGenreChange = (e) => {
    setGenreFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setGenreFilter('');
    setPeopleSearchTerm('');
    setSortOption('newest');
    setCurrentPage(1);
  };

  const isFiltered = debouncedSearchTerm || genreFilter || debouncedPeopleSearchTerm;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400 cursor-wait">
        Loading movies...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto p-4 pt-8 pb-8">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white border-l-4 border-blue-500 pl-4">
              Explore Movies
            </h1>
            <p className="text-gray-400 mt-2 pl-5 cursor-default">
              Browse our collection of {stats.total} movies
            </p>
          </div>
          {isAdmin && (
            <Link
              to="/movies/new"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              + Add Movie
            </Link>
          )}
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8 sticky top-20 z-10 backdrop-blur-md shadow-xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={handleSearchChange(setSearchTerm)}
                className="w-full bg-gray-900 text-white border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 transition-colors cursor-text"
              />
              <div className="absolute top-0 left-0 p-3 pointer-events-none">
                <SearchIcon />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg border border-gray-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              {showFilters ? "Hide Filters" : "Filters & Sort"}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t border-gray-700 pt-4">
              <div>
                <label className="block text-blue-400 mb-2 text-sm font-medium cursor-default">Genre</label>
                <select
                  value={genreFilter}
                  onChange={handleGenreChange}
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
                >
                  <option value="">All Genres</option>
                  {allGenres.map(genre => (
                    <option key={genre} value={genre} className="bg-gray-900">
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-blue-400 mb-2 text-sm font-medium cursor-default">Actors / Directors</label>
                <input
                  type="text"
                  placeholder="Search person..."
                  value={peopleSearchTerm}
                  onChange={handleSearchChange(setPeopleSearchTerm)}
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"
                />
              </div>

              <div>
                <label className="block text-blue-400 mb-2 text-sm font-medium cursor-default">Sort By</label>
                <select 
                  value={sortOption}
                  onChange={handleSortChange}
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title_asc">Title (A-Z)</option>
                  <option value="rating_desc">Rating (High to Low)</option>
                  <option value="rating_asc">Rating (Low to High)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {movies.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
            
            {isFiltered && (
              <div className="mt-4 p-4 bg-gray-800/30 border border-gray-700 rounded-lg flex justify-between items-center">
                <div className="text-gray-300 cursor-default">
                  Showing {movies.length} of {totalMovies} results
                  {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
                  {genreFilter && ` in ${genreFilter}`}
                  {debouncedPeopleSearchTerm && ` with "${debouncedPeopleSearchTerm}"`}
                </div>
                <button 
                  onClick={resetFilters}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 px-3 py-1 rounded transition-colors text-sm font-medium cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}

            <div className="mt-8">
              <Pagination 
                currentPage={currentPage}
                totalItems={totalMovies}
                pageSize={MOVIES_PER_PAGE}
                onPageChange={handlePageChange}
                totalPages={totalPages}
              />
            </div>
          </>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
            <div className="text-gray-400 text-lg mb-4 cursor-default">
              {isFiltered 
                ? "No movies found matching your criteria." 
                : "No movies available."
              }
            </div>
            {isFiltered && (
              <button 
                onClick={resetFilters}
                className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}