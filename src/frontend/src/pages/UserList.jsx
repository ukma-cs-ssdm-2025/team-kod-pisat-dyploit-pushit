import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers, deleteUser } from '../api';
import { useAuth } from '../hooks/useAuth'; 

export default function UserList() {
  const { user: currentUser, isAdmin, isModerator } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-center pt-32 text-lg text-amber-400">Завантаження...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 pt-24 pb-8">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
          Керування користувачами
        </h1>

        <input
          type="text"
          placeholder="Шукати за username, нікнеймом, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 mb-8 bg-transparent border-2 border-amber-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-400"
        />

        <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl border border-amber-500/20 backdrop-blur overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-amber-500/30">
              <tr>
                <th className="p-4 text-amber-400">Нікнейм</th>
                <th className="p-4 text-amber-400">Username</th>
                <th className="p-4 text-amber-400">Email</th>
                <th className="p-4 text-amber-400">Роль</th>
                <th className="p-4 text-amber-400">Дії</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const isMyOwnProfile = currentUser?.id === user.id;
                
                const canDelete = !isMyOwnProfile && (
                  (isAdmin && user.role !== 'admin') || 
                  (isModerator && !isAdmin && user.role === 'user')
                );

                return (
                  <tr key={user.id} className="border-b border-purple-800/50 last:border-b-0 hover:bg-purple-800/30 transition-colors">
                    <td className="p-4">
                      <Link to={`/user/${user.username}`} className="text-white font-semibold hover:underline">
                        {user.nickname}
                      </Link>
                    </td>
                    <td className="p-4 text-gray-300">{user.username}</td>
                    <td className="p-4 text-gray-300">{user.email}</td>
                    <td className="p-4 text-gray-300">{user.role}</td>
                    <td className="p-4">
                      {canDelete ? (
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="text-red-500 hover:text-red-400 transition-colors text-sm font-medium"
                        >
                          Видалити
                        </button>
                      ) : (
                        <span className="text-gray-600 text-sm">{isMyOwnProfile ? "(Це ви)" : "—"}</span>
                      )}
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