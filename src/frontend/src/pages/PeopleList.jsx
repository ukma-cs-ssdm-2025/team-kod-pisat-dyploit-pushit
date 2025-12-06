import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getPaginatedPeople,
  deletePerson,
  getPeopleStats,
  getPeopleProfessions
} from '../api';
import { useAuth } from '../hooks/useAuth';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Avatar from '../components/Avatar';
import Pagination from '../components/Pagination';

export default function PeopleList() {
  const { isAdmin } = useAuth();

  // 👉 SERVER DATA + FILTERS
  const [people, setPeople] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    actors: 0,
    directors: 0,
    producers: 0,
  });

  const [professions, setProfessions] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [professionFilter, setProfessionFilter] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPeople, setTotalPeople] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const PEOPLE_PER_PAGE = 15;

  // 👉 DELETE & ALERT
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
  });

  // -----------------------------------------------------
  // 🔵 DEBOUNCE SEARCH (як у Users & Movies)
  // -----------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // -----------------------------------------------------
  // 🟡 FETCH PEOPLE WITH NEW API (SERVER-SIDE FILTERS)
  // -----------------------------------------------------
  const fetchPeopleData = useCallback(
    async (page = 1, search = '', profession = '') => {
      setIsLoading(true);

      try {
        const [statsData, professionsData, peopleData] = await Promise.all([
          getPeopleStats(),
          getPeopleProfessions(),
          getPaginatedPeople(page, PEOPLE_PER_PAGE, search, profession),
        ]);

        setStats(statsData);
        setProfessions(professionsData);
        setPeople(peopleData.people || peopleData);
        setTotalPeople(peopleData.total || 0);
        setTotalPages(peopleData.totalPages || 1);
      } catch (err) {
        console.error('Failed to load people:', err);
        setPeople([]);
        setTotalPeople(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [PEOPLE_PER_PAGE]
  );

  // fetch on filters/page change
  useEffect(() => {
    fetchPeopleData(currentPage, debouncedSearchTerm, professionFilter);
  }, [currentPage, debouncedSearchTerm, professionFilter, fetchPeopleData]);

  // -----------------------------------------------------
  // HANDLERS
  // -----------------------------------------------------
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

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

      setAlertConfig({
        isOpen: true,
        title: 'Success',
        message: 'Person deleted successfully.',
      });
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: 'Error',
        message: `Error: ${err.message || 'Failed to delete'}`,
      });
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

  const isFiltered = debouncedSearchTerm || professionFilter;

  // -----------------------------------------------------
  // LOADING STATE
  // -----------------------------------------------------
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-lg text-blue-400"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        Loading...
      </div>
    );
  }

  // -----------------------------------------------------
  // RENDER
  // -----------------------------------------------------
  return (
    <div className="min-h-screen pt-8 pb-8" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="w-full max-w-6xl mx-auto bg-[#052288] rounded-[15px] p-8">
        {/* Header */}
        <div className="flex justify-between items-center gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold text-[#d6cecf] uppercase tracking-[0.12em]">
              Cast & Crew
            </h1>
            <p className="text-[#c9c7c7] text-sm mt-2 max-w-md">
              Discover your favorite actors, directors and producers.
            </p>
          </div>

          {isAdmin && (
            <Link
              to="/people/new"
              className="
                bg-[#c9c7c7] 
                text-black 
                border-[3px] border-black 
                px-4 py-2 
                rounded-[12px] 
                font-extrabold 
                uppercase 
                tracking-[0.12em] 
                text-xs
                hover:bg-white
                transition-colors
              "
            >
              + Add Person
            </Link>
          )}
        </div>

        {/* Search + Profession Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-[#d6cecf] mb-2 text-xs font-extrabold uppercase tracking-[0.12em]">
              Search by Name or Profession
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="
                w-full 
                bg-[#1a1a1a] 
                text-[#d6cecf] 
                border-[3px] border-black 
                rounded-[12px] 
                px-4 py-3 
                focus:outline-none
              "
            />
          </div>

          <div>
            <label className="block text-[#d6cecf] mb-2 text-xs font-extrabold uppercase tracking-[0.12em]">
              Filter by Profession
            </label>

            <select
              value={professionFilter}
              onChange={handleProfessionChange}
              className="
                w-full 
                bg-[#1a1a1a] 
                text-[#d6cecf] 
                border-[3px] border-black 
                rounded-[12px] 
                px-4 py-3 
                focus:outline-none
                cursor-pointer
              "
            >
              <option value="">All Professions</option>

              {professions.map((profession) => (
                <option key={profession} value={profession} className="bg-[#1a1a1a]">
                  {profession.charAt(0).toUpperCase() + profession.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-[#6700b7]">{stats.total}</div>
            <div className="text-[#c9c7c7] text-sm">Total People</div>
          </div>

          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-[#b75100]">{stats.actors}</div>
            <div className="text-[#c9c7c7] text-sm">Actors</div>
          </div>

          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-purple-400">{stats.directors}</div>
            <div className="text-[#c9c7c7] text-sm">Directors</div>
          </div>

          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-yellow-400">{stats.producers}</div>
            <div className="text-[#c9c7c7] text-sm">Producers</div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-[#1a1a1a] border-[4px] border-black rounded-[15px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-[#292929] border-b border-black">
                <tr>
                  <th className="p-4 text-[#d6cecf] text-xs uppercase tracking-[0.08em] font-extrabold">
                    Person
                  </th>
                  <th className="p-4 text-[#d6cecf] text-xs uppercase tracking-[0.08em] font-extrabold">
                    Profession
                  </th>
                  {isAdmin && (
                    <th className="p-4 text-[#d6cecf] text-xs uppercase tracking-[0.08em] font-extrabold">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {people.length > 0 ? (
                  people.map((person) => (
                    <tr key={person.id} className="border-b border-black bg-[#1a1818]">
                      <td className="p-4">
                        <Link
                          to={`/people/${person.id}`}
                          className="flex items-center gap-4 group"
                        >
                          <Avatar
                            src={person.avatar_url}
                            alt={`${person.first_name} ${person.last_name}`}
                            size="md"
                          />
                          <div>
                            <span className="text-[#d6cecf] font-extrabold text-base group-hover:text-white transition-colors block">
                              {person.first_name} {person.last_name}
                            </span>

                            {person.biography && (
                              <p className="text-[#c9c7c7] text-xs mt-1 line-clamp-1 max-w-xs">
                                {person.biography}
                              </p>
                            )}
                          </div>
                        </Link>
                      </td>

                      <td className="p-4">
                        <span
                          className={`
                            inline-flex items-center 
                            px-3 py-1 
                            rounded-[6px] 
                            text-[10px] 
                            uppercase 
                            font-extrabold 
                            tracking-[0.08em] 
                            border-[2px] border-black
                            ${
                              person.profession === 'actor'
                                ? 'bg-green-900 text-green-300'
                                : person.profession === 'director'
                                ? 'bg-purple-900 text-purple-300'
                                : person.profession === 'producer'
                                ? 'bg-yellow-900 text-yellow-300'
                                : 'bg-[#2b2727] text-[#d6cecf]'
                            }
                          `}
                        >
                          {person.profession}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="p-4">
                          <button
                            onClick={() => confirmDelete(person)}
                            className="
                              bg-[#1a1818] 
                              text-[#d6cecf] 
                              border-[3px] border-black 
                              px-3 py-1 
                              rounded-[10px] 
                              font-extrabold 
                              uppercase 
                              text-xs
                              hover:bg-black
                              transition-colors
                            "
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isAdmin ? 3 : 2}
                      className="p-8 text-center text-[#c9c7c7]"
                    >
                      {isFiltered
                        ? 'No people found matching your criteria.'
                        : 'No people available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FILTER PANEL BELOW TABLE */}
        {isFiltered && (
          <div className="mt-4 p-4 bg-[#1a1a1a] border-[3px] border-black rounded-[12px] flex justify-between items-center">
            <div className="text-[#c9c7c7] text-sm tracking-wide">
              Showing {people.length} of {totalPeople} results
              {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
              {professionFilter && ` in profession "${professionFilter}"`}
            </div>

            <button
              onClick={resetFilters}
              className="text-[#d6cecf] hover:text-white underline text-sm font-extrabold uppercase tracking-[0.1em]"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Pagination ALWAYS visible */}
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalItems={totalPeople}
            pageSize={PEOPLE_PER_PAGE}
            onPageChange={handlePageChange}
            totalPages={totalPages}
          />
        </div>
      </div>

      {/* POPCORN */}
      <img
        src="/pictures_elements/popcorn_gray.png"
        className="popcorn fixed right-6 bottom-6 w-[70px] z-20"
        alt="Popcorn"
        onClick={(e) => {
          e.target.classList.remove('active');
          void e.target.offsetWidth;
          e.target.classList.add('active');
        }}
      />

      {/* MODALS */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeletePerson}
        title="Delete Person?"
        message={`Are you sure you want to delete ${personToDelete?.first_name} ${personToDelete?.last_name}?`}
      />

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() =>
          setAlertConfig({ ...alertConfig, isOpen: false })
        }
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  );
}
