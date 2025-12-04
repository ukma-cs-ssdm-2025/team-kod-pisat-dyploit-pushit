import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAllPeople, deletePerson, getPeopleStats, getPeopleProfessions, getPaginatedPeople } from '../api'; 
import { useAuth } from '../hooks/useAuth'; 
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Avatar from '../components/Avatar';
import Pagination from '../components/Pagination';

export default function PeopleList() {
  const { isAdmin, isAuthenticated } = useAuth(); 
  
  const [people, setPeople] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    actors: 0,
    directors: 0,
    producers: 0
  });
  const [professions, setProfessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [professionFilter, setProfessionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPeople, setTotalPeople] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PEOPLE_PER_PAGE = 15;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  const fetchPeopleData = useCallback(async (page = 1, search = '', profession = '') => {
    setIsLoading(true);
    try {
      const [statsData, professionsData, peopleData] = await Promise.all([
        getPeopleStats(),
        getPeopleProfessions(),
        getPaginatedPeople(page, PEOPLE_PER_PAGE, search, profession)
      ]);

      setStats(statsData);
      setProfessions(professionsData);
      setPeople(peopleData.people || peopleData);
      setTotalPeople(peopleData.total || 0);
      setTotalPages(peopleData.totalPages || 1);
    } catch (err) {
      console.error("Error loading people data:", err);
      setPeople([]);
      setTotalPeople(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [PEOPLE_PER_PAGE]);

  useEffect(() => {
    fetchPeopleData(currentPage, debouncedSearchTerm, professionFilter);
  }, [currentPage, debouncedSearchTerm, professionFilter, fetchPeopleData]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleProfessionChange = (e) => {
    setProfessionFilter(e.target.value);
    setCurrentPage(1);
  };

  const confirmDelete = (person) => {
    setPersonToDelete(person);
    setIsDeleteModalOpen(true);
  };

  const handleDeletePerson = async () => {
    if (!personToDelete) return;
    try {
      await deletePerson(personToDelete.id);
      fetchPeopleData(currentPage, debouncedSearchTerm, professionFilter);
      setAlertConfig({ isOpen: true, title: "Success", message: "Person deleted successfully." });
    } catch (err) {
      setAlertConfig({ isOpen: true, title: "Error", message: `Error: ${err.message || 'Failed to delete'}` });
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setProfessionFilter('');
    setCurrentPage(1);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400 cursor-wait">Loading...</div>;
  }

  const isFiltered = debouncedSearchTerm || professionFilter;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-8 pb-8">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white border-l-4 border-blue-500 pl-4">
              Cast & Crew
            </h1>
            <p className="text-gray-400 mt-2 pl-5 cursor-default">
              Discover your favorite actors, directors and producers.
            </p>
          </div>
          {isAdmin && (
            <Link
              to="/people/new"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              + Add Person
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-blue-400 mb-2 font-medium cursor-default">Search by Name or Biography</label>
            <input
              type="text"
              placeholder="Search by name or biography..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-text"
            />
          </div>
          <div>
            <label className="block text-blue-400 mb-2 font-medium cursor-default">Filter by Profession</label>
            <select
              value={professionFilter}
              onChange={handleProfessionChange}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
            >
              <option value="">All Professions</option>
              {professions.map(profession => (
                <option key={profession} value={profession} className="bg-gray-800">
                  {profession.charAt(0).toUpperCase() + profession.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-400 cursor-default">{stats.total}</div>
            <div className="text-gray-300 text-sm cursor-default">Total People</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg text-center shadow-lg">
            <div className="text-2xl font-bold text-green-400 cursor-default">
              {stats.actors}
            </div>
            <div className="text-gray-300 text-sm cursor-default">Actors</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg text-center shadow-lg">
            <div className="text-2xl font-bold text-purple-400 cursor-default">
              {stats.directors}
            </div>
            <div className="text-gray-300 text-sm cursor-default">Directors</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg text-center shadow-lg">
            <div className="text-2xl font-bold text-yellow-400 cursor-default">
              {stats.producers}
            </div>
            <div className="text-gray-300 text-sm cursor-default">Producers</div>
          </div>
        </div>

        {people.length > 0 ? (
          <>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="p-4 text-blue-400 font-medium cursor-default">Person</th>
                    <th className="p-4 text-blue-400 font-medium cursor-default">Profession</th>
                    {isAdmin && (
                      <th className="p-4 text-blue-400 font-medium cursor-default">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {people.map(person => (
                    <tr key={person.id} className="border-b border-gray-700/50 last:border-b-0 hover:bg-gray-700/30 transition-colors">
                      <td className="p-4">
                        <Link to={`/people/${person.id}`} className="flex items-center gap-4 group cursor-pointer">
                          <Avatar src={person.avatar_url} alt={`${person.first_name} ${person.last_name}`} size="md" />
                          <div>
                              <span className="text-white font-semibold text-lg group-hover:text-blue-400 transition-colors block">
                                {person.first_name} {person.last_name}
                              </span>
                              {person.biography && (
                                  <p className="text-gray-400 text-xs mt-1 line-clamp-1 max-w-xs">
                                  {person.biography}
                                  </p>
                              )}
                          </div>
                        </Link>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize cursor-default ${
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
                            onClick={() => confirmDelete(person)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3 py-1 rounded transition-colors text-sm font-medium cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isFiltered && (
              <div className="mt-4 p-4 bg-gray-800/30 border border-gray-700 rounded-lg flex justify-between items-center">
                <div className="text-gray-300 cursor-default">
                  Showing {people.length} of {totalPeople} results
                  {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
                </div>
                <button 
                  onClick={resetFilters}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 px-3 py-1 rounded transition-colors text-sm font-medium cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}

            <div className="mt-8">
              <Pagination 
                currentPage={currentPage}
                totalItems={totalPeople}
                pageSize={PEOPLE_PER_PAGE}
                onPageChange={handlePageChange}
                totalPages={totalPages}
              />
            </div>
          </>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
            <div className="text-gray-400 text-lg mb-4 cursor-default">
              {isFiltered 
                ? "No people found matching your criteria." 
                : "No people available."
              }
            </div>
            {isFiltered && (
              <button 
                onClick={resetFilters}
                className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeletePerson}
        title="Delete Person?"
        message={`Are you sure you want to delete ${personToDelete?.first_name} ${personToDelete?.last_name}?`}
      />
      <AlertModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  );
}