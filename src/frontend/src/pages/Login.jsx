import { useState } from "react"
import { loginUser } from "../api"
import { Link } from "react-router-dom"
import AlertModal from "../components/AlertModal"

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" })
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '' })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await loginUser(form)
    if (res.token) {
      localStorage.setItem("token", res.token)
      window.location.href = "/profile" 
    } else {
      setAlertConfig({
        isOpen: true,
        title: "Login Failed",
        message: res.message || "Invalid credentials."
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="flex w-full max-w-6xl gap-8 items-center">
        <div className="hidden lg:flex flex-1 rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-gray-800 to-gray-900 p-8 relative overflow-hidden min-h-96 items-center justify-center shadow-2xl">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white mb-4 cursor-default">flick.ly</h2>
              <p className="text-2xl font-bold text-white cursor-default">Share your flicks. Feel the vibes.</p>
            </div>
        </div>

        <div className="flex-1">
          <form onSubmit={handleSubmit} className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-4xl font-bold text-white mb-6">Log in to your account</h1>

            <div className="mb-4">
              <p className="text-sm text-gray-300 cursor-default">
                Don't have an account yet?{" "}
                <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">
                  Sign Up
                </Link>
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                name="username"
                placeholder="Username"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors cursor-text"
                onChange={handleChange}
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors cursor-text"
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-200 transition-colors mb-6 cursor-pointer"
            >
              Log In
            </button>
          </form>
        </div>
      </div>
      <AlertModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  )
}