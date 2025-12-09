import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getPaginatedMovies, getMoviesStats, getMoviesGenres } from "../api";
import MovieCard from "../components/MovieCard";
import Pagination from "../components/Pagination";
import { useAuth } from "../hooks/useAuth";

const SearchIcon = () => (
  <svg className="w-5 h-5 text-[#606aa2]" fill="currentColor" viewBox="0 0 20 20">
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
  const [stats, setStats] = useState({
    total: 0,
    avgRating: 0,
    genres: [],
  });
  const [allGenres, setAllGenres] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [peopleSearchTerm, setPeopleSearchTerm] = useState("");
  const [debouncedPeopleSearchTerm, setDebouncedPeopleSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const MOVIES_PER_PAGE = 20;

  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- debounce title/description search ---
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  // --- debounce people search ---
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedPeopleSearchTerm(peopleSearchTerm);
      setCurrentPage(1);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [peopleSearchTerm]);

  const fetchMoviesData = useCallback(
    async (page = 1, search = "", genre = "", person = "", sort = "newest") => {
      setIsLoading(true);
      try {
        const [statsData, genresData, moviesData] = await Promise.all([
          getMoviesStats(),
          getMoviesGenres(),
          getPaginatedMovies(page, MOVIES_PER_PAGE, search, genre, person, sort),
        ]);

        setStats(statsData);
        setAllGenres(genresData);
        setMovies(moviesData.movies || moviesData);
        setTotalMovies(moviesData.total || 0);
        setTotalPages(moviesData.totalPages || 1);
      } catch (err) {
        console.error("Failed to load data:", err);
        setMovies([]);
        setTotalMovies(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [MOVIES_PER_PAGE]
  );

  useEffect(() => {
    fetchMoviesData(
      currentPage,
      debouncedSearchTerm,
      genreFilter,
      debouncedPeopleSearchTerm,
      sortOption
    );
  }, [
    currentPage,
    debouncedSearchTerm,
    genreFilter,
    debouncedPeopleSearchTerm,
    sortOption,
    fetchMoviesData,
  ]);

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setGenreFilter("");
    setPeopleSearchTerm("");
    setSortOption("newest");
    setCurrentPage(1);
  };

  const isFiltered = debouncedSearchTerm || genreFilter || debouncedPeopleSearchTerm;

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-lg text-[#606aa2]"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        <div className="text-lg font-extrabold tracking-[0.18em] uppercase text-[#d6cecf]">
          Loading movies...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-8" style={{ backgroundColor: "#1a1a1a" }}>
      <div className="w-full max-w-7xl mx-auto px-4">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white border-l-4 border-[#606aa2] pl-4">
              Explore Movies
            </h1>
            <p className="text-gray-400 mt-2 pl-5 cursor-default">
              Browse our collection of {stats.total} movies
            </p>
          </div>
          {isAdmin && (
            <Link
  to="/movies/new"
  className="
    bg-black
    text-white
    font-extrabold
    text-xs md:text-sm
    tracking-[0.16em]
    uppercase
    border-[3px] border-black
    rounded-[12px]
    px-4 py-2
    transition-all duration-300
    cursor-pointer
    inline-block

    hover:bg-black
    hover:translate-x-[-4px]
    hover:translate-y-[-4px]
    hover:shadow-[4px_4px_0px_white]

    active:translate-x-0
    active:translate-y-0
    active:shadow-none
  "
>
  + Add Movie
</Link>

          )}
        </div>

        {/* SEARCH PANEL */}
        <div className="bg-[#606aa2] rounded-[15px] p-6 mb-8 sticky top-6 z-10">
          <div className="flex flex-col md:flex-row gap-4">
            {/* search field */}
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={handleSearchChange(setSearchTerm)}
                className="
                  w-full
                  bg-[#1a1a1a]
                  text-white
                  border border-black
                  rounded-lg
                  pl-10 pr-4 py-2
                  focus:outline-none
                  focus:border-black
                  transition-colors
                  cursor-text
                "
              />
              <div className="absolute top-0 left-0 p-3 pointer-events-none">
                <SearchIcon />
              </div>
            </div>

            {/* Filters & Sort button – black with press effect */}
            <button
              onClick={(e) => {
                setShowFilters((prev) => !prev);
                const btn = e.currentTarget;
                btn.style.transition = "transform 0.12s ease";
                btn.style.transform = "scale(0.9)";
                setTimeout(() => {
                  btn.style.transform = "scale(1)";
                }, 120);
              }}
              className="
                bg-black
                text-white
                px-4 py-2
                rounded-lg
                border border-black
                transition-colors
                transition-transform
                hover:bg-[#181818]
                active:scale-95
                cursor-pointer
                whitespace-nowrap
              "
            >
              {showFilters ? "Hide Filters" : "Filters & Sort"}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t border-black pt-4">
              {/* Genre */}
              <div>
                <label className="block text-white mb-2 text-sm font-medium cursor-default">
                  Genre
                </label>
                <select
                  value={genreFilter}
                  onChange={handleGenreChange}
                  className="
                    w-full
                    bg-[#1a1a1a]
                    text-white
                    border border-black
                    rounded-lg
                    px-4 py-2
                    focus:outline-none
                    focus:border-black
                    cursor-pointer
                    appearance-none
                  "
                >
                  <option value="" className="bg-[#1a1a1a] text-white">
                    All Genres
                  </option>
                  {allGenres.map((genre) => (
                    <option
                      key={genre}
                      value={genre}
                      className="bg-[#1a1a1a] text-white"
                    >
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* People */}
              <div>
                <label className="block text-white mb-2 text-sm font-medium cursor-default">
                  Actors / Directors
                </label>
                <input
                  type="text"
                  placeholder="Search person..."
                  value={peopleSearchTerm}
                  onChange={handleSearchChange(setPeopleSearchTerm)}
                  className="
                    w-full
                    bg-[#1a1a1a]
                    text-white
                    border border-black
                    rounded-lg
                    px-4 py-2
                    focus:outline-none
                    focus:border-black
                    cursor-text
                  "
                />
              </div>

              {/* Sort */}
              <div>
                <label className="block text-white mb-2 text-sm font-medium cursor-default">
                  Sort By
                </label>
                <select
                  value={sortOption}
                  onChange={handleSortChange}
                  className="
                    w-full
                    bg-[#1a1a1a]
                    text-white
                    border border-black
                    rounded-lg
                    px-4 py-2
                    focus:outline-none
                    focus:border-black
                    cursor-pointer
                    appearance-none
                  "
                >
                  <option value="newest" className="bg-[#1a1a1a] text-white">
                    Newest First
                  </option>
                  <option value="oldest" className="bg-[#1a1a1a] text-white">
                    Oldest First
                  </option>
                  <option value="title_asc" className="bg-[#1a1a1a] text-white">
                    Title (A-Z)
                  </option>
                  <option value="rating_desc" className="bg-[#1a1a1a] text-white">
                    Rating (High to Low)
                  </option>
                  <option value="rating_asc" className="bg-[#1a1a1a] text-white">
                    Rating (Low to High)
                  </option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* MOVIES GRID / EMPTY STATE */}
        {movies.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {isFiltered && (
              <div className="mt-4 p-4 bg-gray-900/60 border border-black rounded-[12px] flex justify-between items-center">
                <div className="text-gray-200 text-sm cursor-default">
                  Showing {movies.length} of {totalMovies} results
                  {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
                  {genreFilter && ` in ${genreFilter}`}
                  {debouncedPeopleSearchTerm && ` with "${debouncedPeopleSearchTerm}"`}
                </div>
                <button
                  onClick={resetFilters}
                  className="
                    text-[#e5e5e5]
                    hover:text-white
                    hover:bg-black/30
                    px-3 py-1
                    rounded
                    transition-colors
                    text-sm
                    font-medium
                    cursor-pointer
                  "
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
          <div className="bg-gray-900/70 border border-black rounded-[15px] p-8 text-center">
            <div className="text-gray-300 text-lg mb-4 cursor-default">
              {isFiltered
                ? "No movies found matching your criteria."
                : "No movies available."}
            </div>
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="text-[#e5e5e5] hover:text-white underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* POPCORN DECORATION (як у UserList) */}
      <img
        src="/pictures_elements/popcorn_gray.png"
        className="popcorn fixed right-6 bottom-6 w-[70px] z-20"
        alt="Popcorn"
        onClick={(e) => {
          e.target.classList.remove("active");
          void e.target.offsetWidth;
          e.target.classList.add("active");
        }}
      />
    </div>
  );
}
