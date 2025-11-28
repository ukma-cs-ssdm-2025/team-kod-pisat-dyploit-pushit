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
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Avatar from '../components/Avatar';

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

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '' });

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      getPersonById(id),
      getAllMovies()
    ]).then(([personResponse, allMoviesData]) => {
        if (personResponse) {
          setPerson(personResponse);
          setMovies(personResponse.movies || []); 
          
          const moviesList = allMoviesData.movies || allMoviesData;
          const options = moviesList.map(m => ({
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
        console.error("Error loading data:", err);
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

      setAlertConfig({ isOpen: true, title: "Success", message: "Data updated successfully!" });
      setIsEditing(false);
      setAvatarFile(null);
      fetchData(); 

    } catch (err) {
      console.error("Update error:", err);
      setAlertConfig({ isOpen: true, title: "Error", message: `Error: ${err.message || 'Update failed'}` });
    }
  };

  const confirmDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeletePerson = async () => {
    try {
      await deletePerson(id);
      setAlertConfig({ isOpen: true, title: "Success", message: "Person deleted!" });
      setTimeout(() => navigate('/people'), 1500);
    } catch (err) {
      setAlertConfig({ isOpen: true, title: "Error", message: `Error: ${err.message || 'Delete failed'}` });
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400 cursor-wait">Loading...</div>
  }

  if (!person) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-red-400">Person not found.</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-8 pb-8">
      <div className="max-w-5xl mx-auto p-4">
        
        {!isEditing ? (
          <div className="flex flex-col md:flex-row gap-8 bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8 shadow-2xl">
            <div className="md:w-1/3">
              <Avatar 
                src={person.avatar_url} 
                alt={`${person.first_name} ${person.last_name}`} 
                size="xl" 
                className="w-full h-auto rounded-xl shadow-lg border-2 border-gray-600 aspect-[3/4]" 
              />
            </div>
            <div className="md:w-2/3">
              <h1 className="text-4xl font-bold text-white mb-2 border-b border-gray-700 pb-2">
                {person.first_name} {person.last_name}
              </h1>
              <p className="text-lg text-gray-300 mb-6"><strong className="text-blue-400 font-semibold">Profession:</strong> <span className="capitalize">{person.profession}</span></p>
              
              <div className="space-y-4">
                <h3 className="text-blue-400 text-xl font-semibold">Biography</h3>
                <p className="text-gray-400 text-justify leading-relaxed">{person.biography || "No biography available."}</p>
              </div>
              <div className="mt-8 flex gap-4 flex-wrap">
                {isAdmin && (
                  <button onClick={() => setIsEditing(true)} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg transition-colors cursor-pointer">Edit Person</button>
                )}
                {isAdmin && (
                  <button onClick={confirmDelete} className="bg-red-900 hover:bg-red-800 text-red-100 px-6 py-2 rounded-lg font-medium shadow-lg transition-colors cursor-pointer">Delete Person</button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEditSubmit} className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8 space-y-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Edit Person</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-blue-400 mb-2 font-medium cursor-default">First Name</label>
                <input type="text" name="first_name" value={editData.first_name} onChange={handleEditChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"/>
              </div>
              <div>
                <label className="block text-blue-400 mb-2 font-medium cursor-default">Last Name</label>
                <input type="text" name="last_name" value={editData.last_name} onChange={handleEditChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"/>
              </div>
            </div>
            
            <div>
              <label className="block text-blue-400 mb-2 font-medium cursor-default">Profession</label>
              <select name="profession" value={editData.profession} onChange={handleEditChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none">
                  <option value="actor" className="bg-gray-800">Actor</option>
                  <option value="producer" className="bg-gray-800">Producer</option>
                  <option value="director" className="bg-gray-800">Director</option>
              </select>
            </div>

            <MultiSelect 
              label="Filmography"
              options={allMoviesOptions}
              selectedIds={editData.movie_ids}
              onChange={handleMoviesChange}
              placeholder="Search movie..."
            />
            
            <div>
              <label className="block text-blue-400 mb-2 font-medium cursor-default">Avatar (Upload new)</label>
              <input 
                type="file" 
                name="avatarFile" 
                onChange={handleFileChange} 
                accept="image/*"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
              />
            </div>
            <div>
              <label className="block text-blue-400 mb-2 font-medium cursor-default">Biography</label>
              <textarea name="biography" value={editData.biography} onChange={handleEditChange} rows="5" className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"></textarea>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-medium cursor-pointer">Save Changes</button>
              <button type="button" onClick={() => { setIsEditing(false); setAvatarFile(null); }} className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-medium cursor-pointer">Cancel</button>
            </div>
          </form>
        )}

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-blue-500 pl-4">
            Filmography
          </h2>
          {movies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic cursor-default">No movies found.</p>
          )}
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeletePerson}
        title="Delete Person?"
        message={`Are you sure you want to delete ${person.first_name} ${person.last_name}?`}
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