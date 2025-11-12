import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { getUserByUsername, updateUser, deleteUser } from "../api" // Імпортуємо deleteUser
import { useAuth } from '../hooks/useAuth'
import MovieCard from "../components/MovieCard"

// Мокапи (без змін)
const likedMovies = [
  { id: 1, title: "Inception", year: 2010, director: "Christopher Nolan", actors: ["Leonardo DiCaprio"], imageUrl: "https://placehold.co/300x450/000000/FFFFFF?text=Inception"},
];
const userReviews = [
  { id: 1, movieId: 1, movieTitle: "Inception", rating: 5, text: "Чудовий фільм, 10/10!", title: "Неймовірно!", date: "2025-11-10" },
];

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin, isModerator, isLoading: isAuthLoading } = useAuth(); 

  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  
  // --- НОВИЙ СТАН ДЛЯ ФАЙЛУ ---
  const [avatarFile, setAvatarFile] = useState(null); // Стан для завантаженого файлу

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
    
    const fetchProfile = async () => {
      setIsLoading(true);
      let user;
      if (isMyProfile) {
        // Ми на /profile, беремо дані з useAuth (реальні з бекенду)
        user = currentUser;
      } else {
        // Ми на /user/@username, беремо мокап
        user = await getUserByUsername(targetUsername);
      }

      if (user) {
        setProfileUser(user);
        setEditData(user); // Готуємо дані для редагування
      } else {
        setProfileUser(null);
      }
      setIsLoading(false);
    };
    
    fetchProfile();

  }, [username, currentUser, isAuthLoading, navigate]);

  const isMe = currentUser?.id === profileUser?.id;
  const canEdit = isMe || 
                  (isAdmin && profileUser?.role !== 'admin') || 
                  (isModerator && !isAdmin && profileUser?.role === 'user');
  
  // --- НОВА ЛОГІКА ---
  // "Якщо я можу редагувати, я можу і видаляти" (але не себе)
  const canDelete = canEdit && !isMe;
  
  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };
  const handleRoleChange = (e) => {
    setEditData({ ...editData, role: e.target.value });
  };
  
  // --- НОВИЙ ОБРОБНИК ---
  // Обробник вибору файлу
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  // --- ОНОВЛЕНА ФУНКЦІЯ ---
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    let finalData = { ...editData };
    if (!isAdmin) {
      finalData.role = profileUser.role; 
    }

    // Викликаємо мокап API, передаючи дані форми ТА файл
    await updateUser(profileUser.id, finalData, avatarFile);
    
    // Оновлюємо локально (в реальному житті, ми б отримали відповідь з беку)
    setProfileUser(finalData); 
    setIsEditing(false);
    setAvatarFile(null); // Скидаємо файл
    alert("Профіль оновлено (імітація)!");
  };

  // --- НОВА ФУНКЦІЯ ---
  const handleDeleteProfile = async () => {
    if (window.confirm(`Ви впевнені, що хочете видалити ${profileUser.username}?`)) {
      await deleteUser(profileUser.id);
      alert('Користувача видалено (імітація)!');
      navigate('/admin/users'); // Повертаємось до списку
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-center pt-32 text-lg text-amber-400">Завантаження...</div>;
  }
  if (!profileUser) {
    return <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-center pt-32 text-lg text-red-500">Користувача не знайдено.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 pt-24 pb-8">
      <div className="max-w-4xl mx-auto p-4">
        
        {!isEditing ? (
          // --- Режим Перегляду ---
          <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 mb-8 border border-amber-500/20 backdrop-blur">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <img
                src={profileUser.profileImageUrl || `https://via.placeholder.com/150/007BFF/FFFFFF?text=${profileUser.username[1].toUpperCase()}`}
                alt={profileUser.nickname}
                className="w-32 h-32 rounded-full border-4 border-amber-500 object-cover shadow-lg"
              />
              <div className="text-center md:text-left flex-1">
                {/* ... (інформація про користувача) ... */}
                <h1 className="text-3xl font-bold ...">{profileUser.nickname}</h1>
                <p className="text-lg text-gray-300 ...">{profileUser.username}</p>
                <div className="... pt-3">
                  <p className="text-gray-400">Email: {profileUser.email}</p>
                  <p className="text-gray-400">Роль: {profileUser.role}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {/* Кнопка "Редагувати" */}
                {canEdit && (
                  <button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-2 rounded-lg transition-all font-medium border border-blue-400/30 w-full">
                    Редагувати
                  </button>
                )}
                {/* --- НОВА КНОПКА --- */}
                {canDelete && (
                  <button onClick={handleDeleteProfile} className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-2 rounded-lg transition-all font-medium border border-red-400/30 w-full">
                    Видалити
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          // --- Режим Редагування ---
          <form onSubmit={handleEditSubmit} className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 mb-8 border border-amber-500/20 backdrop-blur space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Редагування профілю</h2>
            
            <div>
              <label className="block text-amber-400 mb-2">Нікнейм</label>
              <input type="text" name="nickname" value={editData.nickname} onChange={handleEditChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
            </div>
            
            <div>
              <label className="block text-amber-400 mb-2">Email</label>
              <input type="email" name="email" value={editData.email} onChange={handleEditChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
            </div>
            
            {/* --- ОНОВЛЕНЕ ПОЛЕ --- */}
            <div>
              <label className="block text-amber-400 mb-2">Аватар (завантажити новий)</label>
              <input 
                type="file" 
                name="avatarFile" 
                onChange={handleFileChange} 
                accept="image/*"
                className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
              />
            </div>
            
            {/* Редагування ролі (тільки для Адміна) */}
            {isAdmin && !isMe && (
              <div>
                <label className="block text-amber-400 mb-2">Роль Користувача (Admin)</label>
                <select name="role" value={editData.role} onChange={handleRoleChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400">
                  <option value="user" className="bg-purple-900">user</option>
                  <option value="moderator" className="bg-purple-900">moderator</option>
                </select>
              </div>
            )}
            
            <div className="flex gap-4">
              <button type="submit" className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-6 py-3 rounded-lg">Зберегти</button>
              <button type="button" onClick={() => { setIsEditing(false); setAvatarFile(null); }} className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white px-6 py-3 rounded-lg">Скасувати</button>
            </div>
          </form>
        )}

        {/* Секції "Вподобані" та "Відгуки" (залишаємо мокапи) */}
        <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 mb-8 border border-amber-500/20 backdrop-blur">
          <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
            Вподобані фільми
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {likedMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur">
          <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
            Відгуки
          </h2>
          {userReviews.map(review => (
             <div key={review.id} className="border-b border-amber-500/20 pb-4 last:border-b-0">
                <h3 className="text-lg font-semibold text-white">
                  <Link to={`/movie/${review.movieId}`} className="hover:text-amber-400 transition-colors">
                    {review.movieTitle} - <span className="font-normal">{review.title}</span>
                  </Link>
                  <span className="ml-3 text-yellow-400">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </h3>
                <p className="text-gray-300 mt-2">{review.text}</p>
             </div>
          ))}
        </div>
      </div>
    </div>
  )
}