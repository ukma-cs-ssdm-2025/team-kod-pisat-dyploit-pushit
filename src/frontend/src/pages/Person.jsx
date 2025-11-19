import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom" 
import { 
  getPersonById, 
  updatePerson, 
  deletePerson,
  uploadPersonAvatar,
  getAllMovies
} from "../api" 
import { useAuth } from '../hooks/useAuth';
import MovieCard from '../components/MovieCard'; 
import MultiSelect from '../components/MultiSelect';

export default function Person() {
  const { id } = useParams()
  const navigate = useNavigate();
  const { isAdmin } = useAuth(); 

  const [person, setPerson] = useState(null)
  const [movies, setMovies] = useState([]) 
  const [allMoviesOptions, setAllMoviesOptions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null);

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      getPersonById(id),
      getAllMovies()
    ]).then(([personResponse, allMoviesList]) => {
        if (personResponse) {
          setPerson(personResponse);
          setMovies(personResponse.movies || []); 
          
          const options = allMoviesList.map(m => ({
             id: m.id,
             label: m.title
          }));
          setAllMoviesOptions(options);

          setEditData({ 
            first_name: personResponse.first_name || '',
            last_name: personResponse.last_name || '',
            profession: personResponse.profession || 'actor',
            biography: personResponse.biography || '',
            movie_ids: (personResponse.movies || []).map(p => p.id)
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

  const handleMoviesChange = (newSelectedIds) => {
    setEditData({ ...editData, movie_ids: newSelectedIds });
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
        movie_ids: editData.movie_ids,
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
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400">Завантаження...</div>
  }

  if (!person) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-red-400">На жаль, людину не знайдено.</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-8">
      <div className="max-w-5xl mx-auto p-4">
        
        {!isEditing ? (
          <div className="flex flex-col md:flex-row gap-8 card p-6 mb-8">
            <div className="md:w-1/3">
              <img 
                src={person.avatar_url || "https://placehold.co/300x450/374151/FFFFFF?text=No+Avatar"} 
                alt={`${person.first_name} ${person.last_name}`} 
                className="w-full h-auto object-cover rounded-xl shadow-lg border-2 border-gray-600" 
              />
            </div>
            <div className="md:w-2/3">
              <h1 className="text-4xl font-bold text-white mb-2">
                {person.first_name} {person.last_name}
              </h1>
              <p className="text-lg text-gray-300"><strong className="text-blue-400">Професія:</strong> {person.profession}</p>
              
              <div className="border-t border-gray-700 pt-4 mt-4 space-y-3">
                <h3 className="text-blue-400 text-xl font-semibold">Біографія</h3>
                <p className="text-gray-400 text-justify leading-relaxed mt-4">{person.biography || "Біографія відсутня."}</p>
              </div>
              <div className="mt-6 flex gap-4 flex-wrap">
                {isAdmin && (
                  <button onClick={() => setIsEditing(true)} className="btn-secondary">Редагувати</button>
                )}
                {isAdmin && (
                  <button onClick={handleDeletePerson} className="btn-danger">Видалити</button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEditSubmit} className="card p-6 mb-8 space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Редагування</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-blue-400 mb-2 font-medium">Ім'я</label>
                <input type="text" name="first_name" value={editData.first_name} onChange={handleEditChange} className="form-input"/>
              </div>
              <div>
                <label className="block text-blue-400 mb-2 font-medium">Прізвище</label>
                <input type="text" name="last_name" value={editData.last_name} onChange={handleEditChange} className="form-input"/>
              </div>
            </div>
            
            <div>
              <label className="block text-blue-400 mb-2 font-medium">Професія</label>
              <select name="profession" value={editData.profession} onChange={handleEditChange} className="form-input">
                  <option value="actor" className="bg-gray-800">Actor</option>
                  <option value="producer" className="bg-gray-800">Producer</option>
                  <option value="director" className="bg-gray-800">Director</option>
              </select>
            </div>

            <MultiSelect 
              label="Фільмографія"
              options={allMoviesOptions}
              selectedIds={editData.movie_ids}
              onChange={handleMoviesChange}
              placeholder="Пошук фільму..."
            />
            
            <div>
              <label className="block text-blue-400 mb-2 font-medium">Аватар (завантажити новий)</label>
              <input 
                type="file" 
                name="avatarFile" 
                onChange={handleFileChange} 
                accept="image/*"
                className="form-input file:bg-gray-700 file:text-white file:border-0 file:rounded file:px-4 file:py-2"
              />
            </div>
            <div>
              <label className="block text-blue-400 mb-2 font-medium">Біографія</label>
              <textarea name="biography" value={editData.biography} onChange={handleEditChange} rows="5" className="form-input"></textarea>
            </div>
            <div className="flex gap-4">
              <button type="submit" className="btn-primary">Зберегти</button>
              <button type="button" onClick={() => { setIsEditing(false); setAvatarFile(null); }} className="btn-secondary">Скасувати</button>
            </div>
          </form>
        )}

        <div className="card p-6">
          <h2 className="section-title">
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