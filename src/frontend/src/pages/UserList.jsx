import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPaginatedUsers, deleteUser, getUsersStats, getUserRoles, sendFriendRequest, removeFriend } from '../api';
import { useAuth } from '../hooks/useAuth'; 
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Avatar from '../components/Avatar';
import Pagination from '../components/Pagination';

export default function UserList() {
  const { user: currentUser, isAdmin, isModerator } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    users: 0,
    moderators: 0,
    admins: 0
  });
  const [allRoles, setAllRoles] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [friendActions, setFriendActions] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const USERS_PER_PAGE = 15;
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '' });

  // Debounce для пошуку
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  const fetchUsersData = useCallback(async (page = 1, search = '', role = '') => {
    setIsLoading(true);
    try {
      const [statsData, rolesData, usersData] = await Promise.all([
        getUsersStats(),
        getUserRoles(),
        getPaginatedUsers(page, USERS_PER_PAGE, search, role)
      ]);

      setStats(statsData);
      setAllRoles(rolesData);
      setUsers(usersData.users || usersData);
      setTotalUsers(usersData.total || 0);
      setTotalPages(usersData.totalPages || 1);
    } catch (err) {
      console.error("Error loading users:", err);
      setUsers([]);
      setTotalUsers(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [USERS_PER_PAGE]);

  useEffect(() => {
    fetchUsersData(currentPage, debouncedSearchTerm, roleFilter);
  }, [currentPage, debouncedSearchTerm, roleFilter, fetchUsersData]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id); 
      fetchUsersData(currentPage, debouncedSearchTerm, roleFilter);
      setAlertConfig({ isOpen: true, title: "Success", message: "User banned!" });
    } catch (err) {
      setAlertConfig({ isOpen: true, title: "Error", message: `Error: ${err.message || 'Failed to delete'}` });
    }
  };

  const handleFriendAction = async (userId, action) => {
    setFriendActions(prev => ({ ...prev, [userId]: 'loading' }));
    
    try {
      if (action === 'add') {
        await sendFriendRequest(userId);
        setAlertConfig({ isOpen: true, title: "Success", message: "Friend request sent!" });
      } else if (action === 'remove') {
        await removeFriend(userId);
        setAlertConfig({ isOpen: true, title: "Success", message: "Friend removed!" });
      }
    } catch (err) {
      setAlertConfig({ isOpen: true, title: "Error", message: `Error: ${err.message || 'Action failed'}` });
    } finally {
      setFriendActions(prev => ({ ...prev, [userId]: null }));
    }
  };

  const getFriendStatus = (user) => {
    if (!currentUser || user.id === currentUser.id) return 'self';
    
    if (currentUser.friends && currentUser.friends.some(friend => friend.id === user.id)) {
      return 'friend';
    }
    
    return 'not_friend';
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setCurrentPage(1);
  };

  const isFiltered = debouncedSearchTerm || roleFilter;

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400 cursor-wait">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-8 pb-8">
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-white mb-6 border-l-4 border-blue-500 pl-4">
          Community Users
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-blue-400 mb-2 font-medium cursor-default">Search by username, nickname, email...</label>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors cursor-text shadow-lg"
            />
          </div>
          <div>
            <label className="block text-blue-400 mb-2 font-medium cursor-default">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={handleRoleChange}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
            >
              <option value="">All Roles</option>
              {allRoles.map(role => (
                <option key={role} value={role} className="bg-gray-800">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-400 cursor-default">{stats.total}</div>
            <div className="text-gray-300 text-sm cursor-default">Total Users</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg text-center shadow-lg">
            <div className="text-2xl font-bold text-green-400 cursor-default">
              {stats.users}
            </div>
            <div className="text-gray-300 text-sm cursor-default">Regular Users</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg text-center shadow-lg">
            <div className="text-2xl font-bold text-yellow-400 cursor-default">
              {stats.moderators}
            </div>
            <div className="text-gray-300 text-sm cursor-default">Moderators</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg text-center shadow-lg">
            <div className="text-2xl font-bold text-red-400 cursor-default">
              {stats.admins}
            </div>
            <div className="text-gray-300 text-sm cursor-default">Admins</div>
          </div>
        </div>

        {isFiltered && (
          <div className="mb-6 p-4 bg-gray-800/30 border border-gray-700 rounded-lg flex justify-between items-center">
            <div className="text-gray-300 cursor-default">
              Showing {users.length} of {totalUsers} results
              {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
              {roleFilter && ` in ${roleFilter}`}
            </div>
            <button 
              onClick={resetFilters}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 px-3 py-1 rounded transition-colors text-sm font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="p-4 text-blue-400 font-medium cursor-default">User</th>
                  <th className="p-4 text-blue-400 font-medium cursor-default">Username</th>
                  <th className="p-4 text-blue-400 font-medium cursor-default">Email</th>
                  <th className="p-4 text-blue-400 font-medium cursor-default">Role</th>
                  <th className="p-4 text-blue-400 font-medium cursor-default">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map(user => {
                    const isMyOwnProfile = currentUser?.id === user.id;
                    const friendStatus = getFriendStatus(user);
                    const isLoadingAction = friendActions[user.id] === 'loading';
                    
                    const canDelete = !isMyOwnProfile && (
                      (isAdmin && user.role !== 'admin') || 
                      (isModerator && !isAdmin && user.role === 'user')
                    );

                    return (
                      <tr key={user.id} className="border-b border-gray-700/50 last:border-b-0 hover:bg-gray-700/30 transition-colors">
                        <td className="p-4">
                          <Link to={`/user/${user.username}`} className="flex items-center gap-3 group cursor-pointer">
                            <Avatar src={user.avatar_url} alt={user.nickname} size="sm" />
                            <span className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                              {user.nickname}
                            </span>
                          </Link>
                        </td>
                        <td className="p-4 text-gray-300 cursor-default">{user.username}</td>
                        <td className="p-4 text-gray-300 cursor-default">{user.email}</td>
                        <td className="p-4">
                           <span className={`px-2 py-1 rounded text-xs uppercase font-bold cursor-default ${
                              user.role === 'admin' ? 'bg-red-900/50 text-red-400' :
                              user.role === 'moderator' ? 'bg-yellow-900/50 text-yellow-400' :
                              'bg-blue-900/50 text-blue-400'
                           }`}>
                             {user.role}
                           </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {!isMyOwnProfile && friendStatus === 'not_friend' && (
                              <button 
                                onClick={() => handleFriendAction(user.id, 'add')}
                                disabled={isLoadingAction}
                                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50 transition-colors cursor-pointer"
                              >
                                {isLoadingAction ? '...' : 'Add Friend'}
                              </button>
                            )}
                            
                            {!isMyOwnProfile && friendStatus === 'friend' && (
                              <button 
                                onClick={() => handleFriendAction(user.id, 'remove')}
                                disabled={isLoadingAction}
                                className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50 transition-colors cursor-pointer"
                              >
                                {isLoadingAction ? '...' : 'Unfriend'}
                              </button>
                            )}
                            
                            {isMyOwnProfile && (
                              <span className="text-gray-500 text-sm italic cursor-default">(You)</span>
                            )}

                            {canDelete && (
                              <button 
                                onClick={() => confirmDelete(user)}
                                className="bg-red-900/80 hover:bg-red-800 text-red-200 px-3 py-1 rounded text-sm font-medium transition-colors ml-2 cursor-pointer"
                              >
                                Ban
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-400 cursor-default">
                      {isFiltered ? 'No users found matching your search.' : 'No users available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <Pagination 
            currentPage={currentPage}
            totalItems={totalUsers}
            pageSize={USERS_PER_PAGE}
            onPageChange={handlePageChange}
            totalPages={totalPages}
          />
        </div>
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        title="Ban User?"
        message={`Are you sure you want to ban and delete user "${userToDelete?.username}"? This action cannot be undone.`}
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