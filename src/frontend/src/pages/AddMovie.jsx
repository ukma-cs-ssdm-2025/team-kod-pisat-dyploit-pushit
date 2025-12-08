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
    <div
      className="min-h-screen px-4 py-8 flex justify-center"
      style={{ backgroundColor: "#1a1a1a" }}
    >
      <div className="w-full max-w-3xl">
        <h1
          className="
            text-2xl md:text-3xl
            font-extrabold
            text-[#d6cecf]
            uppercase
            tracking-[0.18em]
            mb-6
          "
          style={{ letterSpacing: "0.12em" }}
        >
          Add New Movie
        </h1>

        <form
          onSubmit={handleSubmit}
          className="
            bg-[#606aa2]
            rounded-[15px]
            p-6 mb-8
            shadow-2xl
            space-y-4
            border-black
          "
        >
          {/* Title */}
          <div>
            <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
              Title
            </label>
            <input
              type="text"
              name="title"
              onChange={handleChange}
              required
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

          {/* Genre */}
          <div>
            <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
              Genre
            </label>
            <input
              type="text"
              name="genre"
              onChange={handleChange}
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

          {/* Cast & Crew */}
          <div>
            <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
              Cast & Crew
            </label>
            <div className="bg-[#2b2727] border-[3px] border-black rounded-[16px] px-3 py-2">
              <MultiSelect
                label=""
                options={peopleOptions}
                selectedIds={formData.people_ids}
                onChange={handlePeopleChange}
                placeholder="Search person..."
              />
            </div>
          </div>

          {/* Poster file */}
          <div>
            <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
              Cover Image (File)
            </label>
            <input 
              type="file" 
              name="posterFile" 
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

          {/* Description */}
          <div>
            <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
              Description
            </label>
            <textarea
              name="description"
              onChange={handleChange}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="
              w-full
              bg-[#c9c7c7]
              text-black
              font-extrabold
              text-xs md:text-sm
              tracking-[0.18em]
              uppercase
              border-[3px] border-black
              rounded-[14px]
              px-6 py-3
              hover:bg-[#e0dfdf]
              transition-colors
              cursor-pointer
              disabled:opacity-60
            "
          >
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
