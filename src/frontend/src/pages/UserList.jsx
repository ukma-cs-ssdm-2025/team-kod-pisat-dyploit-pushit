import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers, deleteUser, sendFriendRequest, removeFriend } from '../api';
import { useAuth } from '../hooks/useAuth'; 
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Avatar from '../components/Avatar';
import Pagination from '../components/Pagination';

export default function UserList() {
  const { user: currentUser, isAdmin, isModerator } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [friendActions, setFriendActions] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const USERS_PER_PAGE = 15;
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '' });

  // Функція завантаження користувачів з пагінацією
  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await getAllUsers(`?page=${page}&limit=${USERS_PER_PAGE}`);
      setUsers(data.users || data);
      setTotalUsers(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id); 
      // Перезавантажити поточну сторінку після видалення
      fetchUsers(currentPage);
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

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400 cursor-wait">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-8 pb-8">
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-white mb-6 border-l-4 border-blue-500 pl-4">
          Community Users
        </h1>

        <input
          type="text"
          placeholder="Search by username, nickname, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-3 mb-8 focus:outline-none focus:border-blue-500 transition-colors cursor-text shadow-lg"
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400 cursor-default">{totalUsers}</div>
            <div className="text-gray-300 text-sm cursor-default">Total Users</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400 cursor-default">
              {users.filter(u => u.role === 'user').length}
            </div>
            <div className="text-gray-300 text-sm cursor-default">Regular Users</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-400 cursor-default">
              {users.filter(u => u.role === 'moderator').length}
            </div>
            <div className="text-gray-300 text-sm cursor-default">Moderators</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-400 cursor-default">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-gray-300 text-sm cursor-default">Admins</div>
          </div>
        </div>

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
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => {
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
                      {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!searchTerm && totalPages > 1 && (
          <div className="mt-8">
            <Pagination 
              currentPage={currentPage}
              totalItems={totalUsers}
              pageSize={USERS_PER_PAGE}
              onPageChange={handlePageChange}
              totalPages={totalPages}
            />
          </div>
        )}

        {searchTerm && filteredUsers.length > 0 && (
          <div className="mt-4 text-center text-gray-400 text-sm cursor-default">
            Showing {filteredUsers.length} filtered results
          </div>
        )}
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