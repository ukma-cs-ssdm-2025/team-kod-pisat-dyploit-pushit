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
  uploadMovieCover,
  addToLikedMovies,
  removeFromLikedMovies
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
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  
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
        
        // Перевіряємо чи фільм в обраних
        if (currentUser && currentUser.liked_movies) {
          setIsLiked(currentUser.liked_movies.includes(Number(id)));
        }
        
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
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
      setReviews(movieReviews);

    }).catch(err => {
      console.error("Помилка завантаження даних:", err);
      setMovie(null); 
    }).finally(() => {
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [id, currentUser]); 

  const handleLikeToggle = async () => {
    if (!isAuthenticated || !currentUser) {
      alert("Будь ласка, увійдіть в систему щоб додавати фільми до обраних");
      return;
    }

    setIsLikeLoading(true);
    try {
      if (isLiked) {
        await removeFromLikedMovies(currentUser.id, id);
        setIsLiked(false);
        // Оновлюємо локальний стан користувача
        if (currentUser.liked_movies) {
          currentUser.liked_movies = currentUser.liked_movies.filter(movieId => movieId !== Number(id));
        }
      } else {
        await addToLikedMovies(currentUser.id, id);
        setIsLiked(true);
        // Оновлюємо локальний стан користувача
        if (!currentUser.liked_movies) {
          currentUser.liked_movies = [];
        }
        currentUser.liked_movies.push(Number(id));
      }
    } catch (err) {
      console.error("Помилка зміни статусу обраного фільму:", err);
      alert("Не вдалося змінити статус фільму");
    } finally {
      setIsLikeLoading(false);
    }
  };

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
      fetchData(); 
    } catch (err) {
      alert(`Помилка додавання відгуку: ${err.message}`);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Ви впевнені, що хочете видалити цей відгук?")) {
      try {
        await deleteReview(reviewId);
        fetchData();
      } catch (err) {
        alert(`Помилка видалення відгуку: ${err.message}`);
      }
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400">Завантаження...</div>
  }

  if (!movie) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-red-400">На жаль, фільм не знайдено.</div>
  }

  const directors = people.filter(p => p.profession === 'director');
  const producers = people.filter(p => p.profession === 'producer');
  const actors = people.filter(p => p.profession === 'actor');

  const dbRating = movie.rating ? parseFloat(movie.rating).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-8">
      <div className="max-w-5xl mx-auto p-4">
        
        {!isEditing ? (
          <div className="flex flex-col md:flex-row gap-8 card p-6 mb-8">
            <div className="md:w-1/3">
              <img 
                src={movie.cover_url || "https://placehold.co/300x450/374151/FFFFFF?text=No+Poster"} 
                alt={movie.title} 
                className="w-full h-auto object-cover rounded-xl shadow-lg border-2 border-gray-600" 
              />
            </div>
            <div className="md:w-2/3">
              <h1 className="text-4xl font-bold text-white mb-2">
                {movie.title}
                <span className="text-2xl text-blue-400 ml-2">({dbRating} ★)</span>
              </h1>
              <p className="text-lg text-gray-300"><strong className="text-blue-400">Жанр:</strong> {movie.genre || 'N/A'}</p>
              
              <div className="border-t border-gray-700 pt-4 mt-4 space-y-3">
                <p className="text-gray-400 text-justify leading-relaxed mt-4">{movie.description || "Опис відсутній."}</p>
                
                {directors.length > 0 && (
                  <div>
                    <strong className="text-blue-400">Режисер(и):</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {directors.map(person => (
                        <Link key={person.id} to={`/people/${person.id}`} className="text-gray-300 bg-gray-700 px-3 py-1 rounded-lg hover:bg-gray-600 hover:text-white transition-colors">
                          {person.first_name} {person.last_name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {producers.length > 0 && (
                  <div>
                    <strong className="text-blue-400">Продюсер(и):</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {producers.map(person => (
                        <Link key={person.id} to={`/people/${person.id}`} className="text-gray-300 bg-gray-700 px-3 py-1 rounded-lg hover:bg-gray-600 hover:text-white transition-colors">
                          {person.first_name} {person.last_name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {actors.length > 0 && (
                  <div>
                    <strong className="text-blue-400">Актори:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {actors.map(person => (
                        <Link key={person.id} to={`/people/${person.id}`} className="text-gray-300 bg-gray-700 px-3 py-1 rounded-lg hover:bg-gray-600 hover:text-white transition-colors">
                          {person.first_name} {person.last_name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

              </div>
              <div className="mt-6 flex gap-4 flex-wrap">
                <button 
                  onClick={handleLikeToggle}
                  disabled={isLikeLoading}
                  className={`${isLiked ? 'btn-danger' : 'btn-primary'} disabled:opacity-50`}
                >
                  {isLikeLoading ? '...' : isLiked ? 'Видалити з обраних' : 'Додати в обрані'}
                </button>
                {isAdmin && (
                  <button onClick={() => setIsEditing(true)} className="btn-secondary">Редагувати</button>
                )}
                {isAdmin && (
                  <button onClick={handleDeleteMovie} className="btn-danger">Видалити</button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEditSubmit} className="card p-6 mb-8 space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Редагування фільму</h2>
            
            <div>
              <label className="block text-blue-400 mb-2 font-medium">Назва</label>
              <input type="text" name="title" value={editData.title} onChange={handleEditChange} className="form-input"/>
            </div>
            <div>
              <label className="block text-blue-400 mb-2 font-medium">Жанр</label>
              <input type="text" name="genre" value={editData.genre} onChange={handleEditChange} className="form-input"/>
            </div>
            
            <MultiSelect 
              label="Обрати Людей (Актори, Режисери)"
              options={allPeopleOptions}
              selectedIds={editData.people_ids}
              onChange={handlePeopleChange}
              placeholder="Пошук людини..."
            />

            <div>
              <label className="block text-blue-400 mb-2 font-medium">Обкладинка (завантажити нову)</label>
              <input type="file" name="posterFile" onChange={handleFileChange} accept="image/*" className="form-input file:bg-gray-700 file:text-white file:border-0 file:rounded file:px-4 file:py-2"/>
            </div>
            <div>
              <label className="block text-blue-400 mb-2 font-medium">Опис</label>
              <textarea name="description" value={editData.description} onChange={handleEditChange} rows="5" className="form-input"></textarea>
            </div>
            
            <div className="flex gap-4">
              <button type="submit" className="btn-primary">Зберегти</button>
              <button type="button" onClick={() => { setIsEditing(false); setPosterFile(null); }} className="btn-secondary">Скасувати</button>
            </div>
          </form>
        )}

        <div className="card p-6">
          <h2 className="section-title">
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