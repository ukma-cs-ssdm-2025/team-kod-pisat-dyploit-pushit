import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addMovie, uploadMovieCover, getAllPeople } from '../api'; 
import MultiSelect from '../components/MultiSelect';

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

  const navigate = useNavigate();

  useEffect(() => {
    getAllPeople().then(people => {
      const options = people.map(p => ({
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
        throw new Error("Не вдалося отримати ID нового фільму");
      }
      
      if (posterFile) {
        await uploadMovieCover(newMovieId, posterFile);
      }
      
      alert('Фільм успішно створено!');
      navigate(`/movie/${newMovieId}`);

    } catch (err) {
      console.error("Помилка створення фільму:", err);
      alert(`Помилка: ${err.message || 'Не вдалося створити фільм'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-8">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="section-title">
          Додати Новий Фільм
        </h1>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          
          <div>
            <label className="block text-blue-400 mb-2 font-medium">Назва</label>
            <input type="text" name="title" onChange={handleChange} required className="form-input"/>
          </div>

          <div>
              <label className="block text-blue-400 mb-2 font-medium">Жанр</label>
              <input type="text" name="genre" onChange={handleChange} className="form-input"/>
          </div>

          <MultiSelect 
            label="Прив'язати людей"
            options={peopleOptions}
            selectedIds={formData.people_ids}
            onChange={handlePeopleChange}
            placeholder="Пошук актора, режисера..."
          />

          <div>
            <label className="block text-blue-400 mb-2 font-medium">Обкладинка (файл)</label>
            <input 
              type="file" 
              name="posterFile" 
              onChange={handleFileChange} 
              accept="image/*"
              className="form-input file:bg-gray-700 file:text-white file:border-0 file:rounded file:px-4 file:py-2"
            />
          </div>

          <div>
            <label className="block text-blue-400 mb-2 font-medium">Опис</label>
            <textarea name="description" onChange={handleChange} rows="5" className="form-input"></textarea>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-50">
            {isSubmitting ? 'Збереження...' : 'Додати Фільм'}
          </button>
        </form>
      </div>
    </div>
  );
}