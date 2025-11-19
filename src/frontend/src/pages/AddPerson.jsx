import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addPerson, uploadPersonAvatar, getAllMovies } from '../api'; 
import MultiSelect from '../components/MultiSelect';

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

  const navigate = useNavigate();

  useEffect(() => {
    getAllMovies().then(movies => {
      const options = movies.map(m => ({
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
        throw new Error("Не вдалося отримати ID нової людини");
      }

      if (avatarFile) {
        await uploadPersonAvatar(newPersonId, avatarFile);
      }
      
      alert('Людину успішно створено!');
      navigate(`/people/${newPersonId}`); 

    } catch (err) {
      console.error("Помилка створення:", err);
      alert(`Помилка: ${err.message || 'Не вдалося створити'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-8">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="section-title">
          Додати Нову Людину
        </h1>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-400 mb-2 font-medium">Ім'я</label>
              <input type="text" name="first_name" onChange={handleChange} required className="form-input"/>
            </div>
            <div>
              <label className="block text-blue-400 mb-2 font-medium">Прізвище</label>
              <input type="text" name="last_name" onChange={handleChange} required className="form-input"/>
            </div>
          </div>

          <div>
            <label className="block text-blue-400 mb-2 font-medium">Професія</label>
            <select name="profession" value={formData.profession} onChange={handleChange} className="form-input">
                <option value="actor" className="bg-gray-800">Actor</option>
                <option value="producer" className="bg-gray-800">Producer</option>
                <option value="director" className="bg-gray-800">Director</option>
            </select>
          </div>

          <MultiSelect 
            label="Фільмографія (обрати фільми)"
            options={movieOptions}
            selectedIds={formData.movie_ids}
            onChange={handleMoviesChange}
            placeholder="Пошук фільму..."
          />

          <div>
            <label className="block text-blue-400 mb-2 font-medium">Аватар (файл)</label>
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
            <textarea name="biography" onChange={handleChange} rows="5" className="form-input"></textarea>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-50">
            {isSubmitting ? 'Збереження...' : 'Додати Людину'}
          </button>
        </form>
      </div>
    </div>
  );
}