import { useState } from "react";
import { registerUser } from "../api";
import { Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    nickname: "",
    role: "user",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await registerUser(form);
    if (res.user) {
        setMessage("Користувача створено! Тепер ви можете увійти.");
    } else {
        setMessage(res.message || "Помилка реєстрації.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-20 pb-8">
      <form onSubmit={handleSubmit} className="bg-white shadow-lg p-8 rounded-lg w-96">
        <h1 className="text-2xl mb-6 text-center font-bold">Реєстрація</h1>

        {["username", "email", "password", "nickname"].map((field) => (
          <input
            key={field}
            type={field === "password" ? "password" : "text"}
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)} 
            className="border p-2 w-full mb-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={handleChange}
            required
          />
        ))}

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="border p-2 w-full mb-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          required
        >
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>

        <button className="bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600 transition-colors">
          Зареєструватися
        </button>

        {message && <p className="text-center mt-4 text-sm text-gray-700">{message}</p>}

        <p className="text-center mt-4 text-sm text-gray-600">
          Вже є акаунт?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Увійти
          </Link>
        </p>
      </form>
    </div>
  );
}