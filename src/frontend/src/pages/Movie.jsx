import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom" 
import { 
  getMovieById, 
  getAllReviews, 
  getAllUsers,
  getAllPeople,
  updateMovie, 
  addReview, 
  deleteReview, 
  deleteMovie,
  uploadMovieCover 
} from "../api" 
import { useAuth } from '../hooks/useAuth';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';
import MultiSelect from '../components/MultiSelect';

export default function Movie() {
  const { id } = useParams()
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, isAdmin } = useAuth();

  const [movie, setMovie] = useState(null)
  const [reviews, setReviews] = useState([])
  const [people, setPeople] = useState([])
  const [allPeopleOptions, setAllPeopleOptions] = useState([])
  // Видалили averageRating state
  const [isLoading, setIsLoading] = useState(true)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(null) 
  const [posterFile, setPosterFile] = useState(null);

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      getMovieById(id),
      getAllReviews(),
      getAllUsers(),
      getAllPeople()
    ]).then(([movieResponse, allReviews, allUsers, allPeopleList]) => {
      
      if (movieResponse) {
        setMovie(movieResponse);
        setPeople(movieResponse.people || []);
        
        const options = allPeopleList.map(p => ({
          id: p.id,
          label: `${p.first_name} ${p.last_name} (${p.profession})`
        }));
        setAllPeopleOptions(options);

        setEditData({ 
          title: movieResponse.title || '',
          description: movieResponse.description || '',
          genre: movieResponse.genre || '',
          people_ids: (movieResponse.people || []).map(p => p.id)
        });
      } else {
        setMovie(null);
      }

      const numericId = Number(id);
      
      const movieReviews = allReviews
        .filter(review => review.movie_id === numericId)
        .map(review => {
          const author = allUsers.find(u => u.id === review.user_id);
          return {
            ...review,
            text: review.body || review.text,
            user: author || { username: 'deleted', nickname: 'Unknown User' }
          };
        })
        // Сортуємо відгуки: новіші зверху
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
      setReviews(movieReviews);

      // Видалили локальний розрахунок рейтингу

    }).catch(err => {
      console.error("Помилка завантаження даних:", err);
      setMovie(null); 
    }).finally(() => {
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [id]); 

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };
  
  const handlePeopleChange = (newSelectedIds) => {
    setEditData({ ...editData, people_ids: newSelectedIds });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPosterFile(e.target.files[0]);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const movieData = {
        title: editData.title,
        description: editData.description,
        genre: editData.genre,
        people_ids: editData.people_ids,
      };
    
      await updateMovie(id, movieData);
      
      if (posterFile) {
        await uploadMovieCover(id, posterFile);
      }

      alert('Фільм оновлено!');
      setIsEditing(false);
      setPosterFile(null);
      fetchData(); 

    } catch (err) {
      console.error("Помилка оновлення:", err);
      alert(`Помилка: ${err.message || 'Не вдалося оновити'}`);
    }
  };

  const handleDeleteMovie = async () => {
    if (window.confirm(`Ви впевнені, що хочете видалити фільм "${movie.title}"?`)) {
      try {
        await deleteMovie(id);
        alert('Фільм видалено!');
        navigate('/movies');
      } catch (err) {
        alert(`Помилка: ${err.message || 'Не вдалося видалити'}`);
      }
    }
  };

  const handleAddReview = async (reviewData) => {
    try {
      const dataToSend = {
        ...reviewData,
        movie_id: Number(id) 
      };
      await addReview(dataToSend);
      // Важливо: перезавантажуємо дані, щоб отримати оновлений рейтинг з БД
      fetchData(); 
    } catch (err) {
      alert(`Помилка додавання відгуку: ${err.message}`);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Ви впевнені, що хочете видалити цей відгук?")) {
      try {
        await deleteReview(reviewId);
        // Важливо: перезавантажуємо дані, щоб отримати оновлений рейтинг з БД
        fetchData();
      } catch (err) {
        alert(`Помилка видалення відгуку: ${err.message}`);
      }
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-center pt-32 text-lg text-amber-400">Завантаження...</div>
  }

  if (!movie) {
    return <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-center pt-32 text-lg text-red-500">На жаль, фільм не знайдено.</div>
  }

  const directors = people.filter(p => p.profession === 'director');
  const producers = people.filter(p => p.profession === 'producer');
  const actors = people.filter(p => p.profession === 'actor');

  // Отримуємо рейтинг з БД (або 0, якщо null)
  const dbRating = movie.rating ? parseFloat(movie.rating).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 pt-24 pb-8">
      <div className="max-w-5xl mx-auto p-4">
        
        {!isEditing ? (
          <div className="flex flex-col md:flex-row gap-8 bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur mb-8">
            <div className="md:w-1/3">
              <img 
                src={movie.cover_url || "https://placehold.co/300x450/666/FFFFFF?text=No+Poster"} 
                alt={movie.title} 
                className="w-full h-auto object-cover rounded-xl shadow-lg border-2 border-amber-500/30" 
              />
            </div>
            <div className="md:w-2/3">
              <h1 className="text-4xl font-bold text-white mb-2">
                {movie.title}
                {/* --- ВІДОБРАЖЕННЯ РЕЙТИНГУ З БД --- */}
                <span className="text-2xl text-amber-400 ml-2">({dbRating} ★)</span>
              </h1>
              <p className="text-lg text-gray-300"><strong className="text-amber-400">Жанр:</strong> {movie.genre || 'N/A'}</p>
              
              <div className="border-t border-amber-500/20 pt-4 mt-4 space-y-3">
                <p className="text-gray-400 text-justify leading-relaxed mt-4">{movie.description || "Опис відсутній."}</p>
                
                {directors.length > 0 && (
                  <div>
                    <strong className="text-amber-400">Режисер(и):</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {directors.map(person => (
                        <Link key={person.id} to={`/people/${person.id}`} className="text-gray-300 bg-purple-800/50 px-3 py-1 rounded-lg hover:bg-purple-700 hover:text-white transition-colors">
                          {person.first_name} {person.last_name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {producers.length > 0 && (
                  <div>
                    <strong className="text-amber-400">Продюсер(и):</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {producers.map(person => (
                        <Link key={person.id} to={`/people/${person.id}`} className="text-gray-300 bg-purple-800/50 px-3 py-1 rounded-lg hover:bg-purple-700 hover:text-white transition-colors">
                          {person.first_name} {person.last_name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {actors.length > 0 && (
                  <div>
                    <strong className="text-amber-400">Актори:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {actors.map(person => (
                        <Link key={person.id} to={`/people/${person.id}`} className="text-gray-300 bg-purple-800/50 px-3 py-1 rounded-lg hover:bg-purple-700 hover:text-white transition-colors">
                          {person.first_name} {person.last_name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

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
          <form onSubmit={handleEditSubmit} className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur mb-8 space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Редагування фільму</h2>
            
            <div>
              <label className="block text-amber-400 mb-2">Назва</label>
              <input type="text" name="title" value={editData.title} onChange={handleEditChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
            </div>
            <div>
              <label className="block text-amber-400 mb-2">Жанр</label>
              <input type="text" name="genre" value={editData.genre} onChange={handleEditChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
            </div>
            
            <MultiSelect 
              label="Обрати Людей (Актори, Режисери)"
              options={allPeopleOptions}
              selectedIds={editData.people_ids}
              onChange={handlePeopleChange}
              placeholder="Пошук людини..."
            />

            <div>
              <label className="block text-amber-400 mb-2">Обкладинка (завантажити нову)</label>
              <input type="file" name="posterFile" onChange={handleFileChange} accept="image/*" className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"/>
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

        <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur">
          <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
            Відгуки користувачів ({reviews.length})
          </h2>
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  onDelete={() => handleDeleteReview(review.id)} 
                />
              ))
            ) : (
              <p className="text-gray-400">Для цього фільму ще немає відгуків.</p>
            )}
          </div>
        </div>

        {isAuthenticated && (
          <ReviewForm onSubmit={handleAddReview} />
        )}
      </div>
    </div>
  )
}