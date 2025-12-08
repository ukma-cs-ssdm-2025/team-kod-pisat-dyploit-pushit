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

  const [settings, setSettings] = useState({
    useRating: true,
    useGenres: true,
    usePeople: true,
    useSelectedMovies: true,
    useFriends: true,
    ratingWeight: 1,
    genreWeight: 5,
    peopleWeight: 3,
    selectedMoviesWeight: 4,
    friendsWeight: 3,
    minRating: 7,
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

      likedReviews.forEach((review) => {
        const movie = moviesList.find((m) => m.id === review.movie_id);
        if (movie) {
          if (movie.genre) likedGenres.add(movie.genre);
          if (movie.people_ids) {
            movie.people_ids.forEach((id) => likedPeople.add(id));
          }
        }
      });

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

      const friendsLikedGenres = new Set();
      const friendsLikedPeople = new Set();

      if (settings.useFriends && user.friends && user.friends.length > 0) {
        const friendsData = usersList.filter((u) =>
          user.friends.some((friend) => friend.id === u.id)
        );

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

      const scoredMovies = moviesList
        .filter((movie) => !watchedMovieIds.has(movie.id))
        .map((movie) => {
          let score = 0;
          const breakdown = {
            rating: 0,
            genres: 0,
            people: 0,
            selectedMovies: 0,
            friends: 0,
          };

          if (settings.useRating) {
            breakdown.rating =
              parseFloat(movie.rating || 0) * settings.ratingWeight;
            score += breakdown.rating;
          }

          if (
            settings.useGenres &&
            movie.genre &&
            likedGenres.has(movie.genre)
          ) {
            breakdown.genres = settings.genreWeight;
            score += breakdown.genres;
          }

          if (settings.usePeople && movie.people_ids) {
            const matches = movie.people_ids.filter((id) =>
              likedPeople.has(id)
            ).length;
            breakdown.people = matches * settings.peopleWeight;
            score += breakdown.people;
          }

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
            score += selectedBonus;
          }

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
            score += friendsBonus;
          }

          return {
            ...movie,
            score,
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
        });

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
      ratingWeight: 1,
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
          <p
            className="
              text-base md:text-lg
              font-extrabold
              text-[#d6cecf]
              uppercase
              tracking-[0.18em]
            "
          >
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
        {/* Верхній блок з заголовком і кнопкою Settings */}
        <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
          <div>
            <h1
              className="
                text-2xl md:text-2xl
                font-extrabold
                text-[#d6cecf]
                uppercase
                tracking-[0.18em]
              "
              style={{
                letterSpacing: "0.12em",
                wordSpacing: "0.12em",
              }}
            >
              RECOMMENDED FOR YOU
            </h1>
            <p
              className="
                mt-3 text-sm md:text-sm
                text-black
                font-extrabold
                uppercase
              "
              style={{
                letterSpacing: "0.05em",
                wordSpacing: "0.02em",
              }}
            >
              Personalized picks based on your taste, friends, and favorites.
            </p>
          </div>

          <div className="flex gap-2 items-center">
            {shouldRegenerate && (
              <button
                disabled
                className="
                  px-4 py-2 rounded-[16px]
                  bg-[#7c7f8d]
                  text-black
                  font-extrabold
                  uppercase
                  border-[3px] border-black
                  tracking-[0.12em]
                  cursor-default
                "
              >
                Settings changed
              </button>
            )}

            {/* NEW SETTINGS BUTTON IN EDIT PROFILE STYLE */}
            <button
              type="button"
              onClick={(e) => {
                setShowSettings(!showSettings);

                if (showSettings) {
                  setShouldRegenerate(false);
                }

                const btn = e.currentTarget;
                btn.style.transition = "transform 0.15s ease";
                btn.style.transform = "scale(0.85)";

                setTimeout(() => {
                  btn.style.transform = "scale(1)";
                }, 150);
              }}
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

                hover:bg-black
                hover:translate-x-[-4px]
                hover:translate-y-[-4px]
                hover:rounded-[12px]
                hover:shadow-[4px_4px_0px_white]

                active:translate-x-0
                active:translate-y-0
                active:shadow-none
                active:rounded-[12px]
              "
            >
              {showSettings ? "Hide Settings" : "Settings"}
            </button>
          </div>
        </div>

        {/* Панель налаштувань */}
        {showSettings && (
          <div className="bg-[#1a1a1a] rounded-[16px] p-6 mb-8 shadow-xl">
            <h3 className="text-xl font-extrabold text-[#d6cecf] mb-4 tracking-[0.12em] uppercase">
              Algorithm Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="text-[#d6cecf] font-extrabold mb-2 text-sm uppercase tracking-[0.12em]">
                  Include Factors:
                </h4>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.useRating}
                    onChange={(e) =>
                      handleSettingChange("useRating", e.target.checked)
                    }
                    className="w-4 h-4 text-black bg-[#d6cecf] border-black rounded focus:ring-black cursor-pointer"
                  />
                  <span className="text-[#d6cecf] uppercase text-xs">
                    Global Rating
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.useGenres}
                    onChange={(e) =>
                      handleSettingChange("useGenres", e.target.checked)
                    }
                    className="w-4 h-4 text-black bg-[#d6cecf] border-black rounded focus:ring-black cursor-pointer"
                  />
                  <span className="text-[#d6cecf] uppercase text-xs">
                    Your Genres
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.usePeople}
                    onChange={(e) =>
                      handleSettingChange("usePeople", e.target.checked)
                    }
                    className="w-4 h-4 text-black bg-[#d6cecf] border-black rounded focus:ring-black cursor-pointer"
                  />
                  <span className="text-[#d6cecf] uppercase text-xs">
                    Actors/Directors
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.useSelectedMovies}
                    onChange={(e) =>
                      handleSettingChange(
                        "useSelectedMovies",
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 text-black bg-[#d6cecf] border-black rounded focus:ring-black cursor-pointer"
                  />
                  <span className="text-[#d6cecf] uppercase text-xs">
                    Favorite Movies
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.useFriends}
                    onChange={(e) =>
                      handleSettingChange("useFriends", e.target.checked)
                    }
                    className="w-4 h-4 text-black bg-[#d6cecf] border-black rounded focus:ring-black cursor-pointer"
                  />
                  <span className="text-[#d6cecf] uppercase text-xs">
                    Friends' Taste
                  </span>
                </label>
              </div>

              <div className="space-y-4">
                <h4 className="text-[#d6cecf] font-extrabold mb-2 text-sm uppercase tracking-[0.12em]">
                  Weights (Influence):
                </h4>
                <div>
                  <label className="block text-[#d6cecf] uppercase text-xs mb-1">
                    Rating: {settings.ratingWeight}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={settings.ratingWeight}
                    onChange={(e) =>
                      handleWeightChange("ratingWeight", e.target.value)
                    }
                    className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer rating-slider"
                  />
                </div>

                <div>
                  <label className="block text-[#d6cecf] uppercase text-xs mb-1">
                    Genres: {settings.genreWeight}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={settings.genreWeight}
                    onChange={(e) =>
                      handleWeightChange("genreWeight", e.target.value)
                    }
                    className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer rating-slider"
                  />
                </div>

                <div>
                  <label className="block text-[#d6cecf] uppercase text-xs mb-1">
                    People: {settings.peopleWeight}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={settings.peopleWeight}
                    onChange={(e) =>
                      handleWeightChange("peopleWeight", e.target.value)
                    }
                    className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer rating-slider"
                  />
                </div>

                <div>
                  <label className="block text-[#d6cecf] uppercase text-xs mb-1">
                    Favorites: {settings.selectedMoviesWeight}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={settings.selectedMoviesWeight}
                    onChange={(e) =>
                      handleWeightChange(
                        "selectedMoviesWeight",
                        e.target.value
                      )
                    }
                    className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer rating-slider"
                  />
                </div>

                <div>
                  <label className="block text-[#d6cecf] uppercase text-xs mb-1">
                    Friends: {settings.friendsWeight}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={settings.friendsWeight}
                    onChange={(e) =>
                      handleWeightChange("friendsWeight", e.target.value)
                    }
                    className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer rating-slider"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[#d6cecf] uppercase font-extrabold mb-2 text-sm uppercase tracking-[0.12em]">
                    Filters:
                  </h4>
                  <div>
                    <label className="block text-[#d6cecf] uppercase text-xs mb-1">
                      Min. Rating for "Like": {settings.minRating}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={settings.minRating}
                      onChange={(e) =>
                        handleSettingChange(
                          "minRating",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer rating-slider"
                    />
                  </div>
                  <p className="text-[#d6cecf] text-xs uppercase">
                    Movies you rated above this are considered "liked".
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[#d6cecf] font-extrabold text-xs uppercase tracking-[0.12em]">
                    How it works?
                  </h4>
                  <ul className="text-[#d6cecf] uppercase text-xs space-y-1">
                    <li>• Analyzes your high-rated reviews</li>
                    <li>• Matches genres and cast/crew</li>
                    <li>• Looks at your "Favorite Movies" list</li>
                    <li>• Finds high-rated movies from your friends</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                type="button"
                disabled={!shouldRegenerate}
                onClick={(e) => {
                  if (!shouldRegenerate) return;

                  generateRecommendations();

                  const btn = e.currentTarget;
                  btn.style.transition = "transform 0.15s ease";
                  btn.style.transform = "scale(0.85)";

                  setTimeout(() => {
                    btn.style.transform = "scale(1)";
                  }, 150);
                }}
                className="
                  bg-[#c9c7c7]
                  text-black
                  font-extrabold
                  text-xs md:text-sm
                  tracking-[0.18em]
                  uppercase

                  rounded-[14px]
                  px-6 py-2

                  hover:bg-[#deb70b]
                  transition-colors
                  cursor-pointer

                  transition-transform
                  hover:scale-[0.95]
                "
              >
                Apply Changes
              </button>

              <button
                type="button"
                onClick={(e) => {
                  resetToDefault();

                  const btn = e.currentTarget;
                  btn.style.transition = "transform 0.15s ease";
                  btn.style.transform = "scale(0.85)";

                  setTimeout(() => {
                    btn.style.transform = "scale(1)";
                  }, 150);
                }}
                className="
                  bg-black
                  text-[#d6cecf]
                  font-extrabold
                  text-xs md:text-sm
                  tracking-[0.18em]
                  uppercase

                  rounded-[14px]
                  px-6 py-2

                  hover:bg-[#830707]
                  transition-colors
                  cursor-pointer

                  transition-transform
                  hover:scale-[0.95]
                "
              >
                Reset Defaults
              </button>
            </div>
          </div>
        )}

        {/* Контент: або рекомендації, або емпті-стейт */}
        {recommendations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedRecommendations.map((movie) => (
                <div
                  key={movie.id}
                  className="flex flex-col bg-[#2b2727] rounded-[16px] overflow-hidden shadow-lg border-[3px] border-black"
                >
                  <MovieCard movie={movie} />

                  <div className="p-4 flex-1 flex flex-col bg-[#1a1818]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-extrabold text-[#d6cecf] tracking-[0.08em] uppercase">
                        Score: {movie.score.toFixed(0)}
                      </span>
                      <button
                        onClick={() => toggleDetails(movie.id)}
                        className="text-[#d6cecf] hover:text-white text-xs font-extrabold cursor-pointer uppercase tracking-[0.08em] underline decoration-dotted"
                      >
                        {showDetails[movie.id] ? "Hide Details" : "Why this?"}
                      </button>
                    </div>

                    {showDetails[movie.id] && (
                      <div className="space-y-3 text-sm flex-1">
                        <div className="bg-[#2b2727] rounded-[10px] p-3 border border-black">
                          <h4 className="text-[#d6cecf] font-extrabold mb-2 text-[10px] uppercase tracking-[0.12em]">
                            Score Breakdown
                          </h4>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-[#d6cecf] uppercase">
                                Rating:
                              </span>
                              <span className="text-[#d6cecf]">
                                +{movie.breakdown.rating.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#d6cecf] uppercase">
                                Genre Match:
                              </span>
                              <span className="text-[#d6cecf]">
                                +{movie.breakdown.genres.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#d6cecf] uppercase">
                                People Match:
                              </span>
                              <span className="text-[#d6cecf]">
                                +{movie.breakdown.people.toFixed(1)}
                              </span>
                            </div>
                            {settings.useSelectedMovies && (
                              <div className="flex justify-between">
                                <span className="text-[#d6cecf] uppercase">
                                  Favorites Similarity:
                                </span>
                                <span className="text-[#d6cecf]">
                                  +
                                  {movie.breakdown.selectedMovies.toFixed(1)}
                                </span>
                              </div>
                            )}
                            {settings.useFriends && (
                              <div className="flex justify-between">
                                <span className="text-[#d6cecf] uppercase">
                                  Friends Like:
                                </span>
                                <span className="text-[#d6cecf]">
                                  +{movie.breakdown.friends.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {movie.matchedGenres.length > 0 && (
                          <div>
                            <h4 className="text-[#d6cecf] font-extrabold mb-1 text-[10px] uppercase tracking-[0.12em]">
                              Matching Genres:
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {movie.matchedGenres.map((genre) => (
                                <span
                                  key={genre}
                                  className="bg-[#c9c7c7] text-black px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-[0.08em]"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {movie.matchedPeople.length > 0 && (
                          <div>
                            <h4 className="text-[#d6cecf] font-extrabold mb-1 text-[10px] uppercase tracking-[0.12em]">
                              Matching People:
                            </h4>
                            <p className="text-[#d6cecf] uppercase text-[11px] italic">
                              Matched {movie.matchedPeople.length} favorites.
                            </p>
                          </div>
                        )}

                        {movie.fromFriends && (
                          <div className="bg-[#c9c7c7] border border-black rounded p-2">
                            <p className="text-black uppercase text-[11px] font-extrabold">
                              👥 Recommended based on friends' activity
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
          <div className="text-center mt-12 bg-[#1a1a1a] rounded-[16px] p-8 ">
            <p className="text-xl mb-4 text-[#d6cecf] font-extrabold uppercase tracking-[0.12em]">
              We couldn't find matches yet.
            </p>
            <p className="mb-6 text-[#d6cecf] uppercase text-sm">
              Try rating more movies, adding favorites, or connecting with
              friends to help us learn your taste.
            </p>
            <div className="space-y-2 text-sm text-[#d6cecf]uppercase max-w-md mx-auto text-left bg-[#292929] p-4 rounded-[12px] ">
              <p className="font-extrabold uppercase text-xs tracking-[0.12em]">
                Tips:
              </p>
              <ul className="uppercase text-xs space-y-1 list-disc list-inside">
                <li>Rate movies you enjoyed (7+ stars)</li>
                <li>Add movies to your "Favorites" list</li>
                <li>Add friends with similar taste</li>
                <li>Explore different genres</li>
              </ul>
            </div>
            <div className="flex gap-4 justify-center mt-8 flex-wrap">
              <Link
                to="/movies"
                className="
                  py-3 px-6
                  bg-[#c9c7c7]
                  text-black
                  font-extrabold
                  text-sm
                  tracking-[0.18em]
                  uppercase
                  border-[4px]
                  border-black
                  rounded-[20px]
                  hover:bg-[#e0dfdf]
                  transition-colors
                  cursor-pointer
                "
              >
                Browse Movies
              </Link>
              <Link
                to="/users"
                className="
                  py-3 px-6
                  bg-[#1a1818]
                  text-[#d6cecf]
                  font-extrabold
                  text-sm
                  tracking-[0.18em]
                  uppercase
                  border-[4px]
                  border-black
                  rounded-[20px]
                  hover:bg-[#1f1b1b]
                  transition-colors
                  cursor-pointer
                "
              >
                Find Friends
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
