import { useEffect, useState } from "react";
import { getUserData } from "../api";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      globalThis.location.href = "/login";
      return;
    }
    getUserData(token).then(setUser);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    globalThis.location.href = "/login";
  };

  if (!user) return <div className="text-center mt-10 text-lg">Завантаження...</div>;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="bg-white shadow-md p-6 rounded w-96 text-center">
        <h1 className="text-2xl font-bold mb-4">Вітаємо, {user.nickname}!</h1>
        <p>Роль: {user.role}</p>
        <p>Email: {user.email}</p>
        <button onClick={logout} className="mt-4 bg-red-500 text-white p-2 rounded w-full hover:bg-red-600">
          Вийти
        </button>
      </div>
    </div>
  );
}
