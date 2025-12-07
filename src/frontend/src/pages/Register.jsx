import { useState } from "react"
import { registerUser } from "../api"
import { Link } from "react-router-dom"
import AlertModal from "../components/AlertModal"

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    nickname: "",
    role: "user",
  })
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  })

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await registerUser(form)
    if (res.user) {
      setAlertConfig({
        isOpen: true,
        title: "Success",
        message: "Account created! You can now log in.",
      })
    } else {
      setAlertConfig({
        isOpen: true,
        title: "Registration Failed",
        message: res.message || "Could not create account.",
      })
    }
  }

  return (
    <>
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#1a1a1a" }} // фон
      >
        {/* Головний контейнер двох бордових блоків */}
        <div className="flex w-full max-w-6xl h-[540px] items-stretch gap-17 relative">
          {/* Лівий бордовий блок */}
          <div className="hidden lg:flex flex-1 bg-[#052288] rounded-[15px] items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-6">
              {/* Відеострічка */}
              <div
                className="absolute"
                style={{
                  top: "50%",
                  left: "15.3%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* ВІДЕО */}
                <video
                  src="/pictures_elements/movietape.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-[250px] rounded-[20px] h-auto object-cover"
                  style={{ objectPosition: "center" }}
                />
              </div>

              {/* ТЕКСТ У ВЕРХНЬОМУ ВІКОНЦІ 1 */}
              <div
                className="absolute w-full text-center font-extrabold text-black uppercase"
                style={{
                  top: "21.5%",
                  left: "15.2%",
                  transform: "translateX(-50%)",
                  fontSize: "24px",
                  letterSpacing: "0.07em",
                }}
              >
                FLICK.LY
              </div>

              {/* ТЕКСТ У ВЕРХНЬОМУ ВІКОНЦІ 2 */}
              <div
                className="absolute w-full text-center font-extrabold text-black uppercase"
                style={{
                  top: "43.5%",
                  left: "15.2%",
                  transform: "translateX(-50%)",
                  fontSize: "24px",
                  letterSpacing: "0.07em",
                }}
              >
                SHARE <br /> YOUR FLICKS
              </div>

              {/* ТЕКСТ У ВЕРХНЬОМУ ВІКОНЦІ 3 */}
              <div
                className="absolute w-full text-center font-extrabold text-black uppercase"
                style={{
                  top: "69%",
                  left: "15.2%",
                  transform: "translateX(-50%)",
                  fontSize: "24px",
                  letterSpacing: "0.07em",
                }}
              >
                FEEL <br /> THE VIBES
              </div>

              {/* Текст — запас під майбутні написи */}
              <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-4" />
                <p className="text-2xl font-bold text-white" />
              </div>
            </div>
          </div>

          {/* Шестерня-око між блоками (як у Login) */}
          <div
            className="
              hidden md:flex
              absolute inset-y-0 left-1/2 -translate-x-1/2
              items-center justify-center
              pointer-events-none
            "
          >
            <img
              src="/pictures_elements/eye_gear.png"
              alt="gear"
              className="w-32 h-32 lg:w-40 lg:h-40 object-contain"
            />
          </div>

          {/* Правий бордовий блок */}
          <div className="flex-1 bg-[#052288] rounded-[15px] flex items-center justify-center">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md px-8 py-6 flex flex-col justify-center"
            >
              {/* Заголовок */}
              <h1
                className="
                  text-2xl md:text-2xl
                  font-extrabold
                  text-[#d6cecf]
                  uppercase
                  text-center
                  whitespace-nowrap
                  tracking-[0.18em]
                  mb-6
                "
                style={{
                  letterSpacing: "0.1em",
                  wordSpacing: "0.17em",
                }}
              >
                CREATE AN ACCOUNT
              </h1>

              {/* Already have account */}
              <div className="mb-6">
                <p
                  className="text-sm md:text-sm text-[#000000] font-extrabold tracking-[0.2em] uppercase text-center"
                  style={{
                    letterSpacing: "0.05em",
                    wordSpacing: "0.01em",
                  }}
                >
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="underline underline-offset-4 text-[#d6cecf] hover:text-white"
                  >
                    Log in
                  </Link>
                </p>
              </div>

              {/* Поля вводу */}
              <div className="space-y-4 mb-6 w-full flex flex-col items-center">
                <input
                  type="text"
                  name="username"
                  placeholder="Username (починайте з @)"
                  className="
                    w-[80%]
                    bg-[#2b2727]
                    text-[#d6cecf]
                    placeholder:font-extrabold
                    placeholder:bold
                    border-[4px] border-black
                    rounded-[16px]
                    py-2.5 px-4
                    text-sm
                    tracking-[0.12em]
                    placeholder:uppercase
                    placeholder:tracking-[0.12em]
                    outline-none
                    mx-auto
                  "
                  onChange={handleChange}
                  required
                />

                <input
                  type="text"
                  name="nickname"
                  placeholder="Nickname (ваше ім'я)"
                  className="
                    w-[80%]
                    bg-[#2b2727]
                    text-[#d6cecf]
                    placeholder:font-extrabold
                    placeholder:bold
                    border-[4px] border-black
                    rounded-[16px]
                    py-2.5 px-4
                    text-sm
                    tracking-[0.12em]
                    placeholder:uppercase
                    placeholder:tracking-[0.12em]
                    outline-none
                    mx-auto
                  "
                  onChange={handleChange}
                  required
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="
                    w-[80%]
                    bg-[#2b2727]
                    text-[#d6cecf]
                    placeholder:font-extrabold
                    placeholder:bold
                    border-[4px] border-black
                    rounded-[16px]
                    py-2.5 px-4
                    text-sm
                    tracking-[0.12em]
                    placeholder:uppercase
                    placeholder:tracking-[0.12em]
                    outline-none
                    mx-auto
                  "
                  onChange={handleChange}
                  required
                />

                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="
                    w-[80%]
                    bg-[#2b2727]
                    text-[#d6cecf]
                    placeholder:font-extrabold
                    placeholder:bold
                    border-[4px] border-black
                    rounded-[16px]
                    py-2.5 px-4
                    text-sm
                    tracking-[0.12em]
                    placeholder:uppercase
                    placeholder:tracking-[0.12em]
                    outline-none
                    mx-auto
                  "
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Чекбокс */}
              <div className="flex items-center mb-6 gap-4 pl-7">
                <input
                  type="checkbox"
                  id="terms"
                  className="
                    w-6 h-6
                    border-[3px] border-black
                    bg-[#d6cecf]
                    cursor-pointer
                    appearance-none
                    relative
                    flex items-center justify-center

                    checked:bg-[#d6cecf]
                    checked:border-black

                    checked:before:content-['✔']
                    checked:before:absolute
                    checked:before:text-black
                    checked:before:text-base
                    checked:before:font-bold
                  "
                />

                <label
                  htmlFor="terms"
                  className="text-sm md:text-sm text-[#000000] font-extrabold tracking-[0.1em] uppercase"
                  style={{
                    letterSpacing: "0.05em",
                    wordSpacing: "0.01em",
                  }}
                >
                  I agree to the{" "}
                  <span className="underline underline-offset-4 text-[#d6cecf]">
                    Terms & Conditions
                  </span>
                </label>
              </div>

              {/* Кнопка */}
              <button
                type="submit"
                className="
                  w-full py-4
                  bg-[#c9c7c7]
                  text-black
                  font-extrabold
                  text-base
                  tracking-[0.25em]
                  uppercase
                  border-[4px] border-black
                  rounded-[20px]
                  hover:bg-[#e0dfdf]
                  transition-colors
                  mb-4
                "
              >
                REGISTER
              </button>
            </form>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() =>
          setAlertConfig({
            ...alertConfig,
            isOpen: false,
          })
        }
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </>
  )
}