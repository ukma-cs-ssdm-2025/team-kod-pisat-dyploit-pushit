import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { getMovieById } from "../api"

const mockReviews = [
  { id: 1, user: "admin_user", rating: 5, text: "Чудовий фільм, 10/10!" },
  { id: 2, user: "test_user", rating: 4, text: "Дуже емоційно та красиво." },
]

export default function Movie() {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)

  useEffect(() => {
    getMovieById(id).then((data) => {
      setMovie(data)
    })
  }, [id])

  if (!movie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-center pt-32 text-lg text-amber-400">
        Завантаження фільму...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 pt-24 pb-8">
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex flex-col md:flex-row gap-8 bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur mb-8">
          <div className="md:w-1/3">
            <img
              src={movie.imageUrl || "/placeholder.svg"}
              alt={movie.title}
              className="w-full h-auto object-cover rounded-xl shadow-lg border-2 border-amber-500/30"
            />
          </div>

          <div className="md:w-2/3">
            <h1 className="text-4xl font-bold text-white mb-2">
              {movie.title}
              <span className="text-2xl text-amber-400 ml-2">({movie.year})</span>
            </h1>
            <div className="border-t border-amber-500/20 pt-4 mt-4 space-y-3">
              <p className="text-lg text-gray-300">
                <strong className="text-amber-400">Режисер:</strong> {movie.director}
              </p>
              <p className="text-lg text-gray-300">
                <strong className="text-amber-400">Актори:</strong> {movie.actors.join(", ")}
              </p>
              <p className="text-gray-400 text-justify leading-relaxed mt-4">
                {movie.description || "Опис для цього фільму скоро з'явиться."}
              </p>
            </div>

            <div className="mt-6 flex gap-4">
              <button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white px-6 py-3 rounded-lg transition-all font-medium border border-amber-400/30">
                Додати в улюбленe
              </button>
              <button className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white px-6 py-3 rounded-lg transition-all font-medium border border-purple-400/30">
                Написати відгук
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur">
          <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
            Відгуки користувачів
          </h2>
          <div className="space-y-6">
            {mockReviews.map((review) => (
              <div key={review.id} className="border-b border-amber-500/20 pb-4 last:border-b-0">
                <div className="flex items-center mb-2">
                  <strong className="text-lg text-white">{review.user}</strong>
                  <span className="ml-3 text-yellow-400">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                <p className="text-gray-300">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
