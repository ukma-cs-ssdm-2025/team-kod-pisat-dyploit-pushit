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
    minRating: 7
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showDetails, setShowDetails] = useState({});
  const [shouldRegenerate, setShouldRegenerate] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    if (!user) return;
    generateRecommendations();
  }, [user]);

  const generateRecommendations = async () => {
    setIsLoading(true);
    try {
      const [movies, reviews, allUsers] = await Promise.all([
        getAllMovies(),
        getAllReviews(),
        getAllUsers()
      ]);

      const moviesList = movies.movies || movies;
      const reviewsList = reviews.reviews || reviews;
      const usersList = allUsers.users || allUsers;

      const myReviews = reviewsList.filter((r) => r.user_id === user.id);
      const watchedMovieIds = new Set(myReviews.map((r) => r.movie_id));
      
      if (user.liked_movies && settings.useSelectedMovies) {
        user.liked_movies.forEach(movieId => watchedMovieIds.add(movieId));
      }

      const likedReviews = myReviews.filter((r) => r.rating >= settings.minRating);
      
      const likedGenres = new Set();
      const likedPeople = new Set();

      likedReviews.forEach((review) => {
        const movie = moviesList.find((m) => m.id === review.movie_id);
        if (movie) {
          if (movie.genre) likedGenres.add(movie.genre);
          if (movie.people_ids) {
            movie.people_ids.forEach(id => likedPeople.add(id));
          }
        }
      });

      if (settings.useSelectedMovies && user.liked_movies) {
        user.liked_movies.forEach(movieId => {
          const movie = moviesList.find(m => m.id === movieId);
          if (movie) {
            if (movie.genre) likedGenres.add(movie.genre);
            if (movie.people_ids) {
              movie.people_ids.forEach(id => likedPeople.add(id));
            }
          }
        });
      }

      const friendsLikedGenres = new Set();
      const friendsLikedPeople = new Set();
      
      if (settings.useFriends && user.friends && user.friends.length > 0) {
        const friendsData = usersList.filter(u => 
          user.friends.some(friend => friend.id === u.id)
        );

        friendsData.forEach(friend => {
          if (friend.liked_movies) {
            friend.liked_movies.forEach(movieId => {
              const movie = moviesList.find(m => m.id === movieId);
              if (movie) {
                if (movie.genre) friendsLikedGenres.add(movie.genre);
                if (movie.people_ids) {
                  movie.people_ids.forEach(id => friendsLikedPeople.add(id));
                }
              }
            });
          }
        });

        const friendsReviews = reviewsList.filter(r => 
          friendsData.some(friend => friend.id === r.user_id) && r.rating >= 7
        );
        
        friendsReviews.forEach(review => {
          const movie = moviesList.find(m => m.id === review.movie_id);
          if (movie) {
            if (movie.genre) friendsLikedGenres.add(movie.genre);
            if (movie.people_ids) {
              movie.people_ids.forEach(id => friendsLikedPeople.add(id));
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
            friends: 0
          };

          if (settings.useRating) {
            breakdown.rating = parseFloat(movie.rating || 0) * settings.ratingWeight;
            score += breakdown.rating;
          }

          if (settings.useGenres && movie.genre && likedGenres.has(movie.genre)) {
            breakdown.genres = settings.genreWeight;
            score += breakdown.genres;
          }

          if (settings.usePeople && movie.people_ids) {
            const matches = movie.people_ids.filter(id => likedPeople.has(id)).length;
            breakdown.people = matches * settings.peopleWeight;
            score += breakdown.people;
          }

          if (settings.useSelectedMovies) {
            let selectedBonus = 0;
            if (movie.genre && likedGenres.has(movie.genre)) {
              selectedBonus += settings.selectedMoviesWeight * 0.5;
            }
            if (movie.people_ids) {
              const peopleMatches = movie.people_ids.filter(id => likedPeople.has(id)).length;
              selectedBonus += peopleMatches * settings.selectedMoviesWeight * 0.3;
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
              const friendsPeopleMatches = movie.people_ids.filter(id => friendsLikedPeople.has(id)).length;
              friendsBonus += friendsPeopleMatches * settings.friendsWeight * 0.4;
            }
            breakdown.friends = friendsBonus;
            score += friendsBonus;
          }

          return { 
            ...movie, 
            score,
            breakdown,
            matchedGenres: settings.useGenres && movie.genre && likedGenres.has(movie.genre) ? [movie.genre] : [],
            matchedPeople: settings.usePeople && movie.people_ids ? 
              movie.people_ids.filter(id => likedPeople.has(id)) : [],
            fromSelectedMovies: settings.useSelectedMovies && breakdown.selectedMovies > 0,
            fromFriends: settings.useFriends && breakdown.friends > 0
          };
        });

      const sorted = scoredMovies.sort((a, b) => b.score - a.score);
      setRecommendations(sorted);
      setCurrentPage(1);
      setShouldRegenerate(false);

    } catch (err) {
      console.error("Error generating recommendations:", err);
      setAlertConfig({ isOpen: true, title: "Error", message: "Failed to generate recommendations." });
    } finally {
      setIsLoading(false);
    }
  };

  const paginatedRecommendations = useMemo(() => {
    const startIndex = (currentPage - 1) * MOVIES_PER_PAGE;
    return recommendations.slice(startIndex, startIndex + MOVIES_PER_PAGE);
  }, [recommendations, currentPage]);

  const toggleDetails = (movieId) => {
    setShowDetails(prev => ({
      ...prev,
      [movieId]: !prev[movieId]
    }));
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setShouldRegenerate(true);
  };

  const handleWeightChange = (key, value) => {
    const numValue = parseInt(value) || 0;
    setSettings(prev => ({
      ...prev,
      [key]: numValue
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
      minRating: 7
    });
    setShouldRegenerate(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400 cursor-wait">
        Curating movies just for you...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-8 pb-8">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white border-l-4 border-blue-500 pl-4">
              Recommended for You
            </h1>
            <p className="text-gray-400 mt-2 pl-5 cursor-default">
              Personalized picks based on your taste, friends, and favorites.
            </p>
          </div>
          <div className="flex gap-2">
            {shouldRegenerate && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-3 py-1 flex items-center">
                <span className="text-yellow-400 text-sm font-medium">Settings changed</span>
              </div>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg border border-gray-600 transition-colors cursor-pointer"
            >
              {showSettings ? "Hide Settings" : "Settings"}
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4">Algorithm Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="text-blue-400 font-medium mb-2">Include Factors:</h4>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.useRating}
                    onChange={(e) => handleSettingChange('useRating', e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-400 cursor-pointer"
                  />
                  <span className="text-gray-300">Global Rating</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.useGenres}
                    onChange={(e) => handleSettingChange('useGenres', e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-400 cursor-pointer"
                  />
                  <span className="text-gray-300">Your Genres</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.usePeople}
                    onChange={(e) => handleSettingChange('usePeople', e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-400 cursor-pointer"
                  />
                  <span className="text-gray-300">Actors/Directors</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.useSelectedMovies}
                    onChange={(e) => handleSettingChange('useSelectedMovies', e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-400 cursor-pointer"
                  />
                  <span className="text-gray-300">Favorite Movies</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.useFriends}
                    onChange={(e) => handleSettingChange('useFriends', e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-400 cursor-pointer"
                  />
                  <span className="text-gray-300">Friends' Taste</span>
                </label>
              </div>

              <div className="space-y-4">
                <h4 className="text-blue-400 font-medium mb-2">Weights (Influence):</h4>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Rating: {settings.ratingWeight}</label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={settings.ratingWeight}
                    onChange={(e) => handleWeightChange('ratingWeight', e.target.value)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Genres: {settings.genreWeight}</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={settings.genreWeight}
                    onChange={(e) => handleWeightChange('genreWeight', e.target.value)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">People: {settings.peopleWeight}</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={settings.peopleWeight}
                    onChange={(e) => handleWeightChange('peopleWeight', e.target.value)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Favorites: {settings.selectedMoviesWeight}</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={settings.selectedMoviesWeight}
                    onChange={(e) => handleWeightChange('selectedMoviesWeight', e.target.value)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Friends: {settings.friendsWeight}</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={settings.friendsWeight}
                    onChange={(e) => handleWeightChange('friendsWeight', e.target.value)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-blue-400 font-medium mb-2">Filters:</h4>
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Min. Rating for "Like": {settings.minRating}/10</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={settings.minRating}
                      onChange={(e) => handleSettingChange('minRating', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <p className="text-gray-400 text-xs">
                    Movies you rated above this are considered "liked".
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-blue-400 font-medium">How it works?</h4>
                  <ul className="text-gray-400 text-xs space-y-1">
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
                onClick={generateRecommendations}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                disabled={!shouldRegenerate}
              >
                Apply Changes
              </button>
              <button 
                onClick={resetToDefault}
                className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Reset Defaults
              </button>
            </div>
          </div>
        )}

        {recommendations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedRecommendations.map((movie) => (
                <div key={movie.id} className="flex flex-col bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800">
                   <MovieCard movie={movie} />
                  
                  <div className="p-4 flex-1 flex flex-col bg-gray-800/50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-blue-400">
                        Score: {movie.score.toFixed(0)}
                      </span>
                      <button
                        onClick={() => toggleDetails(movie.id)}
                        className="text-gray-400 hover:text-white text-sm font-medium cursor-pointer underline decoration-dotted"
                      >
                        {showDetails[movie.id] ? "Hide Details" : "Why this?"}
                      </button>
                    </div>

                    {showDetails[movie.id] && (
                      <div className="space-y-3 text-sm flex-1 animate-fadeIn">
                        <div className="bg-gray-700/50 rounded-lg p-3">
                          <h4 className="text-blue-300 font-medium mb-2 text-xs uppercase tracking-wider">Score Breakdown</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-300">Rating:</span>
                              <span className="text-green-400">+{movie.breakdown.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Genre Match:</span>
                              <span className="text-green-400">+{movie.breakdown.genres.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">People Match:</span>
                              <span className="text-green-400">+{movie.breakdown.people.toFixed(1)}</span>
                            </div>
                            {settings.useSelectedMovies && (
                              <div className="flex justify-between">
                                <span className="text-gray-300">Favorites Similarity:</span>
                                <span className="text-purple-400">+{movie.breakdown.selectedMovies.toFixed(1)}</span>
                              </div>
                            )}
                            {settings.useFriends && (
                              <div className="flex justify-between">
                                <span className="text-gray-300">Friends Like:</span>
                                <span className="text-pink-400">+{movie.breakdown.friends.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {movie.matchedGenres.length > 0 && (
                          <div>
                            <h4 className="text-blue-300 font-medium mb-1 text-xs">Matching Genres:</h4>
                            <div className="flex flex-wrap gap-1">
                              {movie.matchedGenres.map(genre => (
                                <span key={genre} className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px]">
                                  {genre}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {movie.matchedPeople.length > 0 && (
                          <div>
                            <h4 className="text-blue-300 font-medium mb-1 text-xs">Matching People:</h4>
                            <p className="text-gray-300 text-xs italic">
                               Matched {movie.matchedPeople.length} favorites.
                            </p>
                          </div>
                        )}

                        {movie.fromFriends && (
                          <div className="bg-pink-500/20 border border-pink-500/30 rounded p-2">
                            <p className="text-pink-300 text-xs font-medium">
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
          <div className="text-center text-gray-400 mt-12 bg-gray-800/30 rounded-xl p-8 border border-gray-700">
            <p className="text-xl mb-4 text-white font-semibold">We couldn't find matches yet.</p>
            <p className="mb-6">
              Try rating more movies, adding favorites, or connecting with friends to help us learn your taste.
            </p>
            <div className="space-y-2 text-sm text-gray-500 max-w-md mx-auto text-left bg-gray-900/50 p-4 rounded-lg">
              <p className="font-medium text-gray-400">Tips:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Rate movies you enjoyed (7+ stars)</li>
                <li>Add movies to your "Favorites" list</li>
                <li>Add friends with similar taste</li>
                <li>Explore different genres</li>
              </ul>
            </div>
            <div className="flex gap-4 justify-center mt-8">
              <Link to="/movies" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer">
                Browse Movies
              </Link>
              <Link to="/users" className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer">
                Find Friends
              </Link>
            </div>
          </div>
        )}
      </div>

      <AlertModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  );
}