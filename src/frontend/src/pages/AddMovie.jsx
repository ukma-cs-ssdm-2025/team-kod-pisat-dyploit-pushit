import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addMovie, uploadMovieCover, getAllPeople } from '../api'; 
import MultiSelect from '../components/MultiSelect';
import AlertModal from '../components/AlertModal';

export default function AddMovie() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    people_ids: [], 
  });
  const [posterFile, setPosterFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [peopleOptions, setPeopleOptions] = useState([]);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '' });

  const navigate = useNavigate();

  useEffect(() => {
    getAllPeople().then(result => {
      const peopleList = result.people || result;
      const options = peopleList.map(p => ({
        id: p.id,
        label: `${p.first_name} ${p.last_name} (${p.profession})`
      }));
      setPeopleOptions(options);
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePeopleChange = (newSelectedIds) => {
    setFormData({ ...formData, people_ids: newSelectedIds });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPosterFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const movieData = {
        title: formData.title,
        description: formData.description,
        genre: formData.genre,
        rating: 0,
        people_ids: formData.people_ids,
      };

      const response = await addMovie(movieData);
      const newMovieId = response.movie?.id;

      if (!newMovieId) {
        throw new Error("Failed to get new movie ID");
      }
      
      if (posterFile) {
        await uploadMovieCover(newMovieId, posterFile);
      }
      
      setAlertConfig({
          isOpen: true,
          title: "Success",
          message: "Movie created successfully!"
      });
      setTimeout(() => navigate(`/movie/${newMovieId}`), 1500);

    } catch (err) {
      console.error("Creation error:", err);
      setAlertConfig({
          isOpen: true,
          title: "Error",
          message: `Error: ${err.message || 'Failed to create movie'}`
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#33364c] via-[#292d3d] to-[#606aa2] pt-8 pb-8">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-white mb-6 border-l-4 border-blue-500 pl-4">
          Add New Movie
        </h1>

        <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4 shadow-2xl">
          
          <div>
            <label className="block text-blue-400 mb-2 font-medium cursor-default">Title</label>
            <input type="text" name="title" onChange={handleChange} required className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"/>
          </div>

          <div>
              <label className="block text-blue-400 mb-2 font-medium cursor-default">Genre</label>
              <input type="text" name="genre" onChange={handleChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"/>
          </div>

          <MultiSelect 
            label="Cast & Crew"
            options={peopleOptions}
            selectedIds={formData.people_ids}
            onChange={handlePeopleChange}
            placeholder="Search person..."
          />

          <div>
            <label className="block text-blue-400 mb-2 font-medium cursor-default">Cover Image (File)</label>
            <input 
              type="file" 
              name="posterFile" 
              onChange={handleFileChange} 
              accept="image/*"
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
            />
          </div>

          <div>
            <label className="block text-blue-400 mb-2 font-medium cursor-default">Description</label>
            <textarea name="description" onChange={handleChange} rows="5" className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"></textarea>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg disabled:opacity-50 cursor-pointer">
            {isSubmitting ? 'Saving...' : 'Add Movie'}
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