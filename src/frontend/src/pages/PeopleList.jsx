import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllPeople, deletePerson } from '../api'; 
import { useAuth } from '../hooks/useAuth'; 
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Avatar from '../components/Avatar';
import Pagination from '../components/Pagination';

export default function PeopleList() {
  const { isAdmin, isAuthenticated } = useAuth(); 
  
  const [people, setPeople] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [professionFilter, setProfessionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPeople, setTotalPeople] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PEOPLE_PER_PAGE = 15;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '' });

  // Завантаження людей з пагінацією
  const fetchPeople = async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await getAllPeople(`?page=${page}&limit=${PEOPLE_PER_PAGE}`);
      setPeople(data.people || data);
      setTotalPeople(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error loading people:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople(currentPage);
  }, [currentPage]);

  const uniqueProfessions = [...new Set(people.map(person => person.profession))].sort();

  const filteredPeople = people.filter(person => {
    const matchesSearch =
      person.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.profession.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProfession = !professionFilter || person.profession === professionFilter;
    return matchesSearch && matchesProfession;
  });

  const confirmDelete = (person) => {
    setPersonToDelete(person);
    setIsDeleteModalOpen(true);
  };

  const handleDeletePerson = async () => {
    if (!personToDelete) return;
    try {
      await deletePerson(personToDelete.id); 
      // Перезавантажити поточну сторінку
      fetchPeople(currentPage);
      setAlertConfig({ isOpen: true, title: "Success", message: "Person deleted successfully." });
    } catch (err) {
      setAlertConfig({ isOpen: true, title: "Error", message: `Error: ${err.message || 'Failed to delete'}` });
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-lg text-blue-400"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pt-8 pb-8"
      style={{ backgroundColor: "#1a1a1a" }}
    >
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

        {/* Search + Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-[#d6cecf] mb-2 text-xs font-extrabold uppercase tracking-[0.12em]">
              Search by Name or Profession
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              onChange={(e) => setProfessionFilter(e.target.value)}
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
              {uniqueProfessions.map(profession => (
                <option
                  key={profession}
                  value={profession}
                  className="bg-[#1a1a1a]"
                >
                  {profession.charAt(0).toUpperCase() + profession.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-[#6700b7]">
              {totalPeople}
            </div>
            <div className="text-[#c9c7c7] text-sm">Total People</div>
          </div>

          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-[#b75100]">
              {people.filter(p => p.profession === 'actor').length}
            </div>
            <div className="text-[#c9c7c7] text-sm">Actors</div>
          </div>

          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-purple-400">
              {people.filter(p => p.profession === 'director').length}
            </div>
            <div className="text-[#c9c7c7] text-sm">Directors</div>
          </div>

          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-yellow-400">
              {people.filter(p => p.profession === 'producer').length}
            </div>
            <div className="text-[#c9c7c7] text-sm">Producers</div>
          </div>
        </div>

        {/* Table / Empty state */}
        {filteredPeople.length > 0 ? (
          <>
            <div className="bg-[#1a1a1a] border-[4px] border-black rounded-[15px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-[#052288] border-b border-black">
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
                    {filteredPeople.map(person => (
                      <tr
                        key={person.id}
                        className="border-b border-black bg-[#1a1818]"
                      >
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Пагінація / лічильник фільтрів */}
            {(searchTerm || professionFilter) ? (
              <div className="mt-4 text-center text-[#c9c7c7] text-sm">
                Showing {filteredPeople.length} filtered results
              </div>
            ) : (
              totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalPeople}
                    pageSize={PEOPLE_PER_PAGE}
                    onPageChange={handlePageChange}
                    totalPages={totalPages}
                  />
                </div>
              )
            )}
          </>
        ) : (
          <div className="bg-[#1a1a1a] border-[3px] border-black rounded-[15px] p-8 text-center mt-6">
            <div className="text-[#c9c7c7] text-lg mb-4">
              {searchTerm || professionFilter
                ? "No people found matching your criteria."
                : "No people available."
              }
            </div>
            {(searchTerm || professionFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setProfessionFilter('');
                }}
                className="
                  text-black 
                  bg-[#c9c7c7] 
                  border-[3px] border-black 
                  px-4 py-2 
                  rounded-[12px] 
                  font-extrabold 
                  uppercase 
                  text-xs
                  hover:bg-white
                  transition-colors
                "
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>


{/* POPCORN DECORATION */}
      <img
        src="/pictures_elements/popcorn_gray.png"
        className="popcorn fixed right-6 bottom-6 w-[70px] z-20"
        alt="Popcorn"

        onClick={(e) => {
         e.target.classList.remove("active");      // скинути попередню анімацію
         void e.target.offsetWidth;                // магічний трюк для рестарту
         e.target.classList.add("active");         // увімкнути знову
       }}
      />


      {/* Модалки */}
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
