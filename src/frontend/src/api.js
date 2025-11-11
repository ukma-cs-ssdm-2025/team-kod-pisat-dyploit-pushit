const API_URL = "http://localhost:3000";

// --- НОВІ МОКАПИ ДАНИХ ---
// У майбутньому це буде надходити з вашої БД
const mockMovieList = [
  { id: 1, title: "Inception", year: 2010, director: "Christopher Nolan", actors: ["Leonardo DiCaprio", "Joseph Gordon-Levitt"], imageUrl: "https://placehold.co/300x450/000000/FFFFFF?text=Inception" },
  { id: 2, title: "Interstellar", year: 2014, director: "Christopher Nolan", actors: ["Matthew McConaughey", "Anne Hathaway"], imageUrl: "https://placehold.co/300x450/E8AA42/FFFFFF?text=Interstellar" },
  { id: 3, title: "The Dark Knight", year: 2008, director: "Christopher Nolan", actors: ["Christian Bale", "Heath Ledger"], imageUrl: "https://placehold.co/300x450/1B1B1B/FFFFFF?text=The+Dark+Knight" },
  { id: 4, title: "Pulp Fiction", year: 1994, director: "Quentin Tarantino", actors: ["John Travolta", "Uma Thurman"], imageUrl: "https://placehold.co/300x450/FF0000/FFFFFF?text=Pulp+Fiction" },
  { id: 5, title: "The Shawshank Redemption", year: 1994, director: "Frank Darabont", actors: ["Tim Robbins", "Morgan Freeman"], imageUrl: "https://placehold.co/300x450/00537E/FFFFFF?text=Shawshank" },
  { id: 6, title: "The Godfather", year: 1972, director: "Francis Ford Coppola", actors: ["Marlon Brando", "Al Pacino"], imageUrl: "https://placehold.co/300x450/4B4B4B/FFFFFF?text=Godfather" },
  { id: 7, title: "Fight Club", year: 1999, director: "David Fincher", actors: ["Brad Pitt", "Edward Norton"], imageUrl: "https://placehold.co/300x450/F05154/FFFFFF?text=Fight+Club" },
  { id: 8, title: "Forrest Gump", year: 1994, director: "Robert Zemeckis", actors: ["Tom Hanks", "Robin Wright"], imageUrl: "https://placehold.co/300x450/007BFF/FFFFFF?text=Forrest+Gump" },
  { id: 9, title: "Dune: Part Two", year: 2024, director: "Denis Villeneuve", actors: ["Timothée Chalamet", "Zendaya"], imageUrl: "https://placehold.co/300x450/D2691E/FFFFFF?text=Dune+2" },
  { id: 10, title: "Oppenheimer", year: 2023, director: "Christopher Nolan", actors: ["Cillian Murphy", "Emily Blunt"], imageUrl: "https://placehold.co/300x450/F4A261/000000?text=Oppenheimer" },
];
// ----------------------------


function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (e) {
    console.error("JWT decode error:", e);
    return null;
  }
}

// --- НОВА ФУНКЦІЯ ---
// Імітує запит до API для всіх фільмів
export async function getAllMovies() {
  console.log("API: Fetching all movies...");
  // Імітація затримки мережі
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockMovieList);
    }, 500); // 500ms затримка
  });
  
  // Коли буде бекенд:
  // const res = await fetch(`${API_URL}/api/v1/movies`);
  // return res.json();
}

// --- НОВА ФУНКЦІЯ ---
// Імітує запит до API для одного фільму
export async function getMovieById(id) {
  console.log(`API: Fetching movie with id: ${id}`);
  const numericId = Number(id); // ID з URL - це рядок
  // Імітація затримки мережі
  return new Promise(resolve => {
    setTimeout(() => {
      const movie = mockMovieList.find(m => m.id === numericId);
      resolve(movie || null);
    }, 300);
  });
  
  // Коли буде бекенд:
  // const res = await fetch(`${API_URL}/api/v1/movies/${id}`);
  // return res.json();
}


export async function registerUser(data) {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function loginUser(data) {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getUserData(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.username) {
    console.error("Некоректний токен або відсутній username у payload");
    return null;
  }

  const username = decoded.username.replace(/^@/, "");
  const res = await fetch(`${API_URL}/api/v1/users/${username}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}