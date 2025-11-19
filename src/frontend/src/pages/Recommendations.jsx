import { useState, useEffect } from "react";
import { getAllMovies, getAllReviews } from "../api";
import { useAuth } from "../hooks/useAuth";
import MovieCard from "../components/MovieCard";
import { Link } from "react-router-dom";

export default function Recommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Налаштування рекомендацій
  const [settings, setSettings] = useState({
    useRating: true,
    useGenres: true,
    usePeople: true,
    ratingWeight: 1,
    genreWeight: 5,
    peopleWeight: 3,
    minRating: 7
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showDetails, setShowDetails] = useState({});
  const [shouldRegenerate, setShouldRegenerate] = useState(false);

  useEffect(() => {
    if (!user) return;
    generateRecommendations();
  }, [user]);

  const generateRecommendations = async () => {
    setIsLoading(true);
    try {
      const [movies, reviews] = await Promise.all([
        getAllMovies(),
        getAllReviews(),
      ]);

      const myReviews = reviews.filter((r) => r.user_id === user.id);
      const watchedMovieIds = new Set(myReviews.map((r) => r.movie_id));

      const likedReviews = myReviews.filter((r) => r.rating >= settings.minRating);
      
      const likedGenres = new Set();
      const likedPeople = new Set();

      likedReviews.forEach((review) => {
        const movie = movies.find((m) => m.id === review.movie_id);
        if (movie) {
          if (movie.genre) likedGenres.add(movie.genre);
          if (movie.people_ids) {
            movie.people_ids.forEach(id => likedPeople.add(id));
          }
        }
      });

      const scoredMovies = movies
        .filter((movie) => !watchedMovieIds.has(movie.id))
        .map((movie) => {
          let score = 0;
          const breakdown = {
            rating: 0,
            genres: 0,
            people: 0
          };

          // Рейтинг фільму
          if (settings.useRating) {
            breakdown.rating = parseFloat(movie.rating || 0) * settings.ratingWeight;
            score += breakdown.rating;
          }

          // Жанри
          if (settings.useGenres && movie.genre && likedGenres.has(movie.genre)) {
            breakdown.genres = settings.genreWeight;
            score += breakdown.genres;
          }

          // Люди
          if (settings.usePeople && movie.people_ids) {
            const matches = movie.people_ids.filter(id => likedPeople.has(id)).length;
            breakdown.people = matches * settings.peopleWeight;
            score += breakdown.people;
          }

          return { 
            ...movie, 
            score,
            breakdown,
            matchedGenres: settings.useGenres && movie.genre && likedGenres.has(movie.genre) ? [movie.genre] : [],
            matchedPeople: settings.usePeople && movie.people_ids ? 
              movie.people_ids.filter(id => likedPeople.has(id)) : []
          };
        });

      const sorted = scoredMovies.sort((a, b) => b.score - a.score);
      setRecommendations(sorted.filter(m => m.score > 0).slice(0, 12));
      setShouldRegenerate(false);

    } catch (err) {
      console.error("Помилка генерації рекомендацій:", err);
    } finally {
      setIsLoading(false);
    }
  };

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
      ratingWeight: 1,
      genreWeight: 5,
      peopleWeight: 3,
      minRating: 7
    });
    setShouldRegenerate(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400">
        Підбираємо найкраще для вас...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-8">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="section-title">
              Рекомендовано для вас
            </h1>
            <p className="text-gray-300">
              На основі ваших вподобань, жанрів та улюблених акторів.
            </p>
          </div>
          <div className="flex gap-2">
            {shouldRegenerate && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-3 py-1">
                <span className="text-yellow-400 text-sm font-medium">Налаштування змінено</span>
              </div>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn-secondary"
            >
              {showSettings ? "Сховати налаштування" : "Налаштування"}
            </button>
          </div>
        </div>

        {/* Панель налаштувань */}
        {showSettings && (
          <div className="card p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Налаштування рекомендацій</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Чекбокси */}
              <div className="space-y-4">
                <h4 className="text-blue-400 font-medium mb-2">Враховувати:</h4>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.useRating}
                    onChange={(e) => handleSettingChange('useRating', e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-400"
                  />
                  <span className="text-gray-300">Рейтинг фільмів</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.useGenres}
                    onChange={(e) => handleSettingChange('useGenres', e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-400"
                  />
                  <span className="text-gray-300">Улюблені жанри</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.usePeople}
                    onChange={(e) => handleSettingChange('usePeople', e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-400"
                  />
                  <span className="text-gray-300">Улюблені актори/режисери</span>
                </label>
              </div>

              {/* Ваги */}
              <div className="space-y-4">
                <h4 className="text-blue-400 font-medium mb-2">Ваги факторів:</h4>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Рейтинг: {settings.ratingWeight}</label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={settings.ratingWeight}
                    onChange={(e) => handleWeightChange('ratingWeight', e.target.value)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Жанри: {settings.genreWeight}</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={settings.genreWeight}
                    onChange={(e) => handleWeightChange('genreWeight', e.target.value)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Люди: {settings.peopleWeight}</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={settings.peopleWeight}
                    onChange={(e) => handleWeightChange('peopleWeight', e.target.value)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>

              {/* Мінімальний рейтинг */}
              <div className="space-y-4">
                <h4 className="text-blue-400 font-medium mb-2">Мінімальний рейтинг:</h4>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">{settings.minRating}/10</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.minRating}
                    onChange={(e) => handleSettingChange('minRating', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                <p className="text-gray-400 text-sm">
                  Фільми з рейтингом вище цього значення вважаються "улюбленими"
                </p>
              </div>

              {/* Інформація */}
              <div className="space-y-3">
                <h4 className="text-blue-400 font-medium">Як це працює?</h4>
                <p className="text-gray-400 text-sm">
                  Система аналізує ваші оцінки та рекомендує фільми на основі:
                </p>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• Загального рейтингу фільму</li>
                  <li>• Співпадіння жанрів з улюбленими</li>
                  <li>• Наявності улюблених акторів/режисерів</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button 
                onClick={generateRecommendations}
                className="btn-primary"
                disabled={!shouldRegenerate}
              >
                Оновити рекомендації
              </button>
              <button 
                onClick={resetToDefault}
                className="btn-secondary"
              >
                Скинути налаштування
              </button>
            </div>

            {shouldRegenerate && (
              <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm">
                  ⚠️ Налаштування змінено. Натисніть "Оновити рекомендації" для застосування змін.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Список рекомендацій */}
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendations.map((movie) => (
              <div key={movie.id} className="flex flex-col">
                {/* Картка фільму - фіксована висота */}
                <div className="movie-card group flex-1 flex flex-col">
                  <MovieCard movie={movie} />
                  
                  {/* Детальна інформація про рекомендацію */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-blue-400">
                        {movie.score.toFixed(1)} балів
                      </span>
                      <button
                        onClick={() => toggleDetails(movie.id)}
                        className="text-gray-400 hover:text-white text-sm font-medium"
                      >
                        {showDetails[movie.id] ? "Сховати" : "Деталі"}
                      </button>
                    </div>

                    {showDetails[movie.id] && (
                      <div className="space-y-3 text-sm flex-1">
                        {/* Розбивка по балах */}
                        <div className="bg-gray-700/50 rounded-lg p-3">
                          <h4 className="text-blue-300 font-medium mb-2">Розбивка балів:</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-300">Рейтинг фільму:</span>
                              <span className="text-green-400">+{movie.breakdown.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Співпадіння жанрів:</span>
                              <span className="text-green-400">+{movie.breakdown.genres.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Улюблені люди:</span>
                              <span className="text-green-400">+{movie.breakdown.people.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Співпадіння жанрів */}
                        {movie.matchedGenres.length > 0 && (
                          <div>
                            <h4 className="text-blue-300 font-medium mb-1">Співпадіння жанрів:</h4>
                            <div className="flex flex-wrap gap-1">
                              {movie.matchedGenres.map(genre => (
                                <span key={genre} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                                  {genre}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Спільні люди */}
                        {movie.matchedPeople.length > 0 && (
                          <div>
                            <h4 className="text-blue-300 font-medium mb-1">Улюблені люди у фільмі:</h4>
                            <p className="text-gray-300 text-xs">
                              Знайдено {movie.matchedPeople.length} улюблених акторів/режисерів
                            </p>
                          </div>
                        )}

                        {/* Пояснення */}
                        <div className="bg-gray-800/50 rounded p-2">
                          <p className="text-gray-400 text-xs">
                            Чим вище загальний бал, тим більше фільм відповідає вашим вподобанням
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-xl mb-4">Ми поки не можемо нічого порадити.</p>
            <p className="mb-4">
              Спробуйте оцінити більше фільмів, щоб ми зрозуміли ваші смаки!
            </p>
            <div className="space-y-2 text-sm text-gray-500 max-w-md mx-auto">
              <p>💡 Поради для кращих рекомендацій:</p>
              <ul className="space-y-1">
                <li>• Оцінюйте фільми, які вам сподобались (7+ балів)</li>
                <li>• Додавайте фільми різних жанрів до улюблених</li>
                <li>• Переглядайте фільми з улюбленими акторами</li>
              </ul>
            </div>
            <Link to="/movies" className="inline-block mt-6 btn-primary">
              До всіх фільмів
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}