import { useEffect, useState } from "react"
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
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Avatar from '../components/Avatar';
import TVAvatar from "../components/TVAvatar"; // якщо файл у src/components


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
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#1a1a1aff" }}
      >
        <div className="text-lg font-extrabold tracking-[0.18em] uppercase text-[#d6cecf] uppercase">
          Loading...
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        <div className="text-lg font-extrabold tracking-[0.18em] uppercase text-red-400 uppercase">
          User not found.
        </div>
      </div>
    );
  }

// РЕТУРН

  return (
    <div
      className="min-h-screen px-4 py-8 flex justify-center"
      style={{ backgroundColor: "#1a1a1a" }}
    >
      <div className="w-full max-w-6xl">

        {/* ВЕРХНІЙ БЛОК ПРОФІЛЮ */}
        {!isEditing ? (
          <div className="bg-[#606aa2] border-black rounded-[15px] p-6 mb-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              
              <TVAvatar
  src={profileUser.avatar_url}
  alt={profileUser.nickname}
/>
              <div className="text-center md:text-left flex-1">
                <h1
                  className="
                    text-2xl md:text-3xl
                    font-extrabold
                    text-[#d6cecf]
                    uppercase
                    tracking-[0.18em]
                    mb-2
                  "
                  style={{
                    letterSpacing: "0.12em",
                    wordSpacing: "0.12em",
                  }}
                >
                  {profileUser.nickname || profileUser.username}
                </h1>

                <p className="text-sm md:text-base text-black font-extrabold tracking-[0.12em] uppercase mb-3">
                  {profileUser.username}
                </p>

                <div className="border-t-[3px] border-black pt-3 mt-2 space-y-1">
                  <p className="text-sm md:text-sm text-[#d6cecf] uppercase font-semibold tracking-[0.06em]">
                    Email:{" "}
                    <span className="font-extrabold text-black">
                      {profileUser.email}
                    </span>
                  </p>
                  <p className="text-sm md:text-sm text-[#d6cecf] uppercase font-semibold tracking-[0.06em]">
                    Role:{" "}
                    <span className="font-extrabold text-black uppercase">
                      {profileUser.role}
                    </span>
                  </p>
                  <p className="text-sm md:text-sm text-[#d6cecf] uppercase font-semibold tracking-[0.06em]">
                    Friends:{" "}
                    <span className="font-extrabold text-black">
                      {profileUser.friends?.length || 0}
                    </span>
                  </p>
                </div>
              </div>

              {/* КНОПКИ ДІЙ */}
              <div className="flex flex-col gap-2 w-full md:w-auto">
                {!isMe && friendStatus === 'not_friend' && (
                  <button 
                    onClick={() => handleFriendAction('add')}
                    className="
                      bg-[#c9c7c7]
                      text-black
                      font-extrabold
                      text-xs md:text-sm
                      tracking-[0.14em]
                      uppercase
                      border-[3px] border-black
                      rounded-[12px]
                      px-4 py-2
                      hover:bg-[#e0dfdf]
                      transition-colors
                      cursor-pointer
                    "
                  >
                    Add Friend
                  </button>
                )}

                {isMe && incomingRequests.length > 0 && (
                  <button 
                    onClick={() => setShowFriendRequests(!showFriendRequests)}
                    className="
                      bg-[#c9c7c7]
                      text-black
                      font-extrabold
                      text-xs md:text-sm
                      tracking-[0.14em]
                      uppercase
                      border-[3px] border-black
                      rounded-[12px]
                      px-4 py-2
                      hover:bg-[#e0dfdf]
                      transition-colors
                      cursor-pointer
                    "
                  >
                    Friend Requests ({incomingRequests.length})
                  </button>
                )}

           {canEdit && (

  <button
    onClick={() => setIsEditing(true)}
    className="
      bg-black
      text-white
      font-extrabold
      text-xs md:text-sm
      tracking-[0.16em]
      uppercase
      border-[3px] border-black
      rounded-[12px]
      px-4 py-2
      transition-all duration-300
      cursor-pointer

      hover:bg-black
      hover:translate-x-[-4px]
      hover:translate-y-[-4px]
      hover:rounded-[12px]
      hover:shadow-[4px_4px_0px_white]

      active:translate-x-0
      active:translate-y-0
      active:shadow-none
      active:rounded-[12px]
    "
  >
    Edit Profile
  </button>

)}

                
                {!isMe && friendStatus === 'friend' && (
                  <button 
                    onClick={() => handleFriendAction('remove')}
                    className="
                      bg-[#2b2727]
                      text-[#d6cecf]
                      font-extrabold
                      text-xs md:text-sm
                      tracking-[0.16em]
                      uppercase
                      border-[3px] border-black
                      rounded-[12px]
                      px-4 py-2
                      hover:bg-black
                      transition-colors
                      cursor-pointer
                    "
                  >
                    Unfriend
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={confirmDeleteProfile}
                    className="
                      bg-[#c0392b]
                      text-[#d6cecf]
                      font-extrabold
                      text-xs md:text-sm
                      tracking-[0.16em]
                      uppercase
                      border-[3px] border-black
                      rounded-[12px]
                      px-4 py-2
                      hover:bg-[#e74c3c]
                      transition-colors
                      cursor-pointer
                    "
                  >
                    Ban User
                  </button>
                )}
              </div>
            </div>

            {/* Вхідні запити в друзі */}
            {isMe && showFriendRequests && incomingRequests.length > 0 && (
              <div className="mt-6 border-t-[3px] border-black pt-4">
                <h3 className="text-lg md:text-xl font-extrabold text-[#d6cecf] uppercase tracking-[0.16em] mb-4">
                  Incoming Friend Requests
                </h3>
                <div className="space-y-3">
                  {incomingRequests.map(request => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between bg-[#2b2727] border-[3px] border-black rounded-[12px] p-3"
                    >
                      <div>
                        <Link
                          to={`/user/${request.username}`}
                          className="text-[#d6cecf] font-extrabold hover:underline cursor-pointer"
                        >
                          {request.nickname}
                        </Link>
                        <p className="text-[#c9c7c7] text-xs cursor-default">
                          {request.username}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleFriendAction('accept', request.requester_id)}
                          className="
                            bg-[#c9c7c7]
                            text-black
                            font-extrabold
                            text-xs
                            tracking-[0.14em]
                            uppercase
                            border-[3px] border-black
                            rounded-[10px]
                            px-3 py-1
                            hover:bg-[#e0dfdf]
                            transition-colors
                            cursor-pointer
                          "
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleFriendAction('remove', request.requester_id)}
                          className="
                            bg-[#2b2727]
                            text-[#d6cecf]
                            font-extrabold
                            text-xs
                            tracking-[0.14em]
                            uppercase
                            border-[3px] border-black
                            rounded-[10px]
                            px-3 py-1
                            hover:bg-black
                            transition-colors
                            cursor-pointer
                          "
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
          /* ФОРМА РЕДАГУВАННЯ */
          <form
            onSubmit={handleEditSubmit}
            className="
              bg-[#606aa2]
              rounded-[15px]
              p-6 mb-8
              shadow-2xl
              space-y-4
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
              style={{
                letterSpacing: "0.12em",
              }}
            >
              Edit Profile
            </h2>

            <div>
              <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
                Nickname
              </label>
              <input
                type="text"
                name="nickname"
                value={editData.nickname}
                onChange={handleEditChange}
                className="
                  w-full
                  bg-[#1a1a1a]
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
                Email
              </label>
              <input
                type="email"
                name="email"
                value={editData.email}
                onChange={handleEditChange}
                className="
                  w-full
                  bg-[#1a1a1a]
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

            {isMe && (
              <div>
                <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
                  Avatar (Upload new)
                </label>
                <input
                  type="file"
                  name="avatarFile"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="
                    w-full
                    bg-[#1a1a1a]
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
            )}

            {(isAdmin || isModerator) && !isMe && (
              <div>
                <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
                  User Role (Admin/Mod)
                </label>
                <select
                  name="role"
                  value={editData.role}
                  onChange={handleRoleChange}
                  className="
                    w-full
                    bg-[#2b2727]
                    text-[#d6cecf]
                    border-[3px] border-black
                    rounded-[16px]
                    px-4 py-2
                    focus:outline-none
                    focus:border-[#d6cecf]
                    cursor-pointer
                    appearance-none
                  "
                >
                  <option value="user" className="bg-[#2b2727]">user</option>
                  <option value="moderator" className="bg-[#2b2727]">moderator</option>
                  {isAdmin && profileUser.role !== 'admin' && (
                    <option value="admin" className="bg-[#2b2727]">admin</option>
                  )}
                </select>
              </div>
            )}

            <div className="flex flex-wrap gap-4 pt-4">

            

<button
  type="submit"
  onClick={(e) => {
    const btn = e.currentTarget;

    // Анімація кліку (сильніше стискання)
    btn.style.transition = "transform 0.15s ease";
    btn.style.transform = "scale(0.85)";

    setTimeout(() => {
      btn.style.transform = "scale(1)";
    }, 150);
  }}
  className="
    bg-[#c9c7c7]
    text-black
    font-extrabold
    text-xs md:text-sm
    tracking-[0.18em]
    uppercase

    rounded-[14px]
    px-6 py-2

    hover:bg-[#deb70b]
    transition-colors
    cursor-pointer

    transition-transform
    hover:scale-[0.95]     /* легке стискання при наведенні */
  "
>
  Save Changes
</button>

<button
  type="button"
  onClick={(e) => {
    setIsEditing(false);
    setAvatarFile(null);

    const btn = e.currentTarget;

    // Анімація кліку (сильніше стискання)
    btn.style.transition = "transform 0.15s ease";
    btn.style.transform = "scale(0.85)";

    setTimeout(() => {
      btn.style.transform = "scale(1)";
    }, 150);
  }}
  className="
    bg-black
    text-[#d6cecf]
    font-extrabold
    text-xs md:text-sm
    tracking-[0.18em]
    uppercase

    rounded-[14px]
    px-6 py-2

    hover:bg-[#830707]
    transition-colors
    cursor-pointer

    transition-transform
    hover:scale-[0.95]     /* легке стискання при наведенні */
  "
>
  Cancel
</button>



            </div>
          </form>
        )}

        {/* ДРУЗІ */}
        {profileUser.friends && profileUser.friends.length > 0 && (
          <div className="bg-[#606aa2] rounded-[15px] p-6 mb-8 shadow-2xl">
            <h2 className="text-2xl font-extrabold text-[#d6cecf] mb-6 uppercase tracking-[0.16em]">
              Friends ({profileUser.friends.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {profileUser.friends.map(friend => (

                <div
                  key={friend.id}
                  className="bg-[#1a1a1a] border-[4px] border-black rounded-[12px] p-4 flex items-center gap-3"
                >
                  <Avatar src={friend.avatar_url} alt={friend.nickname} size="md" />
                  <div className="flex-1">
                    <Link
                      to={`/user/${friend.username}`}
                      className="text-[#d6cecf] font-extrabold hover:underline block cursor-pointer"
                    >
                      {friend.nickname}
                    </Link>
                    <p className="text-[#c9c7c7] text-xs cursor-default">
                      {friend.username}
                    </p>
                  </div>
                  
                  {isMe && (
                    <button 
                      onClick={() => handleFriendAction('remove', friend.id)}
                      className="text-[#830707] hover:text-[#900909] text-sm font-bold p-2 cursor-pointer"
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

        {/* УЛЮБЛЕНІ ФІЛЬМИ */}
        <div className="bg-[#606aa2]  border-black rounded-[15px] p-6 mb-8 shadow-2xl">
          <h2 className="text-2xl font-extrabold text-[#d6cecf] mb-6 uppercase tracking-[0.16em]">
            Favorite Movies
          </h2>
          {selectedMovies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {selectedMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="text-[#1a1a1a] uppercase font-extrabold">
              No favorite movies yet
            </p>
          )}
        </div>
        
        {/* РЕВʼЮ */}
        <div className="bg-[#606aa2] border-black rounded-[15px] p-6 shadow-2xl">
          <h2 className="text-2xl font-extrabold text-[#d6cecf] mb-6 uppercase tracking-[0.16em]">
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
            <p className="text-[#1a1a1a] uppercase font-extrabold">
              No reviews yet
            </p>
          )}
        </div>

      </div>

  {/* POPCORN DECORATION */}
      <img
        src="/pictures_elements/popcorn_gray.png"
        className="popcorn fixed right-6 bottom-6 w-[70px] z-20"
        alt="Popcorn"

        onClick={(e) => {
         e.target.classList.remove("active");      // скинути попередню анімацію
         void e.target.offsetWidth;                // магічний трюк для рестарту
         e.target.classList.add("active");         // увімкнути знову
       }}
      />

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
