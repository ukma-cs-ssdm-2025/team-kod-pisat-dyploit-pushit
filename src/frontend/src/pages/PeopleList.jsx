import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllPeople, deletePerson } from '../api'; 
import { useAuth } from '../hooks/useAuth'; 

export default function PeopleList() {
  const { isAdmin } = useAuth(); 
  
  const [people, setPeople] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
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
    }
  }, [isAdmin]);

  const filteredPeople = people.filter(person => 
    person.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.profession.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    return <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-center pt-32 text-lg text-amber-400">Завантаження...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 pt-24 pb-8">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
            Керування Людьми
          </h1>
          <Link
            to="/people/new"
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-6 py-3 rounded-lg transition-all font-medium border border-green-400/30"
          >
            + Додати людину
          </Link>
        </div>

        <input
          type="text"
          placeholder="Шукати за ім'ям, прізвищем, професією..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 mb-8 bg-transparent border-2 border-amber-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-400"
        />

        <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl border border-amber-500/20 backdrop-blur overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-amber-500/30">
              <tr>
                <th className="p-4 text-amber-400">Ім'я</th>
                <th className="p-4 text-amber-400">Прізвище</th>
                <th className="p-4 text-amber-400">Професія</th>
                <th className="p-4 text-amber-400">Дії</th>
              </tr>
            </thead>
            <tbody>
              {filteredPeople.map(person => (
                  <tr key={person.id} className="border-b border-purple-800/50 last:border-b-0 hover:bg-purple-800/30 transition-colors">
                    <td className="p-4">
                      <Link to={`/people/${person.id}`} className="text-white font-semibold hover:underline">
                        {person.first_name}
                      </Link>
                    </td>
                    <td className="p-4 text-gray-300">{person.last_name}</td>
                    <td className="p-4 text-gray-300">{person.profession}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleDeletePerson(person.id, `${person.first_name} ${person.last_name}`)}
                        className="text-red-500 hover:text-red-400 transition-colors text-sm font-medium"
                      >
                        Видалити
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}