import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllPeople, deletePerson } from '../api'; 
import { useAuth } from '../hooks/useAuth'; 

export default function PeopleList() {
  const { isAdmin, isAuthenticated } = useAuth(); 
  
  const [people, setPeople] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [professionFilter, setProfessionFilter] = useState('');

  useEffect(() => {
    getAllPeople()
      .then(data => {
        setPeople(data);
      })
      .catch(err => {
        console.error("Помилка завантаження людей:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const uniqueProfessions = [...new Set(people.map(person => person.profession))].sort();

  const filteredPeople = people.filter(person => {
    const matchesSearch = person.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.profession.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProfession = !professionFilter || person.profession === professionFilter;
    
    return matchesSearch && matchesProfession;
  });

  const handleDeletePerson = async (personId, name) => {
    if (window.confirm(`Ви впевнені, що хочете видалити ${name}?`)) {
      try {
        await deletePerson(personId); 
        setPeople(prevPeople => prevPeople.filter(p => p.id !== personId));
      } catch (err) {
        alert(`Помилка: ${err.message || 'Не вдалося видалити'}`);
      }
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400">Завантаження...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-8">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="section-title">
              Актори, режисери та продюсери
            </h1>
            <p className="text-gray-300">
              Знайдіть улюблених акторів, режисерів та інших творців кіно
            </p>
          </div>
          {isAdmin && (
            <Link
              to="/people/new"
              className="btn-primary"
            >
              + Додати людину
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-blue-400 mb-2 font-medium">Пошук за іменем або професією</label>
            <input
              type="text"
              placeholder="Шукати за ім'ям, прізвищем, професією..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-blue-400 mb-2 font-medium">Фільтр за професією</label>
            <select
              value={professionFilter}
              onChange={(e) => setProfessionFilter(e.target.value)}
              className="form-input"
            >
              <option value="">Всі професії</option>
              {uniqueProfessions.map(profession => (
                <option key={profession} value={profession} className="bg-gray-800">
                  {profession}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{people.length}</div>
            <div className="text-gray-300 text-sm">Всього людей</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {people.filter(p => p.profession === 'actor').length}
            </div>
            <div className="text-gray-300 text-sm">Акторів</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {people.filter(p => p.profession === 'director').length}
            </div>
            <div className="text-gray-300 text-sm">Режисерів</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {people.filter(p => p.profession === 'producer').length}
            </div>
            <div className="text-gray-300 text-sm">Продюсерів</div>
          </div>
        </div>

        {filteredPeople.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full text-left">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-4 text-blue-400 font-medium">Фото</th>
                  <th className="p-4 text-blue-400 font-medium">Повне Ім'я</th>
                  <th className="p-4 text-blue-400 font-medium">Професія</th>
                  {isAdmin && (
                    <th className="p-4 text-blue-400 font-medium">Дії</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredPeople.map(person => (
                  <tr key={person.id} className="border-b border-gray-700/50 last:border-b-0 hover:bg-gray-700/30 transition-colors">
                    <td className="p-4">
                      <Link to={`/people/${person.id}`} className="block">
                        <img
                          src={person.avatar_url || `https://via.placeholder.com/50/374151/FFFFFF?text=${person.first_name[0]}${person.last_name[0]}`}
                          alt={`${person.first_name} ${person.last_name}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-600 hover:border-blue-400 transition-colors"
                        />
                      </Link>
                    </td>
                    <td className="p-4">
                      <Link to={`/people/${person.id}`} className="text-white font-semibold hover:underline block">
                        {person.first_name} {person.last_name}
                      </Link>
                      {person.biography && (
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                          {person.biography.length > 100 
                            ? `${person.biography.substring(0, 100)}...` 
                            : person.biography}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        person.profession === 'actor' ? 'bg-green-500/20 text-green-300' :
                        person.profession === 'director' ? 'bg-purple-500/20 text-purple-300' :
                        person.profession === 'producer' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {person.profession}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-4">
                        <button 
                          onClick={() => handleDeletePerson(person.id, `${person.first_name} ${person.last_name}`)}
                          className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
                        >
                          Видалити
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <div className="text-gray-400 text-lg mb-4">
              Не знайдено людей за вашим запитом
            </div>
            <p className="text-gray-500 mb-4">
              Спробуйте змінити параметри пошуку або фільтрації
            </p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setProfessionFilter('');
              }}
              className="btn-secondary"
            >
              Скинути фільтри
            </button>
          </div>
        )}

        {!isAdmin && isAuthenticated && (
          <div className="mt-8 card p-6 bg-blue-500/10 border border-blue-500/20">
            <h3 className="text-blue-400 font-medium mb-2">💡 Як користуватися списком?</h3>
            <p className="text-gray-300 text-sm">
              Тут ви можете знайти інформацію про акторів, режисерів та продюсерів. 
              Натисніть на будь-яку людину, щоб переглянути її повний профіль та фільмографію.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}