import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getAllMovies, getAllPeople } from "../api";
import MovieCard from "../components/MovieCard";
import Pagination from "../components/Pagination";
import { useAuth } from "../hooks/useAuth";

const SearchIcon = () => (
  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
      clipRule="evenodd"
    />
  </svg>
);

export default function Movies() {
  const { isAdmin } = useAuth();
  const [movies, setMovies] = useState([]);
  const [allPeople, setAllPeople] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const MOVIES_PER_PAGE = 20;

  const [searchTerm, setSearchTerm] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [peopleSearchTerm, setPeopleSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // завантаження фільмів
  const fetchMovies = async (page = 1) => {
    setIsLoading(true);
    try {
      const moviesData = await getAllMovies(`?page=${page}&limit=${MOVIES_PER_PAGE}`);
      const peopleData = await getAllPeople();

      setMovies(moviesData.movies || moviesData);
      setTotalMovies(moviesData.total || 0);
      setTotalPages(moviesData.totalPages || 1);
      setAllPeople(peopleData.people || peopleData);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies(currentPage);
  }, [currentPage]);

  const processedMovies = useMemo(() => {
    let tempMovies = Array.isArray(movies) ? [...movies] : [];

    if (searchTerm) {
      tempMovies = tempMovies.filter((movie) =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (genreFilter) {
      tempMovies = tempMovies.filter((movie) =>
        movie.genre?.toLowerCase().includes(genreFilter.toLowerCase())
      );
    }

    if (peopleSearchTerm) {
      const term = peopleSearchTerm.toLowerCase();
      tempMovies = tempMovies.filter((movie) => {
        if (!movie.people_ids || !Array.isArray(movie.people_ids)) return false;

        const actorsInMovie = allPeople.filter((p) => movie.people_ids.includes(p.id));

        return actorsInMovie.some(
          (person) =>
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

    return tempMovies;
  }, [movies, allPeople, searchTerm, genreFilter, peopleSearchTerm, sortOption]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1f1f1f] via-[#111111] to-[#050505] text-center pt-32 text-lg text-[#ff4b4b] cursor-wait">
        Loading movies...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00030c] via-[#031966] to-[#052288]">
      <div className="max-w-7xl mx-auto p-4 pt-8 pb-8">
        {/* заголовок + кнопка */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h1 className="text-3xl font-bold text-white border-l-4 border-[#052288] pl-4">
            Explore Movies
          </h1>
          {isAdmin && (
            <Link
              to="/movies/new"
              className="bg-[#b7b7b7] hover:bg-[#949494] text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              + Add Movie
            </Link>
          )}
        </div>

        {/* ПАНЕЛЬ ПОШУКУ */}
        <div className="bg-[#050505] rounded-2xl p-6 mb-8 sticky top-20 z-10 shadow-lg">

          <div className="flex flex-col md:flex-row gap-4">
            {/* внутрішнє поле пошуку */}
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={handleSearchChange(setSearchTerm)}
                className="w-full bg-[#052288] text-white  rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#ff4b4b] transition-colors cursor-text"
              />
              <div className="absolute top-0 left-0 p-3 pointer-events-none">
                <SearchIcon />
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-[#b7b7b7] hover:bg-[#949494] text-white px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {showFilters ? "Hide Filters" : "Filters & Sort"}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t border-[#6f0e0e] pt-4">
              <div>
                <label className="block text-[#ff4b4b] mb-2 text-sm font-medium cursor-default">
                  Genre
                </label>
                <input
                  type="text"
                  placeholder="Filter by genre..."
                  value={genreFilter}
                  onChange={handleSearchChange(setGenreFilter)}
                  className="w-full bg-[#050505] text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-[#ff4b4b] cursor-text"
                />
              </div>

              <div>
                <label className="block text-[#ff4b4b] mb-2 text-sm font-medium cursor-default">
                  Actors / Directors
                </label>
                <input
                  type="text"
                  placeholder="Search person..."
                  value={peopleSearchTerm}
                  onChange={handleSearchChange(setPeopleSearchTerm)}
                  className="w-full bg-[#050505] text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-[#ff4b4b] cursor-text"
                />
              </div>

              <div>
                <label className="block text-[#ff4b4b] mb-2 text-sm font-medium cursor-default">
                  Sort By
                </label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full bg-[#050505] text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-[#ff4b4b] cursor-pointer appearance-none"
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

        {/* контент */}
        {processedMovies.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {processedMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {searchTerm || genreFilter || peopleSearchTerm ? (
              <div className="mt-8 text-center text-gray-400 cursor-default">
                Showing {processedMovies.length} filtered results
              </div>
            ) : (
              <Pagination
                currentPage={currentPage}
                totalItems={totalMovies}
                pageSize={MOVIES_PER_PAGE}
                onPageChange={handlePageChange}
                totalPages={totalPages}
              />
            )}
          </>
        ) : (
          <p className="text-center text-gray-400 text-lg mt-12 cursor-default">
            {searchTerm || genreFilter || peopleSearchTerm
              ? "No movies found matching your criteria."
              : "No movies available."}
          </p>
        )}

  {/* POPCORN DECORATION */}
      <img
        src="/pictures_elements/popcorn_gray.png"
        className="popcorn fixed right-6 bottom-6 w-[70px] z-20"
        alt="Popcorn"

        onClick={(e) => {
         e.target.classList.remove("active");      // скинути попередню анімацію
         void e.target.offsetWidth;                // магічний трюк для рестарту
         e.target.classList.add("active");         // увімкнути знову
       }}
      />

      </div>
    </div>
  );
}
