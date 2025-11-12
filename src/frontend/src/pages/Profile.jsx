"use client"

import { useEffect, useState } from "react"
import { getUserData } from "../api"
import MovieCard from "../components/MovieCard"
import { Link } from "react-router-dom"

const likedMovies = [
  {
    id: 1,
    title: "Inception",
    year: 2010,
    director: "Christopher Nolan",
    actors: ["Leonardo DiCaprio", "Joseph Gordon-Levitt"],
    imageUrl: "https://placehold.co/300x450/000000/FFFFFF?text=Inception",
    description:
      "A skilled thief who specializes in extraction, inception and espionage is offered a chance to regain his old life.",
  },
  {
    id: 2,
    title: "Interstellar",
    year: 2014,
    director: "Christopher Nolan",
    actors: ["Matthew McConaughey", "Anne Hathaway"],
    imageUrl: "https://placehold.co/300x450/E8AA42/FFFFFF?text=Interstellar",
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
  },
  {
    id: 3,
    title: "The Dark Knight",
    year: 2008,
    director: "Christopher Nolan",
    actors: ["Christian Bale", "Heath Ledger"],
    imageUrl: "https://placehold.co/300x450/1B1B1B/FFFFFF?text=The+Dark+Knight",
    description:
      "When the menace known as The Joker emerges from his mysterious past, he wreaks havoc and chaos on Gotham.",
  }
]
const userReviews = [
  {
    id: 1,
    movieId: 1,
    movieTitle: "Inception",
    rating: 5,
    text: "Чудовий фільм, 10/10! Повністю змінив моє сприйняття.",
  },
  {
    id: 2,
    movieId: 2,
    movieTitle: "Interstellar",
    rating: 4,
    text: "Дуже емоційно та красиво. Музика просто неймовірна.",
  },
]

export default function Profile() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "/login"
      return
    }
    getUserData(token).then(setUser)
  }, [])

  if (!user)
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-center pt-32 text-lg text-amber-400">
        Завантаження профілю...
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 pt-24 pb-8">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 mb-8 border border-amber-500/20 backdrop-blur">
          <img
            src={`https://via.placeholder.com/150/007BFF/FFFFFF?text=${user.username[0].toUpperCase()}`}
            alt=""
            className="w-32 h-32 rounded-full border-4 border-amber-500 object-cover shadow-lg"
          />
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
              {user.nickname}
            </h1>
            <p className="text-lg text-gray-300 mt-1">{user.username}</p>
            <div className="space-y-2 mt-3 border-t border-amber-500/20 pt-3">
              <p className="text-gray-400">
                Email: <span className="text-amber-400">{user.email}</span>
              </p>
              <p className="text-gray-400">
                Роль: <span className="text-amber-400 font-semibold">{user.role}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 mb-8 border border-amber-500/20 backdrop-blur">
          <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
            Вподобані фільми
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {likedMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur">
          <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
            Мої відгуки
          </h2>
          <div className="space-y-6">
            {userReviews.map((review) => (
              <div key={review.id} className="border-b border-amber-500/20 pb-4 last:border-b-0">
                <h3 className="text-lg font-semibold text-white">
                  <Link to={`/movie/${review.movieId}`} className="hover:text-amber-400 transition-colors">
                    {review.movieTitle}
                  </Link>
                  <span className="ml-3 text-yellow-400">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </h3>
                <p className="text-gray-300 mt-2">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
