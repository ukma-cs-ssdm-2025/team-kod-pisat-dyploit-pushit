import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addMovie } from '../api'; // Мокап

export default function AddMovie() {
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    director: '',
    actors: '',
    description: '',
  });
  // --- НОВИЙ СТАН ДЛЯ ФАЙЛУ ---
  const [posterFile, setPosterFile] = useState(null);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- НОВИЙ ОБРОБНИК ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPosterFile(e.target.files[0]);
    }
  };

  // --- ОНОВЛЕНА ФУНКЦІЯ ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!posterFile) {
      alert("Будь ласка, завантажте постер для фільму.");
      return;
    }
    
    const movieData = {
      ...formData,
      year: parseInt(formData.year, 10),
      actors: formData.actors.split(',').map(actor => actor.trim()),
    };
    
    // Передаємо дані ТА файл
    await addMovie(movieData, posterFile);
    alert('Фільм успішно додано (імітація)!');
    navigate('/movies');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 pt-24 pb-8">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
          Додати Новий Фільм
        </h1>

        <form onSubmit={handleSubmit} className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur space-y-4">
          
          {/* ... (поля "Назва", "Рік", "Режисер", "Актори") ... */}
          
          {/* --- ОНОВЛЕНЕ ПОЛЕ --- */}
          <div>
            <label className="block text-amber-400 mb-2">Постер (файл)</label>
            <input 
              type="file" 
              name="posterFile" 
              onChange={handleFileChange} 
              accept="image/*"
              required
              className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
            />
          </div>

          <div>
            <label className="block text-amber-400 mb-2">Опис</label>
            <textarea name="description" onChange={handleChange} rows="5" className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"></textarea>
          </div>

          <button type="submit" className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-6 py-3 rounded-lg">
            Додати Фільм
          </button>
        </form>
      </div>
    </div>
  );
}