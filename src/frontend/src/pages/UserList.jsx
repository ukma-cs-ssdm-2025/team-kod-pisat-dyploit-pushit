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
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400">Завантаження...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-8">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="section-title">
          Керування користувачами
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
                      {canDelete ? (
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
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