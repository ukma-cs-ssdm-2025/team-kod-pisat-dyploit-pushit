import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addPerson, uploadPersonAvatar } from '../api';

export default function AddPerson() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    profession: 'actor',
    biography: '',
    movie_ids: '', 
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        movie_ids: formData.movie_ids.split(',').map(id => parseInt(id.trim())).filter(Boolean),
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
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 pt-24 pb-8">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
          Додати Нову Людину
        </h1>

        <form onSubmit={handleSubmit} className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-amber-400 mb-2">Ім'я</label>
              <input type="text" name="first_name" onChange={handleChange} required className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
            </div>
            <div>
              <label className="block text-amber-400 mb-2">Прізвище</label>
              <input type="text" name="last_name" onChange={handleChange} required className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
            </div>
          </div>

          <div>
            <label className="block text-amber-400 mb-2">Професія</label>
            <select name="profession" value={formData.profession} onChange={handleChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400">
                <option value="actor" className="bg-purple-900">Actor</option>
                <option value="producer" className="bg-purple-900">Producer</option>
                <option value="director" className="bg-purple-900">Director</option>
            </select>
          </div>

          <div>
            <label className="block text-amber-400 mb-2">ID Фільмів (через кому)</label>
            <input type="text" name="movie_ids" placeholder="Напр: 1, 2, 5" onChange={handleChange} className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"/>
          </div>

          <div>
            <label className="block text-amber-400 mb-2">Аватар (файл)</label>
            <input 
              type="file" 
              name="avatarFile" 
              onChange={handleFileChange} 
              accept="image/*"
              className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
            />
          </div>

          <div>
            <label className="block text-amber-400 mb-2">Біографія</label>
            <textarea name="biography" onChange={handleChange} rows="5" className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"></textarea>
          </div>

          <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-6 py-3 rounded-lg disabled:opacity-50">
            {isSubmitting ? 'Збереження...' : 'Додати Людину'}
          </button>
        </form>
      </div>
    </div>
  );
}