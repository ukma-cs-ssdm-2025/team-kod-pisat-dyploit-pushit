import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addPerson, uploadPersonAvatar, getAllMovies } from '../api'; 
import MultiSelect from '../components/MultiSelect';
import AlertModal from '../components/AlertModal';

export default function AddPerson() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    profession: 'actor', 
    biography: '',
    movie_ids: [],
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [movieOptions, setMovieOptions] = useState([]);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '' });

  const navigate = useNavigate();

  useEffect(() => {
    getAllMovies().then(result => {
      const moviesList = result.movies || result;
      const options = moviesList.map(m => ({
        id: m.id,
        label: `${m.title} (${m.year || 'N/A'})`
      }));
      setMovieOptions(options);
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMoviesChange = (newSelectedIds) => {
    setFormData({ ...formData, movie_ids: newSelectedIds });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const personData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        profession: formData.profession,
        biography: formData.biography,
        movie_ids: formData.movie_ids,
      };

      const response = await addPerson(personData);
      const newPersonId = response.person?.id;

      if (!newPersonId) {
        throw new Error("Failed to get new person ID");
      }

      if (avatarFile) {
        await uploadPersonAvatar(newPersonId, avatarFile);
      }
      
      setAlertConfig({
        isOpen: true,
        title: "Success",
        message: "Person added successfully!"
      });
      setTimeout(() => navigate(`/people/${newPersonId}`), 1500);

    } catch (err) {
      console.error("Creation error:", err);
      setAlertConfig({
        isOpen: true,
        title: "Error",
        message: `Error: ${err.message || 'Failed to create person'}`
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-8 pb-8">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-white mb-6 border-l-4 border-blue-500 pl-4">
          Add New Person
        </h1>

        <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4 shadow-2xl">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-400 mb-2 font-medium cursor-default">First Name</label>
              <input type="text" name="first_name" onChange={handleChange} required className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"/>
            </div>
            <div>
              <label className="block text-blue-400 mb-2 font-medium cursor-default">Last Name</label>
              <input type="text" name="last_name" onChange={handleChange} required className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"/>
            </div>
          </div>

          <div>
            <label className="block text-blue-400 mb-2 font-medium cursor-default">Profession</label>
            <select name="profession" value={formData.profession} onChange={handleChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none">
                <option value="actor" className="bg-gray-800">Actor</option>
                <option value="producer" className="bg-gray-800">Producer</option>
                <option value="director" className="bg-gray-800">Director</option>
            </select>
          </div>

          <MultiSelect 
            label="Filmography (Select movies)"
            options={movieOptions}
            selectedIds={formData.movie_ids}
            onChange={handleMoviesChange}
            placeholder="Search movie..."
          />

          <div>
            <label className="block text-blue-400 mb-2 font-medium cursor-default">Avatar (File)</label>
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
            <textarea name="biography" onChange={handleChange} rows="5" className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"></textarea>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg disabled:opacity-50 cursor-pointer">
            {isSubmitting ? 'Saving...' : 'Add Person'}
          </button>
        </form>
      </div>
      <AlertModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  );
}