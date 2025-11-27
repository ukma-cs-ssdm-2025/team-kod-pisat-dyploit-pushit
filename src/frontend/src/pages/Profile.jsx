import { useEffect, useState, useContext } from "react";
import { WatchedContext } from "../context/WatchedContext";
import { useParams, Link, useNavigate } from "react-router-dom"
import { 
  getUserByUsername, 
  updateUser, 
  deleteUser, 
  uploadAvatar,
  getAllMovies,   
  getAllReviews,
  deleteReview,
  sendFriendRequest,
  removeFriend,
  acceptFriendRequest,
  getIncomingFriendRequests
} from "../api" 
import { useAuth } from '../hooks/useAuth'
import MovieCard from "../components/MovieCard"
import ReviewCard from "../components/ReviewCard"  
import { LikesContext } from "../context/LikesContext";

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin, isModerator, isLoading: isAuthLoading } = useAuth(); 

  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);

  const [selectedMovies, setSelectedMovies] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [allMovies, setAllMovies] = useState([]);  

  const [reviews, setReviews] = useState(0);
  const { likedMovies } = useContext(LikesContext);
  const liked_movies = likedMovies.length;

  const [following, setFollowing] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [watching_movies, setWhatchingMovies] = useState(0);
  const [recentMovies, setRecentMovies] = useState([]);

  const [showLikedMovies, setShowLikedMovies] = useState(false);
  const { watchedMovies } = useContext(WatchedContext);
 
  const [showWatchedMovies, setShowWatchedMovies] = useState(false);


  const [showFollowing, setShowFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);

  const fetchProfileData = async (targetUsername, isMyProfile) => {
      try {
        const allMoviesData = await getAllMovies();
        setAllMovies(allMoviesData);

        const allReviewsData = await getAllReviews();

        let user;
        if (isMyProfile) {
          user = currentUser;
        } else {
          user = await getUserByUsername(targetUsername);
        }

        if (user) {
          setProfileUser(user);
          setEditData(user); 
          
          const reviews = allReviewsData
            .filter(r => r.user_id === user.id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
          setUserReviews(reviews);

          const selectedIds = user.liked_movies || [];
          setSelectedMovies(allMoviesData.filter(m => selectedIds.includes(m.id)));

          if (isMyProfile) {
            try {
              const requests = await getIncomingFriendRequests(currentUser.id);
              setIncomingRequests(requests.incoming || []);
            } catch (err) {
              console.error("Помилка завантаження запитів:", err);
            }
          }
        } else {
          setProfileUser(null);
        }
      } catch (err) {
        console.error("Помилка завантаження профілю:", err);
        setProfileUser(null);
      }
      setIsLoading(false);
  };

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }
    
    const isMyProfile = !username; 
    const targetUsername = isMyProfile ? currentUser?.username : username;

    if (!targetUsername) {
      if (!currentUser) navigate('/login');
      return;
    }
    
    if ((isMyProfile && currentUser) || !isMyProfile) {
      fetchProfileData(targetUsername, isMyProfile);
    }

  }, [username, currentUser, isAuthLoading, navigate]);  

  const handleFriendAction = async (action, userParam = null) => {
    if (!userParam && profileUser) {
      userParam = profileUser.id;
    }

    try {
      if (action === 'add') {
        await sendFriendRequest(userParam);
        alert('Запит на дружбу надіслано!');
      } else if (action === 'remove') {
        await removeFriend(userParam);
        alert('Дружбу видалено!');
        fetchProfileData(username || currentUser.username, !username);
      } else if (action === 'accept') {
        await acceptFriendRequest(userParam);
        alert('Запит на дружбу прийнято!');
        setIncomingRequests(prev => prev.filter(req => req.requester_id !== parseInt(userParam)));
        fetchProfileData(username || currentUser.username, !username);
      }
    } catch (err) {
      alert(`Помилка: ${err.message || 'Не вдалося виконати дію'}`);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Ви впевнені, що хочете видалити цей відгук?")) {
      try {
        await deleteReview(reviewId);
        setUserReviews(prev => prev.filter(r => r.id !== reviewId));
        alert("Відгук видалено");
      } catch (err) {
        alert(`Помилка видалення відгуку: ${err.message}`);
      }
    }
  };

  const isMe = currentUser?.id === profileUser?.id;
  const canEdit = isMe || 
                  (isAdmin && profileUser?.role !== 'admin') || 
                  (isModerator && !isAdmin && profileUser?.role === 'user');
  
  const canDelete = canEdit && !isMe;

  const getFriendStatus = () => {
    if (!currentUser || !profileUser || isMe) return 'self';
    
    if (currentUser.friends && currentUser.friends.some(friend => friend.id === profileUser.id)) {
      return 'friend';
    }
    
    return 'not_friend';
  };

  const friendStatus = getFriendStatus();
  
  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };
  const handleRoleChange = (e) => {
    setEditData({ ...editData, role: e.target.value });
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    let finalData = { 
      nickname: editData.nickname,
      email: editData.email,
      role: editData.role
    };

    if (!isAdmin && !isModerator) {
      finalData.role = profileUser.role; 
    }
    if (isModerator && profileUser.role === 'admin') {
      finalData.role = profileUser.role;
    }

    try {
      const updatedUser = await updateUser(profileUser.id, finalData);
      
      if (avatarFile && isMe) {
        await uploadAvatar(avatarFile);
      }
      
      alert("Профіль оновлено!");
      setIsEditing(false);
      setAvatarFile(null);
      setProfileUser({ ...profileUser, ...updatedUser.user });
      
      if (isMe) {
        window.location.reload();
      }

    } catch (err) {
      console.error("Помилка оновлення:", err);
      alert(`Помилка: ${err.message || 'Не вдалося оновити'}`);
    }
  };

  const handleDeleteProfile = async () => {
    if (window.confirm(`Ви впевнені, що хочете видалити ${profileUser.username}?`)) {
      try {
        await deleteUser(profileUser.id);
        alert('Користувача видалено!');
        navigate('/users'); 
      } catch (err) {
        alert(`Помилка: ${err.message || 'Не вдалося видалити'}`);
      }
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400">Завантаження...</div>;
  }
  if (!profileUser) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-red-400">Користувача не знайдено.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-8">
      <div className="max-w-6xl mx-auto p-4">
        
        {!isEditing ? (
          <div className="card p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <img
                src={
                profileUser.avatar_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser.nickname || profileUser.username)}&size=150&background=E5E7EB&color=1F2937&bold=true`
                }
                alt={profileUser.nickname}
                className="w-32 h-32 rounded-full border-4 border-blue-600 object-cover shadow-lg"
                />
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold text-white">{profileUser.nickname}</h1>
                <p className="text-lg text-gray-300 mb-2">{profileUser.username}</p>
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-gray-400">Email: {profileUser.email}</p>
                  <p className="text-gray-400">Роль: {profileUser.role}</p>
                  <p className="text-gray-400">Друзі: {profileUser.friends?.length || 0}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {!isMe && friendStatus === 'not_friend' && (
                  <button 
                    onClick={() => handleFriendAction('add')}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition-colors"
                  >
                    Додати в друзі
                  </button>
                )}

                {isMe && incomingRequests.length > 0 && (
                  <button 
                    onClick={() => setShowFriendRequests(!showFriendRequests)}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded transition-colors"
                  >
                    Запити ({incomingRequests.length})
                  </button>
                )}

                {canEdit && (
                  <button onClick={() => setIsEditing(true)} className="btn-secondary">
                    Редагувати
                  </button>
                )}
                
                {!isMe && friendStatus === 'friend' && (
                  <button 
                    onClick={() => handleFriendAction('remove')}
                    className="btn-danger"
                  >
                    Видалити з друзів
                  </button>
                )}

                {canDelete && (
                  <button onClick={handleDeleteProfile} className="btn-danger">
                    Видалити (забанити)
                  </button>
                )}
              </div>
            </div>

            {isMe && showFriendRequests && incomingRequests.length > 0 && (
              <div className="mt-6 border-t border-gray-700 pt-4">
                <h3 className="text-xl font-bold text-white mb-4">Вхідні запити на дружбу</h3>
                <div className="space-y-3">
                  {incomingRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg">
                      <div>
                        <Link to={`/user/${request.username}`} className="text-white font-semibold hover:underline">
                          {request.nickname}
                        </Link>
                        <p className="text-gray-400 text-sm">{request.username}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleFriendAction('accept', request.requester_id)}
                          className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Прийняти
                        </button>
                        <button 
                          onClick={() => handleFriendAction('remove', request.requester_id)}
                          className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Відхилити
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleEditSubmit} className="card p-6 mb-8 space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Редагування профілю</h2>
            <div>
              <label className="block text-blue-400 mb-2 font-medium">Нікнейм</label>
              <input type="text" name="nickname" value={editData.nickname} onChange={handleEditChange} className="form-input"/>
            </div>
            <div>
              <label className="block text-blue-400 mb-2 font-medium">Email</label>
              <input type="email" name="email" value={editData.email} onChange={handleEditChange} className="form-input"/>
            </div>
            {isMe && (
              <div>
                <label className="block text-blue-400 mb-2 font-medium">Аватар (завантажити новий)</label>
                <input type="file" name="avatarFile" onChange={handleFileChange} accept="image/*" className="form-input file:bg-gray-700 file:text-white file:border-0 file:rounded file:px-4 file:py-2"/>
              </div>
            )}
            {(isAdmin || isModerator) && !isMe && (
              <div>
                <label className="block text-blue-400 mb-2 font-medium">Роль Користувача (Admin/Mod)</label>
                <select name="role" value={editData.role} onChange={handleRoleChange} className="form-input">
                  <option value="user" className="bg-gray-800">user</option>
                  <option value="moderator" className="bg-gray-800">moderator</option>
                  {isAdmin && profileUser.role !== 'admin' && (
                    <option value="admin" className="bg-gray-800">admin</option>
                  )}
                </select>
              </div>
            )}
            <div className="flex gap-4">
              <button type="submit" className="btn-primary">Зберегти</button>
              <button type="button" onClick={() => { setIsEditing(false); setAvatarFile(null); }} className="btn-secondary">Скасувати</button>
            </div>
          </form>
        )}

        {profileUser.friends && profileUser.friends.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="section-title">
              Друзі ({profileUser.friends.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {profileUser.friends.map(friend => (
                <div key={friend.id} className="bg-gray-700/50 rounded-lg p-4 flex items-center gap-3">
                  <img
                    src={friend.avatar_url || `https://via.placeholder.com/40/374151/FFFFFF?text=${friend.username[1].toUpperCase()}`}
                    alt={" "}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <Link to={`/user/${friend.username}`} className="text-white font-semibold hover:underline block">
                      {friend.nickname}
                    </Link>
                    <p className="text-gray-400 text-sm">{friend.username}</p>
                  </div>
                  {isMe && (
                    <button 
                      onClick={() => handleFriendAction('remove', friend.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                      title="Видалити з друзів"
                    >
                      X
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-6 mb-8">
          <h2 className="section-title">
            Обрані фільми
          </h2>
          {selectedMovies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {selectedMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Список обраних фільмів порожній.</p>
          )}
        </div>
        
        <div className="card p-6">
          <h2 className="section-title">
            Відгуки
          </h2>
          {userReviews.length > 0 ? (
            <div className="space-y-6">
              {userReviews.map(review => {
                const movie = allMovies.find(m => m.id === review.movie_id);
                const reviewWithData = {
                  ...review,
                  movieTitle: movie?.title || "Видалений фільм",
                  user: { 
                    id: profileUser.id,
                    nickname: profileUser.nickname, 
                    username: profileUser.username 
                  },
                  text: review.body,  
                  date: review.created_at
                };

                return (
                  <ReviewCard 
                    key={review.id} 
                    review={reviewWithData}
                    onDelete={handleDeleteReview} 
                  />
                )
              })}
            </div>
          ) : (
            <p className="text-gray-400">Користувач ще не залишив відгуків.</p>
          )}
        </div>
<div className="card p-6 mb-8 mt-8">
  <h2 className="section-title">Нещодавно переглянуті ({watchedMovies.length})</h2>

  {watchedMovies.length > 0 ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {watchedMovies.map(watchedItem => {
        const movieId = watchedItem.id || watchedItem;
        const movie = allMovies.find(m => m.id === movieId);
        
        if (!movie) return null;

        return (
          <Link
            to={`/movie/${movie.id}`}
            key={movie.id}
            className="rounded-xl overflow-hidden shadow-lg bg-gray-800/50 backdrop-blur-sm hover:scale-105 transition-transform duration-300 block"
          >
            <img 
              src={movie.cover_url || movie.poster_url || "https://placehold.co/300x450"}
              alt={movie.title}
              className="w-full h-64 object-cover"
            />
          </Link>
        );
      })}
    </div>
  ) : (
    <p className="text-gray-400">Останнім часом ви нічого не переглянули.</p>
  )}
</div>

      </div>

<div className="border-t border-gray-700 flex justify-center pt-4">
  <div className="flex justify-center w-full max-w-[calc(100vw-100px)]">
    <button 
      onClick={() => setShowLikedMovies(prev => !prev)}
      className="bg-gray-800/70 hover:bg-gray-700/70 px-6 py-3 rounded-lg shadow
                 flex justify-between items-center gap-6 text-left w-full"
    >
      <p className="text-blue-400 font-semibold">Вподобайки</p>
      <p className="text-white font-bold">{liked_movies}</p>
    </button>
  </div>
</div>
{showLikedMovies && (
  <div className="mt-6 flex justify-center">
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 
                    w-full max-w-[calc(100vw-100px)]">
      
      {likedMovies.length > 0 ? (
        likedMovies.map(id => {
          const movie = allMovies.find(m => m.id === id);
          if (!movie) return null;

          return (
            <div 
              key={movie.id}
              className="rounded-xl overflow-hidden shadow-lg bg-gray-800/50
                         backdrop-blur-sm hover:scale-105 transition-transform"
            >
              <Link to={`/movie/${movie.id}`}>
                <img 
                  src={movie.cover_url}
                  alt={movie.title}
                  className="w-full h-64 object-cover"
                />
              </Link>
            </div>
          );
        })
      ) : (
        <p className="text-gray-400">Немає вподобаних фільмів.</p>
      )}

    </div>
  </div>
)}



<div className="mt-8 pt-4 flex justify-center">
  <div className="border-t border-gray-700 flex justify-center pt-4 
                  w-full max-w-[calc(100vw-100px)]">
    <button 
      onClick={() => setShowFollowing(prev => !prev)}
      className="bg-gray-800/70 hover:bg-gray-700/70 px-6 py-3 rounded-lg shadow
                 flex justify-between items-center gap-6 text-left 
                 w-full"
    >
      <p className="text-blue-400 font-semibold">Підписки</p>
      <p className="text-white font-bold">{following}</p>
    </button>
  </div>
</div>

{showFollowing && (
  <div className="mt-6 flex justify-center">
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 
                    w-full max-w-[calc(100vw-100px)]">
      
      {following > 0 ? (
        <p className="text-gray-400 col-span-full text-center">
          Функція підписок буде додана пізніше
        </p>
      ) : (
        <p className="text-gray-400 col-span-full text-center">
          Немає підписок
        </p>
      )}

    </div>
  </div>
)}

<div className="mt-8 pt-4 flex justify-center">
  <div className="border-t border-gray-700 flex justify-center pt-4 
                  w-full max-w-[calc(100vw-100px)]">
    <button 
      onClick={() => setShowFollowers(prev => !prev)}
      className="bg-gray-800/70 hover:bg-gray-700/70 px-6 py-3 rounded-lg shadow
                 flex justify-between items-center gap-6 text-left 
                 w-full"
    >
      <p className="text-blue-400 font-semibold">Підписники</p>
      <p className="text-white font-bold">{followers}</p>
    </button>
  </div>
</div>

{showFollowers && (
  <div className="mt-6 flex justify-center">
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 
                    w-full max-w-[calc(100vw-100px)]">
      
      {followers > 0 ? (
        <p className="text-gray-400 col-span-full text-center">
          Функція підписників буде додана пізніше
        </p>
      ) : (
        <p className="text-gray-400 col-span-full text-center">
          Немає підписників
        </p>
      )}

    </div>
  </div>
)}


<div className="mt-8 pt-4 flex justify-center">
  <div className="border-t border-gray-700 flex justify-center pt-4 
                  w-full max-w-[calc(100vw-100px)]">
    <button 
      onClick={() => setShowWatchedMovies(prev => !prev)}
      className="bg-gray-800/70 hover:bg-gray-700/70 px-6 py-3 rounded-lg shadow
                 flex justify-between items-center gap-6 text-left 
                 w-full"
    >
      <p className="text-blue-400 font-semibold">Переглянуті фільми</p>
      <p className="text-white font-bold">{watchedMovies.length}</p>
    </button>
  </div>
</div>


{showWatchedMovies && (
  <div className="mt-6 flex justify-center">
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 
                    w-full max-w-[calc(100vw-100px)]">
      
      {watchedMovies.length > 0 ? (
        watchedMovies.map(watchedItem => {
          const movieId = watchedItem.id || watchedItem;
          const movie = allMovies.find(m => m.id === movieId);
          
          if (!movie) return null;

          return (
            <div 
              key={movie.id}
              className="rounded-xl overflow-hidden shadow-lg bg-gray-800/50
                         backdrop-blur-sm hover:scale-105 transition-transform"
            >
              <Link to={`/movie/${movie.id}`}>
                <img 
                  src={movie.cover_url || movie.poster_url || "https://placehold.co/300x450"}
                  alt={movie.title}
                  className="w-full h-64 object-cover"
                />
              </Link>
            </div>
          );
        })
      ) : (
        <p className="text-gray-400">Немає переглянутих фільмів.</p>
      )}

    </div>
  </div>
)}
    </div>
  )
}