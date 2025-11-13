import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom" 
import { 
  getPersonById, 
  updatePerson, 
  deletePerson,
  uploadPersonAvatar
} from "../api" 
import { useAuth } from '../hooks/useAuth';
import MovieCard from '../components/MovieCard'; 

export default function Person() {
  const { id } = useParams()
  const navigate = useNavigate();
  const { isAdmin } 
  = useAuth(); 

  const [person, setPerson] = useState(null)
  const [movies, setMovies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null);

  const fetchData = () => {
    setIsLoading(true);
    getPersonById(id)
      .then((personResponse) => {
        if (personResponse) {
          setPerson(personResponse);
          setMovies(personResponse.movies || []);
          
          setEditData({ 
            first_name: personResponse.first_name || '',
            last_name: personResponse.last_name || '',
            profession: personResponse.profession || 'actor',
            biography: personResponse.biography || '',
            movie_ids: (personResponse.movies || []).map(p => p.id).join(', ')
          });
        } else {
          setPerson(null);
        }
      })
      .catch(err => {
        console.error("Помилка завантаження даних:", err);
        setPerson(null); 
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const personData = {
        ...editData,
        movie_ids: editData.movie_ids.split(',').map(id => parseInt(id.trim())).filter(Boolean),
      };
      await updatePerson(id, personData);
      
      if (avatarFile) {
        await uploadPersonAvatar(id, avatarFile);
      }

      alert('Дані оновлено!');
      setIsEditing(false);
      setAvatarFile(null);
      fetchData();

    } catch (err) {
      console.error("Помилка оновлення:", err);
      alert(`Помилка: ${err.message || 'Не вдалося оновити'}`);
    }
  };

  const handleDeletePerson = async () => {
    if (window.confirm(`Ви впевнені, що хочете видалити ${person.first_name} ${person.last_name}?`)) {
      try {
        await deletePerson(id);
        alert('Людину видалено!');
        navigate('/admin/people');
      } catch (err) {
        alert(`Помилка: ${err.message || 'Не вдалося видалити'}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-center pt-32 text-lg text-amber-400">
        Завантаження...
      </div>
    )
  }

  if (!person) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-center pt-32 text-lg text-red-500">
            На жаль, людину не знайдено.
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 pt-24 pb-8">
      <div className="max-w-5xl mx-auto p-4">
        
        {!isEditing ? (
          <div className="flex flex-col md:flex-row gap-8 bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur mb-8">
            <div className="md:w-1/3">
              <img 
                src={person.avatar_url || "https://placehold.co/300x450/666/FFFFFF?text=No+Avatar"} 
                alt={`${person.first_name} ${person.last_name}`} 
                className="w-full h-auto object-cover rounded-xl shadow-lg border-2 border-amber-500/30" 
              />
            </div>
            <div className="md:w-2/3">
              <h1 className="text-4xl font-bold text-white mb-2">
                {person.first_name} {person.last_name}
              </h1>
              <p className="text-lg text-gray-300"><strong className="text-amber-400">Професія:</strong> {person.profession}</p>
              
              <div className="border-t border-amber-500/20 pt-4 mt-4 space-y-3">
                <h3 className="text-amber-400 text-xl font-semibold">Біографія</h3>
                <p className="text-gray-400 text-justify leading-relaxed mt-4">{person.biography || "Біографія відсутня."}</p>
              </div>
              <div className="mt-6 flex gap-4 flex-wrap">
                {isAdmin && (
                  <button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-3 rounded-lg transition-all font-medium border border-blue-400/30">Редагувати</button>
                )}
                {isAdmin && (
                  <button onClick={handleDeletePerson} className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-lg transition-all font-medium border border-red-400/30">Видалити</button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEditSubmit} className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur mb-8 space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Редагування</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-amber-400 mb-2">Ім'я</label>
                <input type="text" name="first_name" value={editData.first_name} onChange={handleEditChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
              </div>
              <div>
                <label className="block text-amber-400 mb-2">Прізвище</label>
                <input type="text" name="last_name" value={editData.last_name} onChange={handleEditChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
              </div>
            </div>
            
            <div>
              <label className="block text-amber-400 mb-2">Професія</label>
              <select name="profession" value={editData.profession} onChange={handleEditChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400">
                  <option value="actor" className="bg-purple-900">Actor</option>
                  <option value="producer" className="bg-purple-900">Producer</option>
                  <option value="director" className="bg-purple-900">Director</option>
              </select>
            </div>

            <div>
              <label className="block text-amber-400 mb-2">ID Фільмів (через кому)</label>
              <input type="text" name="movie_ids" value={editData.movie_ids} onChange={handleEditChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
            </div>
            
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
            <div>
              <label className="block text-amber-400 mb-2">Біографія</label>
              <textarea name="biography" value={editData.biography} onChange={handleEditChange} rows="5" className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"></textarea>
            </div>
            <div className="flex gap-4">
              <button type="submit" className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-6 py-3 rounded-lg">Зберегти</button>
              <button type="button" onClick={() => { setIsEditing(false); setAvatarFile(null); }} className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white px-6 py-3 rounded-lg">Скасувати</button>
            </div>
          </form>
        )}

        <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur">
          <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
            Фільмографія
          </h2>
          {movies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Фільмів не знайдено.</p>
          )}
        </div>
      </div>
    </div>
  )
}