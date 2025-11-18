import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addMovie, uploadMovieCover, getAllPeople } from '../api'; 
import MultiSelect from '../components/MultiSelect'; // --- НОВЕ

export default function AddMovie() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    // people_ids тепер масив чисел
    people_ids: [], 
  });
  const [posterFile, setPosterFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [peopleOptions, setPeopleOptions] = useState([]); // Список для вибору

  const navigate = useNavigate();

  // Завантажуємо список людей для вибору
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

  // Обробник для MultiSelect
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
        people_ids: formData.people_ids, // Вже масив, перетворювати не треба
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
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 pt-24 pb-8">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
          Додати Новий Фільм
        </h1>

        <form onSubmit={handleSubmit} className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur space-y-4">
          
          <div>
            <label className="block text-amber-400 mb-2">Назва</label>
            <input type="text" name="title" onChange={handleChange} required className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
          </div>

          <div>
              <label className="block text-amber-400 mb-2">Жанр</label>
              <input type="text" name="genre" onChange={handleChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
          </div>

          {/* --- МУЛЬТИСЕЛЕКТ ЛЮДЕЙ --- */}
          <MultiSelect 
            label="Прив'язати людей"
            options={peopleOptions}
            selectedIds={formData.people_ids}
            onChange={handlePeopleChange}
            placeholder="Пошук актора, режисера..."
          />
          {/* ------------------------ */}

          <div>
            <label className="block text-amber-400 mb-2">Обкладинка (файл)</label>
            <input 
              type="file" 
              name="posterFile" 
              onChange={handleFileChange} 
              accept="image/*"
              className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
            />
          </div>

          <div>
            <label className="block text-amber-400 mb-2">Опис</label>
            <textarea name="description" onChange={handleChange} rows="5" className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"></textarea>
          </div>

          <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-6 py-3 rounded-lg disabled:opacity-50">
            {isSubmitting ? 'Збереження...' : 'Додати Фільм'}
          </button>
        </form>
      </div>
    </div>
  );
}