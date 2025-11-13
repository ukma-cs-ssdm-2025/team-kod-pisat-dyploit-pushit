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
            <h2 className="text-4xl font-bold text-white">flick.ly</h2>
            <p className="text-2xl font-bold text-white self-end">Share your flicks. Feel the vibes. Flick.ly.</p>
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
                placeholder="Username (починайте з @)"
                className="w-full px-4 py-3 bg-transparent border-2 border-blue-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="nickname"
                placeholder="Nickname (ваше ім'я)"
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
              <p className={`text-center text-sm ${res.user ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}