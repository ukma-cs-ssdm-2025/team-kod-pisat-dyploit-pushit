import { useState, useEffect, useMemo } from "react";
import { getAllMovies, getAllReviews, getAllUsers } from "../api";
import { useAuth } from "../hooks/useAuth";
import MovieCard from "../components/MovieCard";
import Pagination from "../components/Pagination";
import AlertModal from "../components/AlertModal";
import { Link } from "react-router-dom";

export default function Recommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const MOVIES_PER_PAGE = 20;
  
  // Поріг, нижче якого фільми не рекомендуються
  const MIN_SCORE_THRESHOLD = 2.0;

  // Режими відображення: Simple (false) vs Advanced (true)
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  const [settings, setSettings] = useState({
    useRating: true,
    useGenres: true,
    usePeople: true,
    useSelectedMovies: true,
    useFriends: true,
    // Ваги тепер впливають на Personal Score
    genreWeight: 5,
    peopleWeight: 3,
    selectedMoviesWeight: 4,
    friendsWeight: 3,
    minRating: 7, // Поріг для визначення "що подобається юзеру"
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showDetails, setShowDetails] = useState({});
  const [shouldRegenerate, setShouldRegenerate] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    if (!user) return;
    generateRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const generateRecommendations = async () => {
    setIsLoading(true);
    try {
      const [moviesData, reviews, allUsers] = await Promise.all([
        getAllMovies(`?page=1&limit=1000`),
        getAllReviews(),
        getAllUsers(),
      ]);

      const moviesList = moviesData.movies || moviesData;
      const reviewsList = reviews.reviews || reviews;
      const usersList = allUsers.users || allUsers;

      // 1. Аналіз вподобань користувача
      const myReviews = reviewsList.filter((r) => r.user_id === user.id);
      const watchedMovieIds = new Set(myReviews.map((r) => r.movie_id));

      if (user.liked_movies && settings.useSelectedMovies) {
        user.liked_movies.forEach((movieId) => watchedMovieIds.add(movieId));
      }

      const likedReviews = myReviews.filter(
        (r) => r.rating >= settings.minRating
      );

      const likedGenres = new Set();
      const likedPeople = new Set();

      // Збираємо жанри та людей з високо оцінених відгуків
      likedReviews.forEach((review) => {
        const movie = moviesList.find((m) => m.id === review.movie_id);
        if (movie) {
          if (movie.genre) likedGenres.add(movie.genre);
          if (movie.people_ids) {
            movie.people_ids.forEach((id) => likedPeople.add(id));
          }
        }
      });

      // Збираємо жанри та людей з улюблених фільмів
      if (settings.useSelectedMovies && user.liked_movies) {
        user.liked_movies.forEach((movieId) => {
          const movie = moviesList.find((m) => m.id === movieId);
          if (movie) {
            if (movie.genre) likedGenres.add(movie.genre);
            if (movie.people_ids) {
              movie.people_ids.forEach((id) => likedPeople.add(id));
            }
          }
        });
      }

      // 2. Аналіз друзів
      const friendsLikedGenres = new Set();
      const friendsLikedPeople = new Set();

      if (settings.useFriends && user.friends && user.friends.length > 0) {
        const friendsData = usersList.filter((u) =>
          user.friends.some((friend) => friend.id === u.id)
        );

        // З улюблених фільмів друзів
        friendsData.forEach((friend) => {
          if (friend.liked_movies) {
            friend.liked_movies.forEach((movieId) => {
              const movie = moviesList.find((m) => m.id === movieId);
              if (movie) {
                if (movie.genre) friendsLikedGenres.add(movie.genre);
                if (movie.people_ids) {
                  movie.people_ids.forEach((id) =>
                    friendsLikedPeople.add(id)
                  );
                }
              }
            });
          }
        });

        // З високо оцінених відгуків друзів
        const friendsReviews = reviewsList.filter(
          (r) =>
            friendsData.some((friend) => friend.id === r.user_id) &&
            r.rating >= 7
        );

        friendsReviews.forEach((review) => {
          const movie = moviesList.find((m) => m.id === review.movie_id);
          if (movie) {
            if (movie.genre) friendsLikedGenres.add(movie.genre);
            if (movie.people_ids) {
              movie.people_ids.forEach((id) =>
                friendsLikedPeople.add(id)
              );
            }
          }
        });
      }

      // 3. Скоринг фільмів
      const scoredMovies = moviesList
        .filter((movie) => !watchedMovieIds.has(movie.id)) // Не рекомендуємо те, що вже бачили
        .map((movie) => {
          let personalScore = 0;
          const breakdown = {
            ratingMult: 0,
            genres: 0,
            people: 0,
            selectedMovies: 0,
            friends: 0,
          };

          // --- PERSONAL RELEVANCE CALCULATION ---

          // Genre Match
          if (
            settings.useGenres &&
            movie.genre &&
            likedGenres.has(movie.genre)
          ) {
            breakdown.genres = settings.genreWeight;
            personalScore += breakdown.genres;
          }

          // People Match
          if (settings.usePeople && movie.people_ids) {
            const matches = movie.people_ids.filter((id) =>
              likedPeople.has(id)
            ).length;
            if (matches > 0) {
                breakdown.people = matches * settings.peopleWeight;
                personalScore += breakdown.people;
            }
          }

          // Favorites Similarity Bonus
          if (settings.useSelectedMovies) {
            let selectedBonus = 0;
            if (movie.genre && likedGenres.has(movie.genre)) {
              selectedBonus += settings.selectedMoviesWeight * 0.5;
            }
            if (movie.people_ids) {
              const peopleMatches = movie.people_ids.filter((id) =>
                likedPeople.has(id)
              ).length;
              selectedBonus +=
                peopleMatches * settings.selectedMoviesWeight * 0.3;
            }
            breakdown.selectedMovies = selectedBonus;
            personalScore += selectedBonus;
          }

          // Friends Influence
          if (settings.useFriends) {
            let friendsBonus = 0;
            if (movie.genre && friendsLikedGenres.has(movie.genre)) {
              friendsBonus += settings.friendsWeight * 0.6;
            }
            if (movie.people_ids) {
              const friendsPeopleMatches = movie.people_ids.filter((id) =>
                friendsLikedPeople.has(id)
              ).length;
              friendsBonus +=
                friendsPeopleMatches * settings.friendsWeight * 0.4;
            }
            breakdown.friends = friendsBonus;
            personalScore += friendsBonus;
          }

          // ВАЖЛИВО: Якщо персональний рахунок 0 (немає збігів), фільм не підходить,
          // навіть якщо у нього рейтинг 10.
          if (personalScore === 0) {
              return null;
          }

          // --- RATING AS COEFFICIENT ---
          let finalScore = personalScore;
          let ratingMultiplier = 1;

          if (settings.useRating) {
             const rating = parseFloat(movie.rating || 0);
             // Коефіцієнт якості: рейтинг / 10. 
             // 10 балів = 1.0 (зберігає 100% релевантності)
             // 5 балів = 0.5 (зменшує релевантність вдвічі)
             ratingMultiplier = (rating / 10);
             
             finalScore = personalScore * ratingMultiplier;
             breakdown.ratingMult = ratingMultiplier;
          }

          // --- THRESHOLD FILTER ---
          if (finalScore < MIN_SCORE_THRESHOLD) {
              return null;
          }

          return {
            ...movie,
            score: finalScore,
            personalScore,
            breakdown,
            matchedGenres:
              settings.useGenres &&
              movie.genre &&
              likedGenres.has(movie.genre)
                ? [movie.genre]
                : [],
            matchedPeople:
              settings.usePeople && movie.people_ids
                ? movie.people_ids.filter((id) => likedPeople.has(id))
                : [],
            fromSelectedMovies:
              settings.useSelectedMovies && breakdown.selectedMovies > 0,
            fromFriends: settings.useFriends && breakdown.friends > 0,
          };
        })
        .filter(Boolean); // Видаляємо null значення (відфільтровані фільми)

      const sorted = scoredMovies.sort((a, b) => b.score - a.score);
      setRecommendations(sorted);
      setCurrentPage(1);
      setShouldRegenerate(false);
    } catch (err) {
      console.error("Error generating recommendations:", err);
      setAlertConfig({
        isOpen: true,
        title: "Error",
        message: "Failed to generate recommendations.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const paginatedRecommendations = useMemo(() => {
    const startIndex = (currentPage - 1) * MOVIES_PER_PAGE;
    return recommendations.slice(startIndex, startIndex + MOVIES_PER_PAGE);
  }, [recommendations, currentPage]);

  const toggleDetails = (movieId) => {
    setShowDetails((prev) => ({
      ...prev,
      [movieId]: !prev[movieId],
    }));
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setShouldRegenerate(true);
  };

  const handleWeightChange = (key, value) => {
    const numValue = parseInt(value) || 0;
    setSettings((prev) => ({
      ...prev,
      [key]: numValue,
    }));
    setShouldRegenerate(true);
  };

  const resetToDefault = () => {
    setSettings({
      useRating: true,
      useGenres: true,
      usePeople: true,
      useSelectedMovies: true,
      useFriends: true,
      genreWeight: 5,
      peopleWeight: 3,
      selectedMoviesWeight: 4,
      friendsWeight: 3,
      minRating: 7,
    });
    setShouldRegenerate(true);
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        <div className="w-full max-w-xl bg-[#606aa2] rounded-[15px] py-10 px-8 text-center border-[4px] border-black">
          <p className="text-base md:text-lg font-extrabold text-[#d6cecf] uppercase tracking-[0.18em]">
            Curating movies just for you...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: "#1a1a1a" }}
    >
      <div className="w-full max-w-6xl bg-[#606aa2] rounded-[15px] py-8 px-6 md:px-10">
        
        {/* HEADER & MODE TOGGLE */}
        <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-2xl font-extrabold text-[#d6cecf] uppercase tracking-[0.18em] mb-2"
              style={{ letterSpacing: "0.12em", wordSpacing: "0.12em" }}>
              RECOMMENDED FOR YOU
            </h1>
            <p className="text-sm md:text-sm text-black font-extrabold uppercase tracking-wider">
              {isAdvancedMode 
                ? "Advanced Mode: Detailed scores & algorithm controls."
                : "Personalized picks based on your taste."}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
             {/* MODE SWITCHER */}
             <div className="flex items-center bg-[#1a1a1a] rounded-full p-1 border-[2px] border-black">
                <button
                    onClick={() => setIsAdvancedMode(false)}
                    className={`
                        px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider transition-colors
                        ${!isAdvancedMode ? 'bg-[#c9c7c7] text-black' : 'text-[#d6cecf] hover:text-white'}
                    `}
                >
                    Simple
                </button>
                <button
                    onClick={() => setIsAdvancedMode(true)}
                    className={`
                        px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider transition-colors
                        ${isAdvancedMode ? 'bg-[#c9c7c7] text-black' : 'text-[#d6cecf] hover:text-white'}
                    `}
                >
                    Advanced
                </button>
             </div>

             {/* SETTINGS BUTTON (ONLY IN ADVANCED MODE) */}
             {isAdvancedMode && (
                 <div className="flex gap-2 items-center">
                    {shouldRegenerate && (
                    <span className="text-xs text-yellow-300 font-bold uppercase blink">
                        Changes not applied!
                    </span>
                    )}

                    <button
                    type="button"
                    onClick={(e) => {
                        setShowSettings(!showSettings);
                        if (showSettings) setShouldRegenerate(false);
                    }}
                    className="
                        bg-black text-white font-extrabold text-xs tracking-[0.16em] uppercase
                        border-[2px] border-black rounded-[10px] px-3 py-2
                        hover:bg-[#333] transition-colors
                    "
                    >
                    {showSettings ? "Hide Settings" : "Algorithm Settings"}
                    </button>
                </div>
             )}
          </div>
        </div>

        {/* SETTINGS PANEL (ONLY VISIBLE IN ADVANCED MODE) */}
        {isAdvancedMode && showSettings && (
          <div className="bg-[#1a1a1a] rounded-[16px] p-6 mb-8 shadow-xl border-[2px] border-[#444]">
            <h3 className="text-xl font-extrabold text-[#d6cecf] mb-4 tracking-[0.12em] uppercase border-b border-[#333] pb-2">
              Algorithm Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Factors */}
              <div className="space-y-4">
                <h4 className="text-[#d6cecf] font-extrabold mb-2 text-sm uppercase tracking-[0.12em]">
                  Active Factors:
                </h4>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={settings.useRating} onChange={(e) => handleSettingChange("useRating", e.target.checked)} className="w-4 h-4 text-black bg-[#d6cecf] border-black rounded cursor-pointer" />
                  <span className="text-[#d6cecf] uppercase text-xs">Quality Multiplier (Rating)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={settings.useGenres} onChange={(e) => handleSettingChange("useGenres", e.target.checked)} className="w-4 h-4 text-black bg-[#d6cecf] border-black rounded cursor-pointer" />
                  <span className="text-[#d6cecf] uppercase text-xs">Genre Match</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={settings.usePeople} onChange={(e) => handleSettingChange("usePeople", e.target.checked)} className="w-4 h-4 text-black bg-[#d6cecf] border-black rounded cursor-pointer" />
                  <span className="text-[#d6cecf] uppercase text-xs">Cast & Crew</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={settings.useSelectedMovies} onChange={(e) => handleSettingChange("useSelectedMovies", e.target.checked)} className="w-4 h-4 text-black bg-[#d6cecf] border-black rounded cursor-pointer" />
                  <span className="text-[#d6cecf] uppercase text-xs">Favorite Movies</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={settings.useFriends} onChange={(e) => handleSettingChange("useFriends", e.target.checked)} className="w-4 h-4 text-black bg-[#d6cecf] border-black rounded cursor-pointer" />
                  <span className="text-[#d6cecf] uppercase text-xs">Friends' Influence</span>
                </label>
              </div>

              {/* Weights */}
              <div className="space-y-4">
                <h4 className="text-[#d6cecf] font-extrabold mb-2 text-sm uppercase tracking-[0.12em]">
                  Importance Weights:
                </h4>
                
                {/* Note: Rating weight removed as it is now a coefficient, simplicity preferred */}
                
                <div>
                  <label className="block text-[#d6cecf] uppercase text-xs mb-1">Genres: {settings.genreWeight}</label>
                  <input type="range" min="0" max="10" value={settings.genreWeight} onChange={(e) => handleWeightChange("genreWeight", e.target.value)} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[#d6cecf] uppercase text-xs mb-1">People: {settings.peopleWeight}</label>
                  <input type="range" min="0" max="10" value={settings.peopleWeight} onChange={(e) => handleWeightChange("peopleWeight", e.target.value)} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[#d6cecf] uppercase text-xs mb-1">Favorites: {settings.selectedMoviesWeight}</label>
                  <input type="range" min="0" max="10" value={settings.selectedMoviesWeight} onChange={(e) => handleWeightChange("selectedMoviesWeight", e.target.value)} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[#d6cecf] uppercase text-xs mb-1">Friends: {settings.friendsWeight}</label>
                  <input type="range" min="0" max="10" value={settings.friendsWeight} onChange={(e) => handleWeightChange("friendsWeight", e.target.value)} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col justify-between">
                <div>
                    <h4 className="text-[#d6cecf] font-extrabold mb-2 text-sm uppercase tracking-[0.12em]">Filters:</h4>
                    <label className="block text-[#d6cecf] uppercase text-xs mb-1">Min. Rating to consider "Liked": {settings.minRating}/10</label>
                    <input type="range" min="1" max="10" value={settings.minRating} onChange={(e) => handleSettingChange("minRating", parseInt(e.target.value))} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer" />
                </div>

                <div className="flex gap-2 mt-6">
                    <button type="button" disabled={!shouldRegenerate} onClick={generateRecommendations} className="flex-1 bg-[#c9c7c7] text-black font-extrabold text-xs uppercase rounded-[10px] py-3 hover:bg-[#deb70b] transition-colors disabled:opacity-50">
                        Apply
                    </button>
                    <button type="button" onClick={resetToDefault} className="flex-1 bg-black text-[#d6cecf] font-extrabold text-xs uppercase rounded-[10px] py-3 hover:bg-[#830707] transition-colors">
                        Reset
                    </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-[#292929] rounded border border-black text-xs text-[#d6cecf] uppercase font-mono">
                Formula: FinalScore = PersonalScore × (Rating / 10). <br/>
                Threshold: Movies with score &lt; {MIN_SCORE_THRESHOLD} are hidden.
            </div>
          </div>
        )}

        {/* LIST OF MOVIES */}
        {recommendations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedRecommendations.map((movie) => (
                <div
                  key={movie.id}
                  className="flex flex-col bg-[#1a1818] rounded-[16px] overflow-hidden shadow-lg border-[3px] border-black"
                >
                  <MovieCard movie={movie} />

                  {/* SHOW DETAILS ONLY IN ADVANCED MODE */}
                  {isAdvancedMode && (
                    <div className="p-4 flex-1 flex flex-col bg-[#1a1818] border-t border-[#333]">
                        <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-extrabold text-[#d6cecf] tracking-[0.08em] uppercase">
                            Score: {movie.score.toFixed(1)}
                        </span>
                        <button
                            onClick={() => toggleDetails(movie.id)}
                            className="text-[#d6cecf] hover:text-white text-[10px] font-extrabold cursor-pointer uppercase tracking-[0.08em] underline decoration-dotted"
                        >
                            {showDetails[movie.id] ? "Hide Info" : "Why this?"}
                        </button>
                        </div>

                        {showDetails[movie.id] && (
                        <div className="space-y-3 text-sm flex-1 animate-fadeIn">
                            <div className="bg-[#2b2727] rounded-[10px] p-3 border border-black">
                            <h4 className="text-[#d6cecf] font-extrabold mb-2 text-[10px] uppercase tracking-[0.12em] border-b border-gray-600 pb-1">
                                Calculation
                            </h4>
                            <div className="space-y-1 text-[10px] font-mono">
                                <div className="flex justify-between">
                                    <span className="text-[#999] uppercase">Personal Relevance:</span>
                                    <span className="text-white">{movie.personalScore.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#999] uppercase">Quality Mult (R/10):</span>
                                    <span className="text-yellow-400">× {movie.breakdown.ratingMult.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-600 mt-1 pt-1 flex justify-between font-bold">
                                    <span className="text-[#d6cecf] uppercase">Final Score:</span>
                                    <span className="text-green-400">{movie.score.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            {/* Detailed breakdown of personal score */}
                            <div className="mt-2 pt-2 border-t border-gray-600 space-y-1 text-[10px]">
                                {movie.breakdown.genres > 0 && <div className="flex justify-between"><span className="text-[#999]">Genre:</span> <span className="text-[#d6cecf]">+{movie.breakdown.genres}</span></div>}
                                {movie.breakdown.people > 0 && <div className="flex justify-between"><span className="text-[#999]">People:</span> <span className="text-[#d6cecf]">+{movie.breakdown.people}</span></div>}
                                {movie.breakdown.selectedMovies > 0 && <div className="flex justify-between"><span className="text-[#999]">Favorites:</span> <span className="text-[#d6cecf]">+{movie.breakdown.selectedMovies.toFixed(1)}</span></div>}
                                {movie.breakdown.friends > 0 && <div className="flex justify-between"><span className="text-[#999]">Friends:</span> <span className="text-[#d6cecf]">+{movie.breakdown.friends.toFixed(1)}</span></div>}
                            </div>
                            </div>

                            {movie.matchedGenres.length > 0 && (
                            <div>
                                <h4 className="text-[#d6cecf] font-extrabold mb-1 text-[10px] uppercase tracking-[0.12em]">Matched Genres:</h4>
                                <div className="flex flex-wrap gap-1">
                                {movie.matchedGenres.map((genre) => (
                                    <span key={genre} className="bg-[#c9c7c7] text-black px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">{genre}</span>
                                ))}
                                </div>
                            </div>
                            )}

                            {movie.fromFriends && (
                            <div className="bg-[#c9c7c7] border border-black rounded p-2">
                                <p className="text-black uppercase text-[9px] font-extrabold">👥 Recommended by Friends</p>
                            </div>
                            )}
                        </div>
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={recommendations.length}
              pageSize={MOVIES_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="text-center mt-12 bg-[#1a1a1a] rounded-[16px] p-8 border-[3px] border-[#333]">
            <p className="text-xl mb-4 text-[#d6cecf] font-extrabold uppercase tracking-[0.12em]">
              No recommendations found.
            </p>
            <p className="mb-6 text-[#d6cecf] uppercase text-sm">
              Try rating more movies or adding favorites to help us learn your taste.
            </p>
            {isAdvancedMode && (
                <p className="text-xs text-red-400 uppercase font-bold mb-4">
                    Current Threshold: {MIN_SCORE_THRESHOLD}. Try adjusting weights in settings.
                </p>
            )}
            <div className="flex gap-4 justify-center mt-8 flex-wrap">
              <Link to="/movies" className="py-3 px-6 bg-[#c9c7c7] text-black font-extrabold text-sm tracking-[0.18em] uppercase border-[4px] border-black rounded-[20px] hover:bg-[#e0dfdf]">
                Browse Movies
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* POPCORN DECORATION */}
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

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  );
}