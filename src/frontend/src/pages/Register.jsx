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
    setMessage(res.user ? "Користувача створено! Тепер ви можете увійти." : res.message || "Помилка реєстрації.")
  }

  return (
    <div className="min-h-screen w-full bg-[#111111] flex items-center justify-start px-6 py-6">
      <div className="flex w-full max-w-6xl gap-10 items-center">

        {/* LEFT PANEL */}
        <div className="hidden lg:flex flex-1">
          <div
            className="w-full h-[640px] rounded-[32px] px-14 py-10
                       bg-gradient-to-br from-[#3b1da8] via-[#371c8e] to-[#2c1669]
                       border border-[#4e3aa8]/40 backdrop-blur-md
                       shadow-[0_0_60px_-10px_rgba(120,80,255,0.4)]
                       flex flex-col justify-between"
          >
            <h2 className="text-4xl font-bold text-white">flick.ly</h2>

            <p className="text-3xl font-semibold text-white leading-snug">
              Share your flicks. Feel the vibes. <br />
              Flick.ly
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <h1 className="text-4xl font-bold text-white mb-2">Create an account</h1>

            <div className="mb-4">
              <p className="text-gray-400 mb-6">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-[#9f7bff] hover:text-[#bfa4ff] font-semibold 
                             hover:[text-shadow:0_0_10px_rgba(159,123,255,0.8)]"
                >
                  Log In
                </Link>
              </p>
            </div>

            {/* INPUTS */}
            <div className="space-y-4 mb-6">
              {[
                { name: "username", placeholder: "Username (починайте з @)" },
                { name: "nickname", placeholder: "Nickname (ваше ім'я)" },
                { name: "email", placeholder: "Email", type: "email" },
                { name: "password", placeholder: "Password", type: "password" },
              ].map((field) => (
                <input
                  key={field.name}
                  type={field.type || "text"}
                  name={field.name}
                  placeholder={field.placeholder}
                  onChange={handleChange}
                  required
                  className="
                    w-full px-4 py-3 bg-transparent border border-[#444] rounded-xl
                    text-white placeholder-gray-400 transition-all duration-300
                    hover:border-[#9f7bff] hover:shadow-[0_0_12px_2px_rgba(159,123,255,0.6)]
                    focus:border-[#b58dff] focus:shadow-[0_0_14px_3px_rgba(181,141,255,0.85)]
                    focus:outline-none"
                />
              ))}
            </div>

            {/* CHECKBOX */}
            <div className="flex items-center mb-6 gap-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="
                  w-5 h-5 cursor-pointer accent-[#9f7bff]
                  hover:shadow-[0_0_10px_2px_rgba(159,123,255,0.6)]
                  transition"
              />
              <label htmlFor="terms" className="text-sm text-gray-300">
                I agree to the{" "}
                <span className="text-[#9f7bff] hover:text-[#bfa4ff] hover:[text-shadow:0_0_10px_rgba(159,123,255,0.8)] cursor-pointer">
                  Terms & Conditions
                </span>
              </label>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              className="
                w-full py-3 bg-gradient-to-b from-[#f0f0f0] to-[#cfcfcf]
                text-black font-medium rounded-2xl shadow-xl
                hover:shadow-[0_0_25px_rgba(159,123,255,0.7)]
                transition"
            >
              Sign Up
            </button>

            {message && (
              <p className="text-center text-sm text-purple-300 mt-4">{message}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
