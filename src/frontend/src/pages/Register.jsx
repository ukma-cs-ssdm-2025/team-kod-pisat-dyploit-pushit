"use client"

import { useState } from "react"
import { registerUser } from "../api"
import { Link } from "react-router-dom"

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    nickname: "",
    role: "user",
  })
  const [message, setMessage] = useState("")

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await registerUser(form)
    if (res.user) {
      setMessage("Користувача створено! Тепер ви можете увійти.")
    } else {
      setMessage(res.message || "Помилка реєстрації.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 flex items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-6xl gap-8 items-center">
        <div className="hidden lg:flex flex-1 rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-purple-900 to-purple-950 p-8 relative overflow-hidden min-h-96">
          {/* Geometric decorative elements */}
          <div className="absolute top-8 right-8 space-y-2">
            <div className="flex gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-6 h-6 bg-purple-400 rounded-full"></div>
              <div className="w-6 h-6 bg-purple-400 rounded-full"></div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 space-y-2">
            <div className="flex gap-2 justify-center">
              <div className="w-12 h-12 bg-blue-400 rounded-full"></div>
              <div className="w-12 h-12 bg-blue-400 rounded-full"></div>
              <div className="w-12 h-12 bg-blue-400 rounded-full"></div>
            </div>
            <div className="flex gap-2 justify-center">
              <div className="w-12 h-12 bg-blue-400 rounded-full"></div>
              <div className="w-12 h-12 bg-blue-400 rounded-full"></div>
              <div className="w-12 h-12 bg-blue-400 rounded-full"></div>
            </div>
          </div>

          <div className="flex flex-col justify-between h-full">
            <h2 className="text-4xl font-bold text-white">flick.ly</h2>
            <p className="text-2xl font-bold text-white">Share your flicks. Feel the vibes. Flick.ly.</p>
          </div>
        </div>

        <div className="flex-1">
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <h1 className="text-4xl font-bold text-white mb-6">Create an account</h1>

            <div className="mb-4">
              <p className="text-sm text-gray-300">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                  Log In
                </Link>
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                name="username"
                placeholder="Username"
                className="w-full px-4 py-3 bg-transparent border-2 border-blue-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="nickname"
                placeholder="@Nickname"
                className="w-full px-4 py-3 bg-transparent border-2 border-blue-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                onChange={handleChange}
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full px-4 py-3 bg-transparent border-2 border-blue-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                onChange={handleChange}
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full px-4 py-3 bg-transparent border-2 border-blue-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                onChange={handleChange}
                required
              />

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-transparent border-2 border-blue-500 rounded-lg text-white focus:outline-none focus:border-blue-400 transition-colors"
              >
                <option value="user" className="bg-purple-900">
                  User
                </option>
                <option value="moderator" className="bg-purple-900">
                  Moderator
                </option>
                <option value="admin" className="bg-purple-900">
                  Admin
                </option>
              </select>
            </div>

            <div className="flex items-center mb-6 gap-2">
              <input type="checkbox" id="terms" className="w-5 h-5 cursor-pointer accent-blue-500" required />
              <label htmlFor="terms" className="text-sm text-gray-300">
                I agree to the <span className="text-blue-400">Terms & Conditions</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-white transition-colors mb-6"
            >
              Sign Up
            </button>

            {message && (
              <p className={`text-center text-sm text-gray-400`}>
                {message}
              </p>
            )}

            <p className="text-center text-xs text-gray-400 mt-6">
              Flick.ly | <span>Terms & Conditions</span> | 2025
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
