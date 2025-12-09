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
          Add New Person
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
          {/* First / Last name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                onChange={handleChange}
                required
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
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                onChange={handleChange}
                required
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
          </div>

          {/* Profession */}
          <div>
            <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
              Profession
            </label>
            <select
              name="profession"
              value={formData.profession}
              onChange={handleChange}
              className="
                w-full
                bg-[#1a1a1a]
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
              <option value="actor" className="bg-[#1a1a1a]">Actor</option>
              <option value="producer" className="bg-[#1a1a1a]">Producer</option>
              <option value="director" className="bg-[#1a1a1a]">Director</option>
            </select>
          </div>

          {/* Filmography */}
          <div>
            <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
              Filmography (Select movies)
            </label>
            <div className="bg-[#1a1a1a] border-[3px] border-black rounded-[16px] px-3 py-2">
              <MultiSelect 
                label=""
                options={movieOptions}
                selectedIds={formData.movie_ids}
                onChange={handleMoviesChange}
                placeholder="Search movie..."
              />
            </div>
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
              Avatar (File)
            </label>

            <div
              className="
                w-full
                bg-[#1a1a1a]
                text-[#d6cecf]
                border-[3px] border-black
                rounded-[16px]
                px-4 py-2
                flex items-center gap-4
              "
            >
              {/* Кнопка ВИБІР ФАЙЛУ */}
              <label
                htmlFor="avatarFileInput"
                onClick={(e) => {
                  const btn = e.currentTarget;
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
                  
                  cursor-pointer
                  whitespace-nowrap

                  hover:bg-[#deb70b]
                  transition-colors
                  transition-transform
                  hover:scale-[0.95]
                "
              >
                Choose a file
              </label>

              {/* Текст з назвою файлу */}
              <span className="text-sm md:text-base text-[#d6cecf] truncate">
                {avatarFile ? avatarFile.name : 'File is not chosen'}
              </span>

              {/* Реальний input, схований */}
              <input
                id="avatarFileInput"
                type="file"
                name="avatarFile"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Biography */}
          <div>
            <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
              Biography
            </label>
            <textarea
              name="biography"
              rows="5"
              onChange={handleChange}
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
                resize-none
              "
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={(e) => {
              const btn = e.currentTarget;
              btn.style.transition = "transform 0.15s ease";
              btn.style.transform = "scale(0.85)";
              setTimeout(() => {
                btn.style.transform = "scale(1)";
              }, 150);
            }}
            className="
              w-full
              bg-[#c9c7c7]
              text-black
              font-extrabold
              text-xs md:text-sm
              tracking-[0.18em]
              uppercase
              
              rounded-[14px]
              px-6 py-3

              hover:bg-[#deb70b]
              transition-colors
              cursor-pointer
              disabled:opacity-60

              transition-transform
              hover:scale-[0.95]
            "
          >
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
