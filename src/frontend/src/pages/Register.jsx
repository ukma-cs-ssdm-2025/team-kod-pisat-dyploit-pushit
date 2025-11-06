import { useState } from "react";
import { registerUser } from "../api";

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
    setMessage(res.message || "Користувача створено!");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white shadow-md p-6 rounded w-96">
        <h1 className="text-2xl mb-4 text-center font-bold">Реєстрація</h1>

        {["username", "email", "password", "nickname"].map((field) => (
          <input
            key={field}
            type={field === "password" ? "password" : "text"}
            name={field}
            placeholder={field}
            className="border p-2 w-full mb-3 rounded"
            onChange={handleChange}
            required
          />
        ))}

        {}
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="border p-2 w-full mb-3 rounded"
          required
        >
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>

        <button className="bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600">
          Зареєструватися
        </button>

        <p className="text-center mt-2 text-sm text-gray-700">{message}</p>
      </form>
    </div>
  );
}
