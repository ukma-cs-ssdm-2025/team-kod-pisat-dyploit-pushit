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
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Avatar from '../components/Avatar';

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

  // LOADING / NOT FOUND – той самий стиль
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        <div className="text-lg font-extrabold tracking-[0.18em] uppercase text-[#d6cecf]">
          Loading...
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        <div className="text-lg font-extrabold tracking-[0.18em] uppercase text-red-400">
          Movie not found.
        </div>
      </div>
    );
  }

  const directors = people.filter(p => p.profession === 'director');
  const producers = people.filter(p => p.profession === 'producer');
  const actors = people.filter(p => p.profession === 'actor');

  const dbRating = movie.rating ? parseFloat(movie.rating).toFixed(1) : '0.0';

  return (
    <div
      className="min-h-screen px-4 py-8 flex justify-center"
      style={{ backgroundColor: "#1a1a1a" }}
    >
      <div className="w-full max-w-5xl">
        {/* VIEW MODE */}
        {!isEditing ? (
          <div className="bg-[#606aa2] border-black rounded-[15px] p-6 mb-8 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              
              {/* POSTER */}
              <div className="w-full md:w-1/3 flex justify-center">
                <div className="bg-[#1a1a1a] border-[4px] border-black rounded-[16px] p-3 w-full max-w-xs">
                  <img 
                    src={movie.cover_url || "https://placehold.co/300x450/1a1a1a/FFFFFF?text=No+Poster"} 
                    alt={movie.title} 
                    className="w-full h-[260px] md:h-[320px] object-cover rounded-[12px]"
                  />
                </div>
              </div>

              {/* INFO */}
              <div className="w-full md:w-2/3 text-center md:text-left">
                <h1
                  className="
                    text-2xl md:text-3xl
                    font-extrabold
                    text-[#d6cecf]
                    uppercase
                    tracking-[0.18em]
                    mb-2
                  "
                  style={{ letterSpacing: "0.12em", wordSpacing: "0.12em" }}
                >
                  {movie.title}
                </h1>

                <p className="text-sm md:text-base text-black font-extrabold tracking-[0.12em] uppercase mb-3">
                  Genre: {movie.genre || 'N/A'} • Rating: {dbRating} ★
                </p>

                <div className="border-t-[3px] border-black pt-3 mt-2 space-y-4">
                  <p className="text-sm md:text-base text-[#1a1a1a] font-extrabold leading-relaxed">
                    {movie.description || "No description available."}
                  </p>

                  {/* DIRECTORS */}
                  {directors.length > 0 && (
                    <div>
                      <p className="text-xs md:text-sm text-[#d6cecf] uppercase font-semibold tracking-[0.08em] mb-1">
                        Director(s)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {directors.map(person => (
                          <Link
                            key={person.id}
                            to={`/people/${person.id}`}
                            className="
                              flex items-center gap-2
                              bg-[#1a1a1a]
                              border-[3px] border-black
                              rounded-[16px]
                              px-3 py-1
                              cursor-pointer
                              hover:bg-black
                              transition-colors
                            "
                          >
                            <Avatar
                              src={person.avatar_url}
                              alt={`${person.first_name} ${person.last_name}`}
                              size="sm"
                              className="w-6 h-6 text-xs"
                            />
                            <span className="text-[#d6cecf] text-xs md:text-sm font-extrabold">
                              {person.first_name} {person.last_name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PRODUCERS */}
                  {producers.length > 0 && (
                    <div>
                      <p className="text-xs md:text-sm text-[#d6cecf] uppercase font-semibold tracking-[0.08em] mb-1">
                        Producer(s)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {producers.map(person => (
                          <Link
                            key={person.id}
                            to={`/people/${person.id}`}
                            className="
                              flex items-center gap-2
                              bg-[#1a1a1a]
                              border-[3px] border-black
                              rounded-[16px]
                              px-3 py-1
                              cursor-pointer
                              hover:bg-black
                              transition-colors
                            "
                          >
                            <Avatar
                              src={person.avatar_url}
                              alt={`${person.first_name} ${person.last_name}`}
                              size="sm"
                              className="w-6 h-6 text-xs"
                            />
                            <span className="text-[#d6cecf] text-xs md:text-sm font-extrabold">
                              {person.first_name} {person.last_name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CAST */}
                  {actors.length > 0 && (
                    <div>
                      <p className="text-xs md:text-sm text-[#d6cecf] uppercase font-semibold tracking-[0.08em] mb-1">
                        Cast
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {actors.map(person => (
                          <Link
                            key={person.id}
                            to={`/people/${person.id}`}
                            className="
                              flex items-center gap-2
                              bg-[#1a1a1a]
                              border-[3px] border-black
                              rounded-[16px]
                              px-3 py-1
                              cursor-pointer
                              hover:bg-black
                              transition-colors
                            "
                          >
                            <Avatar
                              src={person.avatar_url}
                              alt={`${person.first_name} ${person.last_name}`}
                              size="sm"
                              className="w-6 h-6 text-xs"
                            />
                            <span className="text-[#d6cecf] text-xs md:text-sm font-extrabold">
                              {person.first_name} {person.last_name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* BUTTONS */}
                <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                  <button 
                    onClick={handleLikeToggle}
                    disabled={isLikeLoading}
                    className={`
                      font-extrabold
                      text-xs md:text-sm
                      tracking-[0.16em]
                      uppercase
                      border-[3px] border-black
                      rounded-[12px]
                      px-6 py-2
                      transition-colors
                      cursor-pointer
                      ${isLiked
                        ? "bg-[#c0392b] text-[#d6cecf] hover:bg-[#e74c3c]"
                        : "bg-[#c9c7c7] text-black hover:bg-[#e0dfdf]"
                      }
                      disabled:opacity-60
                    `}
                  >
                    {isLikeLoading ? '...' : isLiked ? 'Remove from Favorites' : 'Add to Favorites'}
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="
                        bg-[#2b2727]
                        text-[#d6cecf]
                        font-extrabold
                        text-xs md:text-sm
                        tracking-[0.16em]
                        uppercase
                        border-[3px] border-black
                        rounded-[12px]
                        px-6 py-2
                        hover:bg-black
                        transition-colors
                        cursor-pointer
                      "
                    >
                      Edit Movie
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={confirmDeleteMovie}
                      className="
                        bg-[#c0392b]
                        text-[#d6cecf]
                        font-extrabold
                        text-xs md:text-sm
                        tracking-[0.16em]
                        uppercase
                        border-[3px] border-black
                        rounded-[12px]
                        px-6 py-2
                        hover:bg-[#e74c3c]
                        transition-colors
                        cursor-pointer
                      "
                    >
                      Delete Movie
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* EDIT FORM */
          <form
            onSubmit={handleEditSubmit}
            className="
              bg-[#606aa2]
              rounded-[15px]
              p-6 mb-8
              shadow-2xl
              space-y-4
              border-black
            "
          >
            <h2
              className="
                text-2xl font-extrabold
                text-[#d6cecf]
                uppercase
                tracking-[0.18em]
                mb-2
              "
              style={{ letterSpacing: "0.12em" }}
            >
              Edit Movie
            </h2>

            <div>
              <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={editData.title}
                onChange={handleEditChange}
                className="
                  w-full
                  bg-[#2b2727]
                  text-[#d6cecf]
                  border-[3px] border-black
                  rounded-[16px]
                  px-4 py-2
                  focus:outline-none
                  focus:border-[#d6cecf]
                  placeholder:uppercase
                  placeholder:tracking-[0.12em]
                  cursor-text
                "
              />
            </div>

            <div>
              <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
                Genre
              </label>
              <input
                type="text"
                name="genre"
                value={editData.genre}
                onChange={handleEditChange}
                className="
                  w-full
                  bg-[#2b2727]
                  text-[#d6cecf]
                  border-[3px] border-black
                  rounded-[16px]
                  px-4 py-2
                  focus:outline-none
                  focus:border-[#d6cecf]
                  placeholder:uppercase
                  placeholder:tracking-[0.12em]
                  cursor-text
                "
              />
            </div>

            <div>
              <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
                Select People (Actors, Directors)
              </label>
              <div className="bg-[#2b2727] border-[3px] border-black rounded-[16px] px-3 py-2">
                <MultiSelect 
                  label=""
                  options={allPeopleOptions}
                  selectedIds={editData.people_ids}
                  onChange={handlePeopleChange}
                  placeholder="Search person..."
                />
              </div>
            </div>

            <div>
              <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
                Cover Image (Upload new)
              </label>
              <input
                type="file"
                name="posterFile"
                onChange={handleFileChange}
                accept="image/*"
                className="
                  w-full
                  bg-[#2b2727]
                  text-[#d6cecf]
                  border-[3px] border-black
                  rounded-[16px]
                  px-4 py-2
                  cursor-pointer
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-[10px] file:border-0
                  file:text-xs file:font-extrabold
                  file:uppercase file:tracking-[0.14em]
                  file:bg-[#c9c7c7] file:text-black
                  hover:file:bg-[#e0dfdf]
                "
              />
            </div>

            <div>
              <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
                Description
              </label>
              <textarea
                name="description"
                value={editData.description}
                onChange={handleEditChange}
                rows="5"
                className="
                  w-full
                  bg-[#2b2727]
                  text-[#d6cecf]
                  border-[3px] border-black
                  rounded-[16px]
                  px-4 py-2
                  focus:outline-none
                  focus:border-[#d6cecf]
                  placeholder:uppercase
                  placeholder:tracking-[0.12em]
                  cursor-text
                  resize-none
                "
              />
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <button
                type="submit"
                className="
                  bg-[#c9c7c7]
                  text-black
                  font-extrabold
                  text-xs md:text-sm
                  tracking-[0.18em]
                  uppercase
                  border-[3px] border-black
                  rounded-[14px]
                  px-6 py-2
                  hover:bg-[#e0dfdf]
                  transition-colors
                  cursor-pointer
                "
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => { setIsEditing(false); setPosterFile(null); }}
                className="
                  bg-[#2b2727]
                  text-[#d6cecf]
                  font-extrabold
                  text-xs md:text-sm
                  tracking-[0.18em]
                  uppercase
                  border-[3px] border-black
                  rounded-[14px]
                  px-6 py-2
                  hover:bg-black
                  transition-colors
                  cursor-pointer
                "
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* REVIEWS CARD */}
        <div className="bg-[#606aa2] border-black rounded-[15px] p-6 shadow-2xl">
          <h2 className="text-2xl font-extrabold text-[#d6cecf] mb-6 uppercase tracking-[0.16em]">
            User Reviews ({reviews.length})
          </h2>
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  onDelete={() => confirmDeleteReview(review.id)} 
                />
              ))}
            </div>
          ) : (
            <p className="text-[#1a1a1a] uppercase font-extrabold">
              No reviews yet. Be the first!
            </p>
          )}
        </div>

        {isAuthenticated && (
          <div className="mt-6">
            <ReviewForm onSubmit={handleAddReview} />
          </div>
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
  )
}
