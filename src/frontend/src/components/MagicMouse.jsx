import { useEffect, useRef, useState } from "react"

export default function MagicMouse() {
  const [visible, setVisible] = useState(false)

  const timeoutRef = useRef(null)
  const lastPosRef = useRef({ x: null, y: null, t: 0 })

  useEffect(() => {
    const handleMove = (e) => {
      const now = performance.now()
      const { clientX, clientY } = e

      const last = lastPosRef.current

      if (last.x !== null && last.y !== null) {
        const dx = clientX - last.x
        const dy = clientY - last.y
        const dt = now - last.t || 1

        const distance = Math.sqrt(dx * dx + dy * dy)
        const speed = distance / dt

        const SPEED_THRESHOLD = 15 // підкручуєш чутливість тут

        if (speed > SPEED_THRESHOLD) {
          // показуємо відео
          if (!visible) {
            setVisible(true)
          }

          // кожен новий "швидкий" рух продовжує життя ефекту
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => {
            setVisible(false)
          }, 150) // скільки воно ще видно після останнього швидкого руху
        }
      }

      lastPosRef.current = { x: clientX, y: clientY, t: now }
    }

    window.addEventListener("mousemove", handleMove)

    return () => {
      window.removeEventListener("mousemove", handleMove)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [visible])

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <video
        src="/pictures_elements/glitch_.mp4" // твоє відео з папки public
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-120 ${
          visible ? "opacity-30" : "opacity-0"
        }`}
      />
    </div>
  )
}
