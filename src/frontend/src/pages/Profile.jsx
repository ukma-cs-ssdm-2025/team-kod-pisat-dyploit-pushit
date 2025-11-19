import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { 
  getUserByUsername, 
  updateUser, 
  deleteUser, 
  uploadAvatar,
  getAllMovies,   
  getAllReviews,
  deleteReview 
} from "../api" 
import { useAuth } from '../hooks/useAuth'
import MovieCard from "../components/MovieCard"
import ReviewCard from "../components/ReviewCard"  

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin, isModerator, isLoading: isAuthLoading } = useAuth(); 

  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [likedMovies, setLikedMovies] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [allMovies, setAllMovies] = useState([]);  

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

          const likedIds = user.liked_movies || [];
          setLikedMovies(allMoviesData.filter(m => likedIds.includes(m.id)));
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
        navigate('/admin/users'); 
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
      <div className="max-w-4xl mx-auto p-4">
        
        {!isEditing ? (
          <div className="card p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <img
                src={profileUser.avatar_url || `https://via.placeholder.com/150/374151/FFFFFF?text=${profileUser.username[1].toUpperCase()}`}
                alt={profileUser.nickname}
                className="w-32 h-32 rounded-full border-4 border-blue-500 object-cover shadow-lg"
              />
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold text-white">{profileUser.nickname}</h1>
                <p className="text-lg text-gray-300 mb-2">{profileUser.username}</p>
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-gray-400">Email: {profileUser.email}</p>
                  <p className="text-gray-400">Роль: {profileUser.role}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {canEdit && (
                  <button onClick={() => setIsEditing(true)} className="btn-secondary">
                    Редагувати
                  </button>
                )}
                {canDelete && (
                  <button onClick={handleDeleteProfile} className="btn-danger">
                    Видалити
                  </button>
                )}
              </div>
            </div>
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

        <div className="card p-6 mb-8">
          <h2 className="section-title">
            Вподобані фільми
          </h2>
          {likedMovies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {likedMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Список вподобань порожній.</p>
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

      </div>
    </div>
  )
}