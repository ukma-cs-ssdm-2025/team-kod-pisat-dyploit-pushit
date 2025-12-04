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
    return <div className="min-h-screen flex items-center justify-center text-lg text-blue-400" style={{ backgroundColor: "#1a1a1a" }}>Loading...</div>;
  }

  return (
    <div className="min-h-screen pt-8 pb-8" style={{ backgroundColor: "#1a1a1a" }}>
      <div className="w-full max-w-6xl mx-auto bg-[#052288] rounded-[15px] p-8 ">
        
        <h1 className="text-3xl font-bold text-[#d6cecf] mb-6 uppercase tracking-[0.12em]">
          Community Users
        </h1>

        <input
          type="text"
          placeholder="Search by username, nickname, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1a1a1a] text-[#d6cecf] border-[3px] border-black rounded-[12px] px-4 py-3 mb-8 focus:outline-none"
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-[#b70000]">{totalUsers}</div>
            <div className="text-[#c9c7c7] text-sm">Total Users</div>
          </div>

          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-purple-400">
              {users.filter(u => u.role === 'user').length}
            </div>
            <div className="text-[#c9c7c7] text-sm">Regular Users</div>
          </div>

          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-yellow-400">
              {users.filter(u => u.role === 'moderator').length}
            </div>
            <div className="text-[#c9c7c7] text-sm">Moderators</div>
          </div>

          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-red-400">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-[#c9c7c7] text-sm">Admins</div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border-[4px] border-black rounded-[15px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-[#292929] border-b border-black">
                <tr>
                  <th className="p-4 text-[#d6cecf]">User</th>
                  <th className="p-4 text-[#d6cecf]">Username</th>
                  <th className="p-4 text-[#d6cecf]">Email</th>
                  <th className="p-4 text-[#d6cecf]">Role</th>
                  <th className="p-4 text-[#d6cecf]">Actions</th>
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
                      <tr key={user.id} className="border-b border-black bg-[#1a1818]">
                        <td className="p-4">
                          <Link to={`/user/${user.username}`} className="flex items-center gap-3">
                            <Avatar src={user.avatar_url} alt={user.nickname} size="sm" />
                            <span className="text-[#d6cecf] font-extrabold hover:text-white transition">{user.nickname}</span>
                          </Link>
                        </td>

                        <td className="p-4 text-[#c9c7c7]">{user.username}</td>
                        <td className="p-4 text-[#c9c7c7]">{user.email}</td>

                       <td className="p-4">
  <span
    className={`
      px-3 py-1 rounded-[6px]
      text-xs uppercase font-extrabold tracking-[0.08em]
      border-[2px] border-black
      ${
        user.role === 'admin'
          ? "bg-red-900 text-red-300"
          : user.role === 'moderator'
          ? "bg-yellow-900 text-yellow-300"
          : user.role === 'user'
          ? "bg-[#c186e4] text-[#d6cecf]"
          : ""
      }
    `}
  >
    {user.role}
  </span>
</td>


                        <td className="p-4">
                          <div className="flex gap-2">
                            {!isMyOwnProfile && friendStatus === 'not_friend' && (
                              <button 
                                onClick={() => handleFriendAction(user.id, 'add')}
                                disabled={isLoadingAction}
                                className="bg-[#c9c7c7] text-black border-[3px] border-black px-3 py-1 rounded-[10px] font-extrabold uppercase text-xs"
                              >
                                {isLoadingAction ? '...' : 'Add'}
                              </button>
                            )}

                            {!isMyOwnProfile && friendStatus === 'friend' && (
                              <button 
                                onClick={() => handleFriendAction(user.id, 'remove')}
                                disabled={isLoadingAction}
                                className="bg-[#c9c7c7] text-black border-[3px] border-black px-3 py-1 rounded-[10px] font-extrabold uppercase text-xs"
                              >
                                {isLoadingAction ? '...' : 'Unfriend'}
                              </button>
                            )}

                            {isMyOwnProfile && (
                              <span className="text-[#777] text-sm italic">(You)</span>
                            )}

                            {canDelete && (
                              <button 
                                onClick={() => confirmDelete(user)}
                                className="bg-[#1a1818] text-[#d6cecf] border-[3px] border-black px-3 py-1 rounded-[10px] font-extrabold uppercase text-xs"
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
                    <td colSpan="5" className="p-8 text-center text-[#c9c7c7]">
                      {searchTerm ? 'No users found.' : 'No users available.'}
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
          <div className="mt-4 text-center text-[#c9c7c7] text-sm">
            Showing {filteredUsers.length} filtered results
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
