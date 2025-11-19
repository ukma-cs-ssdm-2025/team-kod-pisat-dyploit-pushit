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
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400">Завантаження...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-8">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="section-title">
            Керування людьми
          </h1>
          <Link
            to="/people/new"
            className="btn-primary"
          >
            + Додати людину
          </Link>
        </div>

        <input
          type="text"
          placeholder="Шукати за ім'ям, прізвищем, професією..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input mb-8"
        />

        <div className="card overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-4 text-blue-400 font-medium">Повне Ім'я</th>
                <th className="p-4 text-blue-400 font-medium">Професія</th>
                <th className="p-4 text-blue-400 font-medium">Дії</th>
              </tr>
            </thead>
            <tbody>
              {filteredPeople.map(person => (
                  <tr key={person.id} className="border-b border-gray-700/50 last:border-b-0 hover:bg-gray-700/30 transition-colors">
                    <td className="p-4">
                      <Link to={`/people/${person.id}`} className="text-white font-semibold hover:underline">
                        {person.first_name} {person.last_name}
                      </Link>
                    </td>
                    <td className="p-4 text-gray-300">{person.profession}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleDeletePerson(person.id, `${person.first_name} ${person.last_name}`)}
                        className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
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