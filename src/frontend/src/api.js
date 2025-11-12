// === ВАШІ РЕАЛЬНІ ФУНКЦІЇ (для зв'язку з бекендом) ===

const API_URL = "http://localhost:3000"

function decodeToken(token) {
  try {
    const payload = token.split(".")[1]
    const decoded = JSON.parse(atob(payload))
    // payload: { id, username, role }
    return decoded
  } catch (e) {
    console.error("JWT decode error:", e)
    return null
  }
}

// ВАША РОБОЧА ФУНКЦІЯ
export async function registerUser(data) {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.json()
}

// ВАША РОБОЧА ФУНКЦІЯ
export async function loginUser(data) {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.json()
}

// ВАША РОБОЧА ФУНКЦІЯ
// Вона потрібна для useAuth та сторінки /profile
export async function getUserData(token) {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.username) {
    console.error("Некоректний токен або відсутній username у payload")
    // Важливо повернути null або кинути помилку, щоб useAuth це обробив
    return null
  }

  const username = decoded.username.replace(/^@/, "")
  
  try {
    const res = await fetch(`${API_URL}/api/v1/users/${username}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    
    if (!res.ok) {
        // Якщо бекенд повернув 404 або 500, повертаємо null
        console.error("Failed to fetch user data:", res.status)
        return null
    }
    return res.json()
  } catch (err) {
    console.error("Network error fetching user data:", err)
    return null
  }
}


// === НОВІ МОКАП-ФУНКЦІЇ (для розробки UI) ===

// --- МОКАПИ ДАНИХ (ФІЛЬМИ) ---
const mockMovieList = [
  { id: 1, title: "Inception", year: 2010, director: "Christopher Nolan", actors: ["Leonardo DiCaprio", "Joseph Gordon-Levitt"], imageUrl: "https://placehold.co/300x450/000000/FFFFFF?text=Inception", description: "A skilled thief who specializes in extraction..."},
  { id: 2, title: "Interstellar", year: 2014, director: "Christopher Nolan", actors: ["Matthew McConaughey", "Anne Hathaway"], imageUrl: "https://placehold.co/300x450/E8AA42/FFFFFF?text=Interstellar", description: "A team of explorers travel through a wormhole..."},
  { id: 3, title: "The Dark Knight", year: 2008, director: "Christopher Nolan", actors: ["Christian Bale", "Heath Ledger"], imageUrl: "https://placehold.co/300x450/1B1B1B/FFFFFF?text=The+Dark+Knight", description: "When the menace known as The Joker emerges..."},
  { id: 4, title: "Pulp Fiction", year: 1994, director: "Quentin Tarantino", actors: ["John Travolta", "Uma Thurman"], imageUrl: "https://placehold.co/300x450/FF0000/FFFFFF?text=Pulp+Fiction", description: "The lives of two mob hitmen, a boxer, a gangster..."},
]

// --- МОКАПИ КОРИСТУВАЧІВ ---
const mockUserList = [
  { id: 1, username: "@admin", nickname: "AdminUser", email: "admin@flick.ly", role: "admin", profileImageUrl: "https://placehold.co/150/f03a47/ffffff?text=A" },
  { id: 2, username: "@moderator", nickname: "ModUser", email: "mod@flick.ly", role: "moderator", profileImageUrl: "https://placehold.co/150/007BFF/ffffff?text=M" },
  { id: 3, username: "@user1", nickname: "RegularUser", email: "user1@flick.ly", role: "user", profileImageUrl: "https://placehold.co/150/2a9d8f/ffffff?text=R" },
  { id: 4, username: "@user2", nickname: "AnotherUser", email: "user2@flick.ly", role: "user", profileImageUrl: "https://placehold.co/150/e9c46a/ffffff?text=A" }
]

// --- МОКАПИ ВІДГУКІВ ---
const mockReviewsList = [
  { id: 101, movieId: 1, userId: 3, title: "Неймовірно!", text: "Це просто знесло мені дах. 10/10.", rating: 5, date: "2025-11-10" },
  { id: 102, movieId: 1, userId: 4, title: "Заплутано, але круто", text: "Довелося подивитися двічі, але воно того варте.", rating: 4, date: "2025-11-11" },
  { id: 103, movieId: 2, userId: 2, title: "Шедевр", text: "Я плакав. Музика, візуал... все на висоті.", rating: 5, date: "2025-11-12" }
]

// --- Мокап-функції ---

export async function getAllMovies() {
  console.log("API (Mock): Fetching all movies...")
  return new Promise((resolve) => setTimeout(() => resolve(mockMovieList), 300))
}
export async function getMovieById(id) {
  const numericId = Number(id)
  return new Promise((resolve) => {
    setTimeout(() => {
      const movie = mockMovieList.find((m) => m.id === numericId)
      resolve(movie || null)
    }, 200)
  })
}
export async function addMovie(movieData) {
  console.log("API (Mock): Adding movie", movieData)
  return new Promise((resolve) => setTimeout(() => resolve({ status: "success", movie: movieData }), 500))
}
export async function updateMovie(movieId, movieData) {
  console.log("API (Mock): Updating movie", movieId, movieData)
  return new Promise((resolve) => setTimeout(() => resolve({ status: "success", movie: movieData }), 500))
}

// Отримує будь-якого користувача за username (для сторінок /user/@username)
export async function getUserByUsername(username) {
  console.log(`API (Mock): Fetching user by username: ${username}`)
  return new Promise((resolve) => {
    setTimeout(() => {
      const cleanUsername = username.startsWith('@') ? username : `@${username}`;
      const user = mockUserList.find((u) => u.username === cleanUsername)
      resolve(user || null)
    }, 300)
  })
}

export async function getAllUsers() {
  console.log("API (Mock): Fetching all users (admin)")
  // ВАЖЛИВО: У реальному житті, ця функція має викликати ваш бекенд
  // і вона ПОВИННА повертати користувачів, які є у вашій БД,
  // а не мокапи, інакше /admin/users покаже одне, а /profile - інше.
  // Поки що повертаємо мокапи для UI.
  return new Promise((resolve) => setTimeout(() => resolve(mockUserList), 500))
}

// ЦЕ ФУНКЦІЯ, ЯКОЇ НЕ ВИСТАЧАЛО
// Вона мокап, бо ви не просили підв'язувати редагування профілю до беку
export async function updateUser(userId, userData) {
  console.log("API (Mock): Updating user", userId, userData)
  // ВАЖЛИВО: Коли будете підключати бек, ця функція має
  // викликати ваш `fetch` до `PUT /api/v1/users/:param`
  return new Promise((resolve) => setTimeout(() => resolve({ status: "success", user: userData }), 500))
}

// *** НОВА ФУНКЦІЯ ***
export async function deleteUser(userId) {
  console.log("API (Mock): Deleting user", userId)
  return new Promise((resolve) => setTimeout(() => resolve({ status: "success" }), 300))
}

// *** НОВА ФУНКЦІЯ ***
export async function deleteMovie(movieId) {
  console.log("API (Mock): Deleting movie", movieId)
  return new Promise((resolve) => setTimeout(() => resolve({ status: "success" }), 300))
}

export async function getReviewsByMovieId(movieId) {
  console.log(`API (Mock): Fetching reviews for movie: ${movieId}`)
  const numericId = Number(movieId)
  return new Promise((resolve) => {
    setTimeout(() => {
      const reviews = mockReviewsList.filter(r => r.movieId === numericId)
      const populatedReviews = reviews.map(review => {
        const user = mockUserList.find(u => u.id === review.userId)
        return { ...review, user: user || { nickname: "User", username: "@deleted"} }
      })
      resolve(populatedReviews)
    }, 400)
  })
}

export async function addReview(reviewData) {
  console.log("API (Mock): Adding review", reviewData)
  return new Promise((resolve) => setTimeout(() => resolve({ status: "success", review: reviewData }), 500))
}

export async function deleteReview(reviewId) {
  console.log("API (Mock): Deleting review", reviewId)
  return new Promise((resolve) => setTimeout(() => resolve({ status: "success" }), 300))
}

