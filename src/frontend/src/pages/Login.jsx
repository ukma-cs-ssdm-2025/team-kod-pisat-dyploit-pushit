import { useState } from "react"
import { loginUser } from "../api"
import { Link } from "react-router-dom"

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" })
  const [message, setMessage] = useState("")

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await loginUser(form)
    if (res.token) {
      localStorage.setItem("token", res.token)
      window.location.href = "/profile"
    } else {
      setMessage(res.message || "Помилка входу")
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#1a1a1a" }} // фон
    >
      {/* Головний контейнер двох бордових блоків */}
      <div className="flex w-full max-w-6xl h-[540px] items-stretch gap-17 relative">

        {/* Лівий бордовий блок */}
        <div className="hidden lg:flex flex-1 bg-[#606aa2] rounded-[15px] items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-6">

            {/* Відеострічка */}
            <div
              className="absolute"
              style={{
                top: "50%", // центр по Y
                left: "15.3%", // трохи від лівого краю
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
                style={{
                  objectPosition: "center",
                }}
              />
            </div>

                     {/* ТЕКСТ У ВЕРХНЬОМУ ВІКОНЦІ 1 */}
    <div
      className="absolute w-full text-center font-extrabold text-black uppercase"
      style={{
        top: "21.5%",        // позиція по Y у верхнє вікно
        left: "15.2%",
        transform: "translateX(-50%)",
        fontSize: "24px",  // можеш змінити
        letterSpacing: "0.07em"
      }}
    >
      FLICK.LY
    </div>


               {/* ТЕКСТ У ВЕРХНЬОМУ ВІКОНЦІ 2 */}
    <div
      className="absolute w-full text-center font-extrabold text-black uppercase"
      style={{
        top: "43.5%",        // позиція по Y у верхнє вікно
        left: "15.2%",
        transform: "translateX(-50%)",
        fontSize: "24px",  // можеш змінити
        letterSpacing: "0.07em"
      }}
    >
      SHARE <br /> YOUR FLICKS
    </div>


               {/* ТЕКСТ У ВЕРХНЬОМУ ВІКОНЦІ 3*/}
    <div
      className="absolute w-full text-center font-extrabold text-black uppercase"
      style={{
        top: "69%",        // позиція по Y у верхнє вікно
        left: "15.2%",
        transform: "translateX(-50%)",
        fontSize: "24px",  // можеш змінити
        letterSpacing: "0.07em"
      }}
    >
      FEEL <br /> THE VIBES
    </div>



            {/* Текст — поки пустий, залишаю як місце для майбутнього */}
            <div className="text-center">
              <h2 className="text-4xl font-extrabold text-white mb-4">
                {/* text_1 */}
              </h2>
              <p className="text-2xl font-bold text-white">
                {/* text_2 */}
              </p>
            </div>
          </div>
        </div>

        {/* Шестерня-око між блоками */}
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
        <div className="flex-1 bg-[#606aa2] rounded-[15px] flex items-center justify-center h-full">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md px-8 h-full flex flex-col justify-center"
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
              LOG IN YOUR ACCOUNT
            </h1>

            {/* Don't have account */}
            <div className="mb-8">
              <p className="text-sm md:text-sm text-[#000000] font-extrabold tracking-[0.2em] uppercase text-center"
              
            style={{
               letterSpacing: "0.05em",
               wordSpacing: "0.01em",
              }}

              >
                Don't have an account yet?{" "}
                <Link
                  to="/register"
                  className="underline underline-offset-4 text-[#d6cecf] hover:text-white"
                >
                  Sign up
                </Link>
              </p>
            </div>

            {/* Поля вводу */}
            <div className="space-y-5 mb-8 w-full flex flex-col items-center">
              <input
                type="text"
                name="username"
                placeholder="Username"
                className="
                  w-[80%]
                  bg-[#2b2727]
                  text-[#d6cecf]
                  placeholder:font-extrabold
                  placeholder:bold
                  border-[4px] border-black
                  rounded-[16px]
                  py-3 px-5
                  text-base
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
                  py-3 px-5
                  text-base
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
  className="w-full
    py-4 bg-[#c9c7c7] 
    text-black font-extrabold
    text-lg tracking-[0.25em] 
    uppercase border-[4px] 
    border-black rounded-[20px] 
    hover:bg-[#e0dfdf]
    mb-6
  "
  onClick={(e) => {
    const btn = e.currentTarget;

    // додаємо анімацію прямо інлайном
    btn.style.transition = "transform 0.15s ease";
    btn.style.transform = "scale(0.85)";

    // повертаємо назад через 150ms
    setTimeout(() => {
      btn.style.transform = "scale(1)";
    }, 150);
  }}
>
  Login
</button>





            {message && (
              <p className="text-center text-sm text-red-400">{message}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

