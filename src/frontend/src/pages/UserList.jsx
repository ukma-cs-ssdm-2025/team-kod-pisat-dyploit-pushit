import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers, deleteUser, sendFriendRequest, removeFriend } from '../api';
import { useAuth } from '../hooks/useAuth'; 

export default function UserList() {
  const { user: currentUser, isAdmin, isModerator } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [friendActions, setFriendActions] = useState({});

  useEffect(() => {
    getAllUsers()
      .then(data => {
        setUsers(data);
      })
      .catch(err => {
        console.error("Помилка завантаження користувачів:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Ви впевнені, що хочете видалити (забанити) ${username}?`)) {
      try {
        await deleteUser(userId); 
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      } catch (err) {
        alert(`Помилка: ${err.message || 'Не вдалося видалити'}`);
      }
    }
  };

  const handleFriendAction = async (userId, action) => {
    setFriendActions(prev => ({ ...prev, [userId]: 'loading' }));
    
    try {
      if (action === 'add') {
        await sendFriendRequest(userId);
        alert('Запит на дружбу надіслано!');
      } else if (action === 'remove') {
        await removeFriend(userId);
        alert('Дружбу видалено!');
      }
    } catch (err) {
      alert(`Помилка: ${err.message || 'Не вдалося виконати дію'}`);
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

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400">Завантаження...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-8">
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="section-title">
          Користувачі
        </h1>

        <input
          type="text"
          placeholder="Шукати за username, нікнеймом, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input mb-8"
        />

        <div className="card overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-4 text-blue-400 font-medium">Нікнейм</th>
                <th className="p-4 text-blue-400 font-medium">Username</th>
                <th className="p-4 text-blue-400 font-medium">Email</th>
                <th className="p-4 text-blue-400 font-medium">Роль</th>
                <th className="p-4 text-blue-400 font-medium">Дії</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
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
                      <Link to={`/user/${user.username}`} className="text-white font-semibold hover:underline">
                        {user.nickname}
                      </Link>
                    </td>
                    <td className="p-4 text-gray-300">{user.username}</td>
                    <td className="p-4 text-gray-300">{user.email}</td>
                    <td className="p-4 text-gray-300">{user.role}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {!isMyOwnProfile && friendStatus === 'not_friend' && (
                          <button 
                            onClick={() => handleFriendAction(user.id, 'add')}
                            disabled={isLoadingAction}
                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50 transition-colors"
                          >
                            {isLoadingAction ? '...' : 'Запросити в друзі'}
                          </button>
                        )}
                        
                        {!isMyOwnProfile && friendStatus === 'friend' && (
                          <button 
                            onClick={() => handleFriendAction(user.id, 'remove')}
                            disabled={isLoadingAction}
                            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50 transition-colors"
                          >
                            {isLoadingAction ? '...' : 'Видалити з друзів'}
                          </button>
                        )}
                        
                        {isMyOwnProfile && (
                          <span className="text-gray-600 text-sm">(Це ви)</span>
                        )}

                        {canDelete && (
                          <button 
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm font-medium transition-colors ml-2"
                          >
                            Видалити (забанити)
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
