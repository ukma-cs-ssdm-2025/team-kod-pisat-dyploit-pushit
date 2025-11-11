import { useState } from "react";
import { loginUser } from "../api";
import { Link } from "react-router-dom"; // 4. Імпортуємо Link

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await loginUser(form);
    if (res.token) {
      localStorage.setItem("token", res.token);
      // 3. Змінюємо редирект на /profile
      window.location.href = "/profile";
    } else {
      setMessage(res.message || "Помилка входу");
    }
  };

  return (
    // 5. Додаємо відступ для Header (pt-20) і min-h-screen
    <div className="flex flex-col items-center justify-center min-h-screen pt-20">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg p-8 rounded-lg w-96" // 5. Збільшено padding
      >
        <h1 className="text-2xl mb-6 text-center font-bold">Вхід</h1>

        <input
          type="text"
          name="username"
          placeholder="Username"
          className="border p-2 w-full mb-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Пароль"
          className="border p-2 w-full mb-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          onChange={handleChange}
          required
        />

        <button className="bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600 transition-colors">
          Увійти
        </button>

        {/* 5. Покращено відображення помилки */}
        {message && <p className="text-center mt-4 text-sm text-red-500">{message}</p>}

        {/* 4. Посилання на реєстрацію */}
        <p className="text-center mt-4 text-sm text-gray-600">
          Немає акаунту?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Зареєструватися
          </Link>
        </p>
      </form>
    </div>
  );
}