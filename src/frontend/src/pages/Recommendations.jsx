import { useState, useEffect } from "react";
import { getAllMovies, getAllReviews } from "../api";
import { useAuth } from "../hooks/useAuth";
import MovieCard from "../components/MovieCard";
import { Link } from "react-router-dom";

export default function Recommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [movies, reviews] = await Promise.all([
          getAllMovies(),
          getAllReviews(),
        ]);

        const myReviews = reviews.filter((r) => r.user_id === user.id);
        const watchedMovieIds = new Set(myReviews.map((r) => r.movie_id));

        const likedReviews = myReviews.filter((r) => r.rating >= 7);
        
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

            score += parseFloat(movie.rating || 0);

            if (likedGenres.has(movie.genre)) {
              score += 5;
            }

            if (movie.people_ids) {
              const matches = movie.people_ids.filter(id => likedPeople.has(id)).length;
              score += matches * 3;
            }

            return { ...movie, score };
          });

        const sorted = scoredMovies.sort((a, b) => b.score - a.score);
        setRecommendations(sorted.filter(m => m.score > 0).slice(0, 10));

      } catch (err) {
        console.error("Помилка генерації рекомендацій:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

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
        <h1 className="section-title">
          Рекомендовано для вас
        </h1>
        <p className="text-gray-300 mb-8">
          На основі ваших вподобань, жанрів та улюблених акторів.
        </p>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {recommendations.map((movie) => (
              <div key={movie.id} className="relative group">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-xl mb-4">Ми поки не можемо нічого порадити.</p>
            <p>
              Спробуйте оцінити більше фільмів, щоб ми зрозуміли ваші смаки!
            </p>
            <Link to="/movies" className="inline-block mt-4 text-blue-400 hover:underline">
              До всіх фільмів
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}