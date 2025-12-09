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
    ])
      .then(([personResponse, allMoviesData]) => {
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

  // LOADING / NOT FOUND У ТОМУ Ж СТИЛІ
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        <div className="text-lg font-extrabold tracking-[0.18em] uppercase text-[#d6cecf]">
          Loading person...
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        <div className="text-lg font-extrabold tracking-[0.18em] uppercase text-red-400">
          Person not found.
        </div>
      </div>
    );
  }

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
              
              {/* AVATAR BLOCK */}
              <div className="w-full md:w-1/3 flex justify-center">
                <div className="bg-[#1a1a1a] border-[4px] border-black rounded-[16px] p-3 w-full max-w-xs">
                  <Avatar 
                    src={person.avatar_url} 
                    alt={`${person.first_name} ${person.last_name}`} 
                    size="xl"
                    className="w-full h-auto rounded-[12px] object-cover aspect-[3/4]"
                  />
                </div>
              </div>

              {/* TEXT INFO */}
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
                  {person.first_name} {person.last_name}
                </h1>

                <p className="text-sm md:text-base text-black font-extrabold tracking-[0.12em] uppercase mb-3">
                  {person.profession}
                </p>

                <div className="border-t-[3px] border-black pt-3 mt-2 space-y-3">
                  <h3 className="text-sm md:text-sm text-[#d6cecf] uppercase font-semibold tracking-[0.08em]">
                    Biography
                  </h3>
                  <p className="text-sm md:text-base text-[#1a1a1a] font-extrabold leading-relaxed">
                    {person.biography || "No biography available."}
                  </p>
                </div>

                {isAdmin && (
                  <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
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
                      Edit Person
                    </button>
                    <button
                      onClick={confirmDelete}
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
                      Delete Person
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* EDIT FORM — СТИЛЬ, ЯК У AddPerson/Profile */
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
              Edit Person
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={editData.first_name}
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
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={editData.last_name}
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
            </div>

            <div>
              <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
                Profession
              </label>
              <select
                name="profession"
                value={editData.profession}
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
                  cursor-pointer
                  appearance-none
                "
              >
                <option value="actor" className="bg-[#2b2727]">Actor</option>
                <option value="producer" className="bg-[#2b2727]">Producer</option>
                <option value="director" className="bg-[#2b2727]">Director</option>
              </select>
            </div>

            <div>
              <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
                Filmography
              </label>
              <div className="bg-[#313338] border-[3px] border-black rounded-[16px] px-3 py-2">
                <MultiSelect 
                  label=""
                  options={allMoviesOptions}
                  selectedIds={editData.movie_ids}
                  onChange={handleMoviesChange}
                  placeholder="Search movie..."
                />
              </div>
            </div>

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
                Biography
              </label>
              <textarea
                name="biography"
                value={editData.biography}
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
                onClick={() => { setIsEditing(false); setAvatarFile(null); }}
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

        {/* FILMOGRAPHY CARD */}
        <div className="bg-[#606aa2] border-black rounded-[15px] p-6 shadow-2xl">
          <h2 className="text-2xl font-extrabold text-[#d6cecf] mb-6 uppercase tracking-[0.16em]">
            Filmography
          </h2>
          {movies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="text-[#1a1a1a] uppercase font-extrabold">
              No movies found.
            </p>
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
