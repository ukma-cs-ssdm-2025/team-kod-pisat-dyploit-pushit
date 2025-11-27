import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { LikesContext } from "../context/LikesContext";
import { WatchedContext } from "../context/WatchedContext";
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

} from "../api";
import { useAuth } from "../hooks/useAuth";
import ReviewCard from "../components/ReviewCard";
import ReviewForm from "../components/ReviewForm";
import MultiSelect from "../components/MultiSelect";
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Avatar from '../components/Avatar';


export default function Movie() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, isAdmin } = useAuth();

  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [people, setPeople] = useState([]);
  const [allPeopleOptions, setAllPeopleOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [posterFile, setPosterFile] = useState(null);


  const { likedMovies, setLikedMovies } = useContext(LikesContext);
  const { watchedMovies, addWatchedMovie, removeWatchedMovie } =
    useContext(WatchedContext);


  const isHeartLiked = movie ? likedMovies.includes(movie.id) : false;
  const isWatched = movie
    ? watchedMovies.some((m) => m.id === movie.id)
    : false;


  const toggleHeart = () => {
    if (!movie) return;

    setLikedMovies((prev) =>
      prev.includes(movie.id)
        ? prev.filter((id) => id !== movie.id)
        : [...prev, movie.id]
    );
  };


  const toggleWatched = () => {
    if (!movie) return;

    if (isWatched) {
      removeWatchedMovie(movie.id);
    } else {
      addWatchedMovie(movie.id);
    }
  };

  

  const [confirmModalConfig, setConfirmModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '' });


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
        
        if (currentUser && currentUser.liked_movies) {
          setIsLiked(currentUser.liked_movies.includes(Number(id)));
        }
        
        const peopleList = allPeopleList.people || allPeopleList;
        const options = peopleList.map(p => ({
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
      
      const reviewsList = allReviews.reviews || allReviews;
      const usersList = allUsers.users || allUsers;

      const movieReviews = reviewsList
        .filter(review => review.movie_id === numericId)
        .map(review => {
          const author = usersList.find(u => u.id === review.user_id);
          return {
            ...review,
            text: review.body || review.text,
            user: author || { username: 'deleted', nickname: 'Unknown User' }
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
      setReviews(movieReviews);

    }).catch(err => {
      console.error("Error loading data:", err);
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
      setAlertConfig({ isOpen: true, title: "Access Denied", message: "Please log in to add movies to your favorites." });
      return;
    }

    setIsLikeLoading(true);
    try {
      if (isLiked) {
        await removeFromLikedMovies(currentUser.id, id);
        setIsLiked(false);
        if (currentUser.liked_movies) {
          currentUser.liked_movies = currentUser.liked_movies.filter(movieId => movieId !== Number(id));
        }
      } else {
        await addToLikedMovies(currentUser.id, id);
        setIsLiked(true);
        if (!currentUser.liked_movies) {
          currentUser.liked_movies = [];
        }
        currentUser.liked_movies.push(Number(id));
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      setAlertConfig({ isOpen: true, title: "Error", message: "Failed to update status" });
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

      setAlertConfig({ isOpen: true, title: "Success", message: "Movie updated successfully!" });
      setIsEditing(false);
      setPosterFile(null);
      fetchData(); 

    } catch (err) {
      console.error("Update error:", err);
      setAlertConfig({ isOpen: true, title: "Error", message: `Error: ${err.message || 'Update failed'}` });
    }
  };

  const confirmDeleteMovie = () => {
    setConfirmModalConfig({
        isOpen: true,
        title: "Delete Movie?",
        message: `Are you sure you want to delete "${movie.title}"? This cannot be undone.`,
        onConfirm: async () => {
            try {
                await deleteMovie(id);
                setAlertConfig({ isOpen: true, title: "Success", message: "Movie deleted!" });
                setTimeout(() => navigate('/movies'), 1500);
            } catch (err) {
                setAlertConfig({ isOpen: true, title: "Error", message: `Error: ${err.message || 'Delete failed'}` });
            }
        }
    });
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
      setAlertConfig({ isOpen: true, title: "Error", message: `Error adding review: ${err.message}` });
    }
  };

  const confirmDeleteReview = (reviewId) => {
      setConfirmModalConfig({
          isOpen: true,
          title: "Delete Review?",
          message: "Are you sure you want to delete this review?",
          onConfirm: async () => {
              try {
                  await deleteReview(reviewId);
                  fetchData();
              } catch (err) {
                  setAlertConfig({ isOpen: true, title: "Error", message: `Error deleting review: ${err.message}` });
              }
          }
      });
  };


  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400 cursor-wait">Loading...</div>
  }

  if (!movie) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-red-400">Movie not found.</div>
  }

  const directors = people.filter(p => p.profession === 'director');
  const producers = people.filter(p => p.profession === 'producer');
  const actors = people.filter(p => p.profession === 'actor');

  const dbRating = movie.rating ? parseFloat(movie.rating).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-8 pb-8">
      <div className="max-w-5xl mx-auto p-4">
        
        {!isEditing ? (
          <div className="flex flex-col md:flex-row gap-8 bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8 shadow-2xl">
            <div className="md:w-1/3">
              <img 
                src={movie.cover_url || "https://placehold.co/300x450/374151/FFFFFF?text=No+Poster"} 
                alt={movie.title} 
                className="w-full h-auto object-cover rounded-xl shadow-lg border-2 border-gray-600" 
              />
            </div>
            <div className="md:w-2/3">
              <h1 className="text-4xl font-bold text-white mb-2 border-b border-gray-700 pb-2">
                {movie.title}
                <span className="text-2xl text-blue-400 ml-4 font-normal">({dbRating} ★)</span>
              </h1>
              <p className="text-lg text-gray-300 mb-4"><strong className="text-blue-400 font-semibold">Genre:</strong> {movie.genre || 'N/A'}</p>
              
              <div className="pt-4 space-y-4">
                <p className="text-gray-400 text-justify leading-relaxed">{movie.description || "No description available."}</p>
                
                {directors.length > 0 && (
                  <div>
                    <strong className="text-blue-400 font-semibold block mb-1">Director(s):</strong>
                    <div className="flex flex-wrap gap-2">
                      {directors.map(person => (
                        <Link key={person.id} to={`/people/${person.id}`} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full transition-colors cursor-pointer group">
                          <Avatar src={person.avatar_url} alt={`${person.first_name} ${person.last_name}`} size="sm" className="w-6 h-6 text-xs" />
                          <span className="text-gray-300 group-hover:text-white text-sm">
                            {person.first_name} {person.last_name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {producers.length > 0 && (
                  <div>
                    <strong className="text-blue-400 font-semibold block mb-1">Producer(s):</strong>
                    <div className="flex flex-wrap gap-2">
                      {producers.map(person => (
                        <Link key={person.id} to={`/people/${person.id}`} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full transition-colors cursor-pointer group">
                           <Avatar src={person.avatar_url} alt={`${person.first_name} ${person.last_name}`} size="sm" className="w-6 h-6 text-xs" />
                          <span className="text-gray-300 group-hover:text-white text-sm">
                            {person.first_name} {person.last_name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {actors.length > 0 && (
                  <div>
                    <strong className="text-blue-400 font-semibold block mb-1">Cast:</strong>
                    <div className="flex flex-wrap gap-2">
                      {actors.map(person => (
                        <Link key={person.id} to={`/people/${person.id}`} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full transition-colors cursor-pointer group">
                           <Avatar src={person.avatar_url} alt={`${person.first_name} ${person.last_name}`} size="sm" className="w-6 h-6 text-xs" />
                          <span className="text-gray-300 group-hover:text-white text-sm">
                            {person.first_name} {person.last_name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

              </div>
              <div className="mt-8 flex gap-4 flex-wrap">
                <button 
                  onClick={handleLikeToggle}
                  disabled={isLikeLoading}
                  className={`${isLiked ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} text-white px-6 py-2 rounded-lg font-medium shadow-lg transition-colors disabled:opacity-50 cursor-pointer`}
                >
                  {isLikeLoading ? '...' : isLiked ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
                {isAdmin && (
                  <button onClick={() => setIsEditing(true)} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg transition-colors cursor-pointer">Edit Movie</button>
                )}
                {isAdmin && (
                  <button onClick={confirmDeleteMovie} className="bg-red-900 hover:bg-red-800 text-red-100 px-6 py-2 rounded-lg font-medium shadow-lg transition-colors cursor-pointer">Delete Movie</button>
                )}
               <button
  onClick={toggleHeart}
  className={`
    w-11 h-11 rounded-full flex items-center justify-center
    transition-all duration-300 shadow
    ${isHeartLiked 
      ? 'bg-red-600 hover:bg-red-500 scale-110' 
      : 'bg-gray-700 hover:bg-gray-600'
    }
  `}
>
  {isHeartLiked ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" className="w-6 h-6">
      <path d="M12 21.35s9-7.5 9-12.75A4.5 4.5 0 0 0 12 5.25 4.5 4.5 0 0 0 3 8.6c0 5.25 9 12.75 9 12.75z"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
         strokeWidth="2" stroke="currentColor" className="w-6 h-6 text-gray-300">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M21 8.25c0 5.25-9 12.75-9 12.75S3 13.5 3 8.25A4.5 4.5 0 0 1 12 5.25a4.5 4.5 0 0 1 9 3Z"
      />
    </svg>
  )}
</button>
<button
  onClick={toggleWatched}
  className={`
    w-11 h-11 rounded-full flex items-center justify-center
    transition-all duration-300 shadow
    ${isWatched 
      ? 'bg-green-600 hover:bg-green-500 scale-110' 
      : 'bg-gray-700 hover:bg-gray-600'
    }
  `}
  title={isWatched ? "Позначено як переглянуте" : "Переглянути"}
>
  {isWatched ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="#4ade80" viewBox="0 0 24 24" className="w-6 h-6">
      <path d="M5 12l4 4L19 6" stroke="#4ade80" strokeWidth="2" fill="none"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
         strokeWidth="2" stroke="currentColor" className="w-6 h-6 text-gray-300">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  )}
</button>


              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEditSubmit} className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8 space-y-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Edit Movie</h2>
            
            <div>
              <label className="block text-blue-400 mb-2 font-medium cursor-default">Title</label>
              <input type="text" name="title" value={editData.title} onChange={handleEditChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"/>
            </div>
            <div>
              <label className="block text-blue-400 mb-2 font-medium cursor-default">Genre</label>
              <input type="text" name="genre" value={editData.genre} onChange={handleEditChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"/>
            </div>
            
            <MultiSelect 
              label="Select People (Actors, Directors)"
              options={allPeopleOptions}
              selectedIds={editData.people_ids}
              onChange={handlePeopleChange}
              placeholder="Search person..."
            />

            <div>
              <label className="block text-blue-400 mb-2 font-medium cursor-default">Cover Image (Upload new)</label>
              <input type="file" name="posterFile" onChange={handleFileChange} accept="image/*" className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"/>
            </div>
            <div>
              <label className="block text-blue-400 mb-2 font-medium cursor-default">Description</label>
              <textarea name="description" value={editData.description} onChange={handleEditChange} rows="5" className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"></textarea>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-medium cursor-pointer">Save Changes</button>
              <button type="button" onClick={() => { setIsEditing(false); setPosterFile(null); }} className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-medium cursor-pointer">Cancel</button>
            </div>
          </form>
        )}

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-blue-500 pl-4">
            User Reviews ({reviews.length})
          </h2>
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  onDelete={() => confirmDeleteReview(review.id)} 
                />
              ))
            ) : (
              <p className="text-gray-400 italic cursor-default">No reviews yet. Be the first!</p>
            )}
          </div>
        </div>

        {isAuthenticated && (
          <ReviewForm onSubmit={handleAddReview} />
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig({ ...confirmModalConfig, isOpen: false })}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
      />
      <AlertModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  )}