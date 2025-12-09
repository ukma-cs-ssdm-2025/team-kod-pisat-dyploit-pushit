import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getPaginatedUsers,
  deleteUser,
  getUsersStats,
  getUserRoles,
  sendFriendRequest,
  removeFriend,
  acceptFriendRequest,
  getIncomingFriendRequests,
  getOutgoingFriendRequests // Переконайтесь, що додали це в api.js
} from '../api';
import { useAuth } from '../hooks/useAuth';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Avatar from '../components/Avatar';
import Pagination from '../components/Pagination';

export default function UserList() {
  const { user: currentUser, isAdmin, isModerator } = useAuth();

  const [users, setUsers] = useState([]);

  // server stats
  const [stats, setStats] = useState({
    total: 0,
    users: 0,
    moderators: 0,
    admins: 0,
  });

  // list of roles for filter
  const [allRoles, setAllRoles] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // role filter
  const [roleFilter, setRoleFilter] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  
  // --- FRIENDSHIP LOCAL STATE (Instant UI Updates) ---
  const [myFriendIds, setMyFriendIds] = useState([]);      // IDs of accepted friends
  const [incomingIds, setIncomingIds] = useState([]);      // IDs of users who sent ME a request
  const [outgoingIds, setOutgoingIds] = useState([]);      // IDs of users I sent a request TO
  const [actionLoadingIds, setActionLoadingIds] = useState(new Set()); // IDs currently processing

  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const USERS_PER_PAGE = 15;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
  });

  // 1. Initial Data Fetch for Friend Statuses
  useEffect(() => {
    if (currentUser) {
      // Load confirmed friends from auth context
      const initialFriends = currentUser.friends?.map(f => f.id) || [];
      setMyFriendIds(initialFriends);

      const fetchStatuses = async () => {
        try {
          // Load Incoming Requests
          const inData = await getIncomingFriendRequests(currentUser.id);
          setIncomingIds(inData.incoming?.map(r => r.requester_id) || []);

          // Load Outgoing Requests (Check if function exists first to be safe)
          if (typeof getOutgoingFriendRequests === 'function') {
            const outData = await getOutgoingFriendRequests(currentUser.id);
            setOutgoingIds(outData.outgoing?.map(r => r.receiver_id) || []);
          }
        } catch (err) {
          console.error("Error loading friend statuses:", err);
        }
      };

      fetchStatuses();
    }
  }, [currentUser]);

  // debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // fetch users logic
  const fetchUsersData = useCallback(
    async (page = 1, search = '', role = '') => {
      setIsLoading(true);
      try {
        const [statsData, rolesData, usersData] = await Promise.all([
          getUsersStats(),
          getUserRoles(),
          getPaginatedUsers(page, USERS_PER_PAGE, search, role),
        ]);

        setStats(statsData);
        setAllRoles(rolesData);
        setUsers(usersData.users || usersData);
        setTotalUsers(usersData.total || 0);
        setTotalPages(usersData.totalPages || 1);
      } catch (err) {
        console.error('Error loading users:', err);
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [USERS_PER_PAGE]
  );

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
      setAlertConfig({
        isOpen: true,
        title: 'Success',
        message: 'User banned!',
      });
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: 'Error',
        message: `Error: ${err.message || 'Failed to delete'}`,
      });
    }
  };

  // --- NEW HANDLER FOR INSTANT UPDATES ---
  const handleFriendAction = async (targetUserId, action) => {
    // Set loading state for this specific user
    setActionLoadingIds(prev => new Set(prev).add(targetUserId));

    try {
      if (action === 'add') {
        await sendFriendRequest(targetUserId);
        
        // Instant UI Update: Add to outgoing, it becomes "Request Sent"
        setOutgoingIds(prev => [...prev, targetUserId]);
        // Optional Toast
        // setAlertConfig({ isOpen: true, title: 'Success', message: 'Friend request sent!' });

      } else if (action === 'remove') {
        // Works for: Unfriend, Cancel Request, Decline Request
        await removeFriend(targetUserId);
        
        // Instant UI Update: Remove from all lists
        setMyFriendIds(prev => prev.filter(id => id !== targetUserId));
        setIncomingIds(prev => prev.filter(id => id !== targetUserId));
        setOutgoingIds(prev => prev.filter(id => id !== targetUserId));

      } else if (action === 'accept') {
        await acceptFriendRequest(targetUserId);
        
        // Instant UI Update: Remove from incoming, Add to friends
        setIncomingIds(prev => prev.filter(id => id !== targetUserId));
        setMyFriendIds(prev => [...prev, targetUserId]);
        setAlertConfig({ isOpen: true, title: 'Success', message: 'Friend request accepted!' });
      }
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: 'Error',
        message: `Error: ${err.message || 'Action failed'}`,
      });
    } finally {
      // Remove loading state
      setActionLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  // Helper to decide what button to show
  const getRelationState = (userId) => {
    if (!currentUser || userId === currentUser.id) return 'self';
    if (myFriendIds.includes(userId)) return 'friend';
    if (incomingIds.includes(userId)) return 'incoming'; // They sent to me
    if (outgoingIds.includes(userId)) return 'outgoing'; // I sent to them
    return 'none';
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
    return (
      <div
        className="min-h-screen flex items-center justify-center text-lg text-blue-400"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        <div className="text-lg font-extrabold tracking-[0.18em] uppercase text-[#d6cecf]">
          Loading users...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-8" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="w-full max-w-6xl mx-auto bg-[#606aa2] rounded-[15px] p-8 ">
        <h1 className="text-3xl font-bold text-[#d6cecf] mb-6 uppercase tracking-[0.12em]">
          Community Users
        </h1>

        {/* SEARCH + ROLE FILTER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Search */}
          <div>
            <label className="block text-[#d6cecf] mb-2 text-sm font-extrabold uppercase tracking-[0.1em]">
              Search users
            </label>
            <input
              type="text"
              placeholder="Search by username, nickname, email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-[#1a1a1a] text-[#d6cecf] border-[3px] border-black rounded-[12px] px-4 py-3 focus:outline-none"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-[#d6cecf] mb-2 text-sm font-extrabold uppercase tracking-[0.1em]">
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={handleRoleChange}
              className="w-full bg-[#1a1a1a] text-[#d6cecf] border-[3px] border-black rounded-[12px] px-4 py-3 focus:outline-none cursor-pointer"
            >
              <option value="">All Roles</option>
              {allRoles.map((role) => (
                <option key={role} value={role} className="bg-[#1a1a1a]">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* STATS BLOCKS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-[#b70000]">{stats.total}</div>
            <div className="text-[#c9c7c7] text-sm">Total Users</div>
          </div>

          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-purple-400">{stats.users}</div>
            <div className="text-[#c9c7c7] text-sm">Regular Users</div>
          </div>

          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-yellow-400">{stats.moderators}</div>
            <div className="text-[#c9c7c7] text-sm">Moderators</div>
          </div>

          <div className="bg-[#1a1a1a] border-[3px] border-black p-4 rounded-[12px] text-center">
            <div className="text-2xl font-extrabold text-red-400">{stats.admins}</div>
            <div className="text-[#c9c7c7] text-sm">Admins</div>
          </div>
        </div>

        {/* FILTER RESULT INFO */}
        {isFiltered && (
          <div className="mb-6 p-4 bg-[#1a1a1a] border-[3px] border-black rounded-[12px] flex justify-between items-center">
            <div className="text-[#c9c7c7] text-sm tracking-wide">
              Showing {users.length} of {totalUsers} results
              {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
              {roleFilter && ` in role "${roleFilter}"`}
            </div>

            <button
              onClick={resetFilters}
              className="text-[#d6cecf] hover:text-white underline text-sm font-extrabold uppercase tracking-[0.1em]"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* TABLE */}
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
                {users.length > 0 ? (
                  users.map((user) => {
                    const isMyOwnProfile = currentUser?.id === user.id;
                    const relation = getRelationState(user.id);
                    const isLoadingAction = actionLoadingIds.has(user.id);

                    const canDelete =
                      !isMyOwnProfile &&
                      ((isAdmin && user.role !== 'admin') ||
                        (isModerator && !isAdmin && user.role === 'user'));

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-black bg-[#1a1818]"
                      >
                        <td className="p-4">
                          <Link
                            to={`/user/${user.username}`}
                            className="flex items-center gap-3"
                          >
                            <Avatar
                              src={user.avatar_url}
                              alt={user.nickname}
                              size="sm"
                              className="rounded-full"
                            />
                            <span className="text-[#d6cecf] font-extrabold hover:text-white transition">
                              {user.nickname}
                            </span>
                          </Link>
                        </td>

                        <td className="p-4 text-[#c9c7c7]">{user.username}</td>
                        <td className="p-4 text-[#c9c7c7]">{user.email}</td>

                        {/* Role Badge */}
                        <td className="p-4">
                          <span
                            className={`
                              px-3 py-1 rounded-[6px]
                              text-xs uppercase font-extrabold tracking-[0.08em]
                              border-[2px] border-black
                              ${
                                user.role === 'admin'
                                  ? 'bg-red-900 text-red-300'
                                  : user.role === 'moderator'
                                  ? 'bg-yellow-900 text-yellow-300'
                                  : 'bg-[#c186e4] text-[#d6cecf]'
                              }
                            `}
                          >
                            {user.role}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex gap-2 items-center">
                            
                            {!isMyOwnProfile && (
                              <>
                                {/* 1. NOT FRIENDS -> ADD */}
                                {relation === 'none' && (
                                  <button
                                    onClick={() => handleFriendAction(user.id, 'add')}
                                    disabled={isLoadingAction}
                                    className="bg-[#c9c7c7] text-black border-[3px] border-black px-3 py-1 rounded-[10px] font-extrabold uppercase text-xs cursor-pointer hover:bg-white"
                                  >
                                    {isLoadingAction ? '...' : 'Add Friend'}
                                  </button>
                                )}

                                {/* 2. ALREADY FRIENDS -> UNFRIEND */}
                                {relation === 'friend' && (
                                  <button
                                    onClick={(e) => {
                                      const btn = e.currentTarget;
                                      btn.style.transform = "scale(0.85)";
                                      setTimeout(() => btn.style.transform = "scale(1)", 150);
                                      handleFriendAction(user.id, "remove");
                                    }}
                                    disabled={isLoadingAction}
                                    className="bg-black text-[#d6cecf] font-extrabold uppercase text-xs md:text-sm tracking-[0.18em] rounded-[10px] px-3 py-1 hover:bg-[#830707] transition-colors cursor-pointer transition-transform hover:scale-[0.95]"
                                  >
                                    {isLoadingAction ? "..." : "Unfriend"}
                                  </button>
                                )}

                                {/* 3. OUTGOING REQUEST -> CANCEL */}
                                {relation === 'outgoing' && (
                                  <div className="flex items-center gap-2">
                                     <span className="text-[#777] text-[10px] uppercase font-bold tracking-wider italic border border-[#444] rounded px-1">
                                       Request Sent
                                     </span>
                                     <button 
                                      onClick={() => handleFriendAction(user.id, 'remove')}
                                      disabled={isLoadingAction}
                                      className="text-red-500 hover:text-red-400 font-bold text-xs"
                                      title="Cancel request"
                                     >
                                       ✕
                                     </button>
                                  </div>
                                )}

                                {/* 4. INCOMING REQUEST -> ACCEPT/DECLINE */}
                                {relation === 'incoming' && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleFriendAction(user.id, 'accept')}
                                      disabled={isLoadingAction}
                                      className="bg-green-700 text-white border-[2px] border-black px-2 py-1 rounded-[8px] font-bold uppercase text-[10px] hover:bg-green-600"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleFriendAction(user.id, 'remove')} // Decline
                                      disabled={isLoadingAction}
                                      className="bg-[#333] text-white border-[2px] border-black px-2 py-1 rounded-[8px] font-bold uppercase text-[10px] hover:bg-red-900"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                )}
                              </>
                            )}

                            {isMyOwnProfile && (
                              <span className="text-[#777] text-sm italic">
                                (You)
                              </span>
                            )}

                            {/* BAN */}
                            {canDelete && (
                              <button
                                onClick={(e) => {
                                  const btn = e.currentTarget;
                                  btn.style.transition = "transform 0.15s ease";
                                  btn.style.transform = "scale(0.85)";
                                  setTimeout(() => {
                                    btn.style.transform = "scale(1)";
                                  }, 150);
                                  confirmDelete(user);
                                }}
                                className="
                                  bg-black
                                  text-[#d6cecf]
                                  font-extrabold
                                  uppercase
                                  text-xs md:text-sm
                                  tracking-[0.18em]
                                  rounded-[10px]
                                  px-3 py-1
                                  
                                  hover:bg-[#830707]
                                  transition-colors
                                  cursor-pointer
                                  transition-transform
                                  hover:scale-[0.95]
                                  ml-2
                                "
                              >
                                Ban
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-8 text-center text-[#c9c7c7]"
                    >
                      {isFiltered
                        ? 'No users found.'
                        : 'No users available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
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
        onConfirm={handleDeleteUser}
        title="Ban User?"
        message={`Are you sure you want to ban and delete user "${userToDelete?.username}"? This action cannot be undone.`}
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