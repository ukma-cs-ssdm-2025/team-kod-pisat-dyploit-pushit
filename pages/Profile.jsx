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
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Avatar from '../components/Avatar';


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

  const [confirmModalConfig, setConfirmModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '' });


  const fetchProfileData = async (targetUsername, isMyProfile) => {
      try {
        const allMoviesData = await getAllMovies();
        const moviesList = allMoviesData.movies || allMoviesData;
        setAllMovies(moviesList);

        const allReviewsData = await getAllReviews();
        const reviewsList = allReviewsData.reviews || allReviewsData;

        let user;
        if (isMyProfile) {
          user = currentUser;
        } else {
          user = await getUserByUsername(targetUsername);
        }

        if (user) {
          setProfileUser(user);
          setEditData(user); 
          
          const reviews = reviewsList
            .filter(r => r.user_id === user.id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
          setUserReviews(reviews);

          const selectedIds = user.liked_movies || [];
          setSelectedMovies(moviesList.filter(m => selectedIds.includes(m.id)));

          if (isMyProfile) {
            try {
              const requests = await getIncomingFriendRequests(currentUser.id);
              setIncomingRequests(requests.incoming || []);
            } catch (err) {
              console.error("Error loading requests:", err);
            }
          }
        } else {
          setProfileUser(null);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
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
        setAlertConfig({ isOpen: true, title: "Success", message: "Friend request sent!" });
      } else if (action === 'remove') {
        await removeFriend(userParam);
        setAlertConfig({ isOpen: true, title: "Success", message: "Friend removed!" });
        fetchProfileData(username || currentUser.username, !username);
      } else if (action === 'accept') {
        await acceptFriendRequest(userParam);
        setAlertConfig({ isOpen: true, title: "Success", message: "Friend request accepted!" });
        setIncomingRequests(prev => prev.filter(req => req.requester_id !== parseInt(userParam)));
        fetchProfileData(username || currentUser.username, !username);
      }
    } catch (err) {
      setAlertConfig({ isOpen: true, title: "Error", message: `Error: ${err.message || 'Action failed'}` });
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
                  setUserReviews(prev => prev.filter(r => r.id !== reviewId));
              } catch (err) {
                  setAlertConfig({ isOpen: true, title: "Error", message: `Error deleting review: ${err.message}` });
              }
          }
      });
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
      
      setAlertConfig({ isOpen: true, title: "Success", message: "Profile updated!" });
      setIsEditing(false);
      setAvatarFile(null);
      setProfileUser({ ...profileUser, ...updatedUser.user });
      
      if (isMe) {
        window.location.reload();
      }

    } catch (err) {
      console.error("Update error:", err);
      setAlertConfig({ isOpen: true, title: "Error", message: `Error: ${err.message || 'Update failed'}` });
    }
  };

  const confirmDeleteProfile = () => {
    setConfirmModalConfig({
        isOpen: true,
        title: "Delete User?",
        message: `Are you sure you want to delete user "${profileUser.username}"?`,
        onConfirm: async () => {
            try {
                await deleteUser(profileUser.id);
                setAlertConfig({ isOpen: true, title: "Success", message: "User deleted!" });
                setTimeout(() => navigate('/users'), 1500);
            } catch (err) {
                setAlertConfig({ isOpen: true, title: "Error", message: `Error: ${err.message || 'Delete failed'}` });
            }
        }
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400 cursor-wait">Loading...</div>;
  }
  if (!profileUser) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-red-400">User not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-8 pb-8">
      <div className="max-w-6xl mx-auto p-4">
        
        {!isEditing ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">


              <Avatar src={profileUser.avatar_url} alt={profileUser.nickname} size="lg" className="border-4 border-blue-500" />

              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold text-white">{profileUser.nickname}</h1>
                <p className="text-lg text-gray-300 mb-2">{profileUser.username}</p>
                <div className="border-t border-gray-700 pt-3 mt-2">
                  <p className="text-gray-400">Email: {profileUser.email}</p>
                  <p className="text-gray-400 capitalize">Role: {profileUser.role}</p>
                  <p className="text-gray-400">Friends: {profileUser.friends?.length || 0}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {!isMe && friendStatus === 'not_friend' && (
                  <button 
                    onClick={() => handleFriendAction('add')}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition-colors cursor-pointer"
                  >
                    Add Friend
                  </button>
                )}

                {isMe && incomingRequests.length > 0 && (
                  <button 
                    onClick={() => setShowFriendRequests(!showFriendRequests)}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded transition-colors cursor-pointer"
                  >
                    Friend Requests ({incomingRequests.length})
                  </button>
                )}

                {canEdit && (
                  <button onClick={() => setIsEditing(true)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded border border-gray-600 transition-colors cursor-pointer">
                    Edit Profile
                  </button>
                )}
                
                {!isMe && friendStatus === 'friend' && (
                  <button 
                    onClick={() => handleFriendAction('remove')}
                    className="bg-red-900 hover:bg-red-800 text-red-200 px-4 py-2 rounded transition-colors cursor-pointer"
                  >
                    Unfriend
                  </button>
                )}

                {canDelete && (
                  <button onClick={confirmDeleteProfile} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors cursor-pointer">
                    Ban User
                  </button>
                )}
              </div>
            </div>

            {isMe && showFriendRequests && incomingRequests.length > 0 && (
              <div className="mt-6 border-t border-gray-700 pt-4">
                <h3 className="text-xl font-bold text-white mb-4">Incoming Friend Requests</h3>
                <div className="space-y-3">
                  {incomingRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg">
                      <div>
                        <Link to={`/user/${request.username}`} className="text-white font-semibold hover:underline cursor-pointer">
                          {request.nickname}
                        </Link>
                        <p className="text-gray-400 text-sm cursor-default">{request.username}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleFriendAction('accept', request.requester_id)}
                          className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleFriendAction('remove', request.requester_id)}
                          className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleEditSubmit} className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8 space-y-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Edit Profile</h2>
            <div>
              <label className="block text-blue-400 mb-2 font-medium cursor-default">Nickname</label>
              <input type="text" name="nickname" value={editData.nickname} onChange={handleEditChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"/>
            </div>
            <div>
              <label className="block text-blue-400 mb-2 font-medium cursor-default">Email</label>
              <input type="email" name="email" value={editData.email} onChange={handleEditChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"/>
            </div>
            {isMe && (
              <div>
                <label className="block text-blue-400 mb-2 font-medium cursor-default">Avatar (Upload new)</label>
                <input type="file" name="avatarFile" onChange={handleFileChange} accept="image/*" className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"/>
              </div>
            )}
            {(isAdmin || isModerator) && !isMe && (
              <div>
                <label className="block text-blue-400 mb-2 font-medium cursor-default">User Role (Admin/Mod)</label>
                <select name="role" value={editData.role} onChange={handleRoleChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none">
                  <option value="user" className="bg-gray-800">user</option>
                  <option value="moderator" className="bg-gray-800">moderator</option>
                  {isAdmin && profileUser.role !== 'admin' && (
                    <option value="admin" className="bg-gray-800">admin</option>
                  )}
                </select>
              </div>
            )}
            <div className="flex gap-4 pt-4">
              <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-medium cursor-pointer">Save Changes</button>
              <button type="button" onClick={() => { setIsEditing(false); setAvatarFile(null); }} className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-medium cursor-pointer">Cancel</button>
            </div>
          </form>
        )}

        {profileUser.friends && profileUser.friends.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-blue-500 pl-4">
              Friends ({profileUser.friends.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {profileUser.friends.map(friend => (
                <div key={friend.id} className="bg-gray-700/50 rounded-lg p-4 flex items-center gap-3">
                  <Avatar src={friend.avatar_url} alt={friend.nickname} size="md" />
                  <div className="flex-1">
                    <Link to={`/user/${friend.username}`} className="text-white font-semibold hover:underline block cursor-pointer">
                      {friend.nickname}
                    </Link>
                    <p className="text-gray-400 text-sm cursor-default">{friend.username}</p>
                  </div>
                  {isMe && (
                    <button 
                      onClick={() => handleFriendAction('remove', friend.id)}
                      className="text-red-400 hover:text-red-300 text-sm font-bold p-2 cursor-pointer"
                      title="Remove Friend"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-blue-500 pl-4">
            Favorite Movies
          </h2>
          {selectedMovies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {selectedMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic cursor-default">No favorite movies yet.</p>
          )}
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-blue-500 pl-4">
            Reviews
          </h2>
          {userReviews.length > 0 ? (
            <div className="space-y-6">
              {userReviews.map(review => {
                const movie = allMovies.find(m => m.id === review.movie_id);
                const reviewWithData = {
                  ...review,
                  movieTitle: movie?.title || "Unknown Movie",
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
                    onDelete={() => confirmDeleteReview(review.id)} 
                  />
                )
              })}
            </div>
          ) : (
            <p className="text-gray-400 italic cursor-default">No reviews yet.</p>
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