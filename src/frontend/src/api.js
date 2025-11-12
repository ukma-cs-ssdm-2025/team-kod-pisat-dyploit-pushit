const API_URL = "http://localhost:3000"

// --- МОКАПИ ДАНИХ ---
const mockMovieList = [
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
  },
  {
    id: 4,
    title: "Pulp Fiction",
    year: 1994,
    director: "Quentin Tarantino",
    actors: ["John Travolta", "Uma Thurman"],
    imageUrl: "https://placehold.co/300x450/FF0000/FFFFFF?text=Pulp+Fiction",
    description:
      "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
  },
  {
    id: 5,
    title: "The Shawshank Redemption",
    year: 1994,
    director: "Frank Darabont",
    actors: ["Tim Robbins", "Morgan Freeman"],
    imageUrl: "https://placehold.co/300x450/00537E/FFFFFF?text=Shawshank",
    description:
      "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
  },
  {
    id: 6,
    title: "The Godfather",
    year: 1972,
    director: "Francis Ford Coppola",
    actors: ["Marlon Brando", "Al Pacino"],
    imageUrl: "https://placehold.co/300x450/4B4B4B/FFFFFF?text=Godfather",
    description:
      "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant youngest son.",
  },
  {
    id: 7,
    title: "Fight Club",
    year: 1999,
    director: "David Fincher",
    actors: ["Brad Pitt", "Edward Norton"],
    imageUrl: "https://placehold.co/300x450/F05154/FFFFFF?text=Fight+Club",
    description:
      "An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into much more.",
  },
  {
    id: 8,
    title: "Forrest Gump",
    year: 1994,
    director: "Robert Zemeckis",
    actors: ["Tom Hanks", "Robin Wright"],
    imageUrl: "https://placehold.co/300x450/007BFF/FFFFFF?text=Forrest+Gump",
    description:
      "The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man with an IQ of 75.",
  },
  {
    id: 9,
    title: "Dune: Part Two",
    year: 2024,
    director: "Denis Villeneuve",
    actors: ["Timothée Chalamet", "Zendaya"],
    imageUrl: "https://placehold.co/300x450/D2691E/FFFFFF?text=Dune+2",
    description: "Paul Atreides travels to the dangerous planet Arrakis to ensure the future of his family and people.",
  },
  {
    id: 10,
    title: "Oppenheimer",
    year: 2023,
    director: "Christopher Nolan",
    actors: ["Cillian Murphy", "Emily Blunt"],
    imageUrl: "https://placehold.co/300x450/F4A261/000000?text=Oppenheimer",
    description:
      "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
  },
]

function decodeToken(token) {
  try {
    const payload = token.split(".")[1]
    const decoded = JSON.parse(atob(payload))
    return decoded
  } catch (e) {
    console.error("JWT decode error:", e)
    return null
  }
}

export async function getAllMovies() {
  console.log("API: Fetching all movies...")
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockMovieList)
    }, 500)
  })
}

export async function getMovieById(id) {
  console.log(`API: Fetching movie with id: ${id}`)
  const numericId = Number(id)
  return new Promise((resolve) => {
    setTimeout(() => {
      const movie = mockMovieList.find((m) => m.id === numericId)
      resolve(movie || null)
    }, 300)
  })
}

export async function registerUser(data) {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function loginUser(data) {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function getUserData(token) {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.username) {
    console.error("Некоректний токен або відсутній username у payload")
    return null
  }

  const username = decoded.username.replace(/^@/, "")
  const res = await fetch(`${API_URL}/api/v1/users/${username}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}
