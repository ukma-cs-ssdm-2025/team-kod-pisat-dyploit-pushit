import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom" 
import { getMovieById, getReviewsByMovieId, updateMovie, addReview, deleteReview, deleteMovie } from "../api" 
import { useAuth } from '../hooks/useAuth';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';

export default function Movie() {
  const { id } = useParams()
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  const [movie, setMovie] = useState(null)
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(null)
  const [posterFile, setPosterFile] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getMovieById(id),
      getReviewsByMovieId(id)
    ]).then(([movieData, reviewsData]) => {
      setMovie(movieData); // movieData може бути null, якщо фільм не знайдено
      setReviews(reviewsData);
      if (movieData) {
        setEditData({ 
          ...movieData,
          actors: movieData.actors ? movieData.actors.join(', ') : '' 
        });
      }
      setIsLoading(false); // Завантаження завершено
    });
  }, [id]);

  // Обробники (без змін)
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPosterFile(e.target.files[0]);
    }
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const updatedMovieData = { ...editData, actors: editData.actors.split(',').map(a => a.trim()) };
    await updateMovie(id, updatedMovieData, posterFile);
    setMovie(updatedMovieData); 
    setIsEditing(false);
    setPosterFile(null);
  };
  const handleDeleteMovie = async () => {
    if (window.confirm(`Ви впевнені, що хочете видалити фільм "${movie.title}"?`)) {
      await deleteMovie(id);
      alert('Фільм видалено (імітація)!');
      navigate('/movies');
    }
  };
  const handleAddReview = async (reviewData) => { /* ... (без змін) ... */ };
  const handleDeleteReview = async (reviewId) => { /* ... (без змін) ... */ };


  // --- ВИПРАВЛЕННЯ ЛОГІКИ ЗАВАНТАЖЕННЯ ---

  // Крок 1: Обробляємо стан, коли дані ще завантажуються
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-center pt-32 text-lg text-amber-400">
        Завантаження фільму...
      </div>
    )
  }

  // Крок 2: Обробляємо стан, коли завантаження завершено, АЛЕ фільм не знайдено
  // (movieData був null)
  if (!movie) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-center pt-32 text-lg text-red-500">
            На жаль, фільм не знайдено.
        </div>
    )
  }
  
  // Крок 3: Якщо ми дійшли сюди, то isLoading = false і movie НЕ null.
  // Тепер рендеринг безпечний.

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 pt-24 pb-8">
      <div className="max-w-5xl mx-auto p-4">
        
        {!isEditing ? (
          // --- Режим перегляду ---
          <div className="flex flex-col md:flex-row gap-8 bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur mb-8">
            <div className="md:w-1/3">
              {/* ВИПРАВЛЕННЯ ІКОНКИ: Додано веб-плейсхолдер */}
              <img 
                src={movie.imageUrl || "https://placehold.co/300x450/666/FFFFFF?text=No+Poster"} 
                alt={movie.title} 
                className="w-full h-auto object-cover rounded-xl shadow-lg border-2 border-amber-500/30" 
              />
            </div>
            <div className="md:w-2/3">
              <h1 className="text-4xl font-bold text-white mb-2">
                {movie.title}
                <span className="text-2xl text-amber-400 ml-2">({movie.year})</span>
              </h1>
              <div className="border-t border-amber-500/20 pt-4 mt-4 space-y-3">
                <p className="text-lg text-gray-300"><strong className="text-amber-400">Режисер:</strong> {movie.director}</p>
                <p className="text-lg text-gray-300"><strong className="text-amber-400">Актори:</strong> {movie.actors.join(", ")}</p>
                <p className="text-gray-400 text-justify leading-relaxed mt-4">{movie.description || "Опис..."}</p>
              </div>
              <div className="mt-6 flex gap-4 flex-wrap">
                <button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white px-6 py-3 rounded-lg transition-all font-medium border border-amber-400/30">Додати в улюбленe</button>
                {isAdmin && (
                  <button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-3 rounded-lg transition-all font-medium border border-blue-400/30">Редагувати</button>
                )}
                {isAdmin && (
                  <button onClick={handleDeleteMovie} className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-lg transition-all font-medium border border-red-400/30">Видалити</button>
                )}
              </div>
            </div>
          </div>
        ) : (
          // --- Режим редагування (Адмін) ---
          <form onSubmit={handleEditSubmit} className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur mb-8 space-y-4">
            <div>
              <label className="block text-amber-400 mb-2">Назва</label>
              <input type="text" name="title" value={editData.title} onChange={handleEditChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
            </div>
            {/* ... (інші поля вводу) ... */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-amber-400 mb-2">Рік</label>
                <input type="number" name="year" value={editData.year} onChange={handleEditChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
              </div>
              <div>
                <label className="block text-amber-400 mb-2">Режисер</label>
                <input type="text" name="director" value={editData.director} onChange={handleEditChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
              </div>
            </div>
            <div>
                <label className="block text-amber-400 mb-2">Актори (через кому)</label>
                <input type="text" name="actors" value={editData.actors} onChange={handleEditChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
            </div>
            <div>
              <label className="block text-amber-400 mb-2">Постер (завантажити новий)</label>
              <input 
                type="file" 
                name="posterFile" 
                onChange={handleFileChange} 
                accept="image/*"
                className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
              />
            </div>
            <div>
              <label className="block text-amber-400 mb-2">Опис</label>
              <textarea name="description" value={editData.description} onChange={handleEditChange} rows="5" className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"></textarea>
            </div>
            <div className="flex gap-4">
              <button type="submit" className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-6 py-3 rounded-lg">Зберегти</button>
              <button type="button" onClick={() => { setIsEditing(false); setPosterFile(null); }} className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white px-6 py-3 rounded-lg">Скасувати</button>
            </div>
          </form>
        )}

        {/* --- БЛОК ВІДГУКІВ (Без змін) --- */}
        <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur">
          <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
            Відгуки користувачів
          </h2>
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  onDelete={() => {}} // onDelete={handleDeleteReview} 
                />
              ))
            ) : (
              <p className="text-gray-400">Для цього фільму ще немає відгуків.</p>
            )}
          </div>
        </div>

        {isAuthenticated && (
          <ReviewForm onSubmit={() => {}} /> // onSubmit={handleAddReview}
        )}
      </div>
    </div>
  )
}