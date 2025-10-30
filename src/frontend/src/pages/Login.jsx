import { useState } from "react";
import { loginUser } from "../api";

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
      window.location.href = "/dashboard";
    } else {
      setMessage(res.message || "Помилка входу");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md p-6 rounded w-96"
      >
        <h1 className="text-2xl mb-4 text-center font-bold">Вхід</h1>

        <input
          type="text"
          name="username"
          placeholder="Username"
          className="border p-2 w-full mb-3 rounded"
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Пароль"
          className="border p-2 w-full mb-3 rounded"
          onChange={handleChange}
          required
        />

        <button className="bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600">
          Увійти
        </button>

        <p className="text-center mt-2 text-sm">{message}</p>
      </form>
    </div>
  );
}
