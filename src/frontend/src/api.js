const API_URL = "https://team-kod-pisat-dyploit-pushit-production.up.railway.app/api/v1"

/**
 * Декодує JWT токен для отримання payload (id, username, role)
 * @param {string} token 
 * @returns {object | null}
 */
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

/**
 * Отримує заголовок авторизації з localStorage
 * @returns {object}
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem("token")
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

/**
 * Універсальна функція для JSON-запитів до API
 * @param {string} endpoint 
 * @param {object} options 
 * @returns {Promise<any>}
 */
const apiFetch = async (endpoint, options = {}) => {
  const { body, ...restOptions } = options
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  }

  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...restOptions,
      headers,
      body: body ? JSON.stringify(body) : null,
    })

    if (response.status === 401) {
       
      localStorage.removeItem("token")
      window.location.href = '/login'
      return Promise.reject(new Error("Unauthorized"))
    }

    if (!response.ok) {
       
      const errorData = await response.json()
      console.error(`API Error ${response.status}:`, errorData.message || errorData.error)
      return Promise.reject(errorData)
    }

     
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return Promise.resolve(true)  
    }

    return response.json()  
  } catch (err) {
    console.error("Network or fetch error:", err)
    return Promise.reject(err)
  }
}

/**
 * Універсальна функція для FormData-запитів (завантаження файлів)
 * @param {string} endpoint 
 * @param {FormData} formData 
 * @param {string} method 
 * @returns {Promise<any>}
 */
const apiFetchForm = async (endpoint, formData, method = 'POST') => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: getAuthHeaders(),  
      body: formData,
    })

    if (response.status === 401) {
      localStorage.removeItem("token")
      window.location.href = '/login'
      return Promise.reject(new Error("Unauthorized"))
    }

    if (!response.ok) {
      const errorData = await response.json()
      console.error(`API Form Error ${response.status}:`, errorData.message || errorData.error)
      return Promise.reject(errorData)
    }
    
    return response.json()
  } catch (err) {
    console.error("Network or form fetch error:", err)
    return Promise.reject(err)
  }
}

 
 
export async function registerUser(data) {
   
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function loginUser(data) {
   
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.json()
}

 
export function getUserDataFromToken(token) {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.username) {
    console.error("Некоректний токен")
    return null
  }
   
  return apiFetch(`/users/${decoded.username}`)
}

export const getAllUsers = () => apiFetch('/users')
export const getUserByUsername = (username) => apiFetch(`/users/${username}`)  
export const updateUser = (id, data) => apiFetch(`/users/${id}`, { method: 'PUT', body: data })
export const deleteUser = (id) => apiFetch(`/users/${id}`, { method: 'DELETE' })

 
export const getAllMovies = () => apiFetch('/movies')
export const getMovieById = (id) => apiFetch(`/movies/${id}`)
export const addMovie = (data) => apiFetch('/movies', { method: 'POST', body: data })
export const updateMovie = (id, data) => apiFetch(`/movies/${id}`, { method: 'PUT', body: data })
export const deleteMovie = (id) => apiFetch(`/movies/${id}`, { method: 'DELETE' })

 
 
export const getAllReviews = () => apiFetch('/reviews')
export const addReview = (data) => apiFetch('/reviews', { method: 'POST', body: data })
export const updateReview = (id, data) => apiFetch(`/reviews/${id}`, { method: 'PUT', body: data })
export const deleteReview = (id) => apiFetch(`/reviews/${id}`, { method: 'DELETE' })

 
export const getAllPeople = () => apiFetch('/people')
export const getPersonById = (id) => apiFetch(`/people/${id}`)
export const addPerson = (data) => apiFetch('/people', { method: 'POST', body: data })
export const updatePerson = (id, data) => apiFetch(`/people/${id}`, { method: 'PUT', body: data })
export const deletePerson = (id) => apiFetch(`/people/${id}`, { method: 'DELETE' })

 
 
export const uploadAvatar = (file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return apiFetchForm('/upload/avatar', formData, 'PUT')  
}

 
export const uploadMovieCover = (movieId, file) => {
  const formData = new FormData()
  formData.append('cover', file)
  return apiFetchForm(`/upload/movie-cover/${movieId}`, formData, 'PUT')
}

 
export const uploadPersonAvatar = (personId, file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return apiFetchForm(`/upload/person-avatar/${personId}`, formData, 'PUT')
}

export const addToLikedMovies = (userParam, movieId) => 
  apiFetch(`/movies/${userParam}/likes/${movieId}`, { method: 'POST' });

export const removeFromLikedMovies = (userParam, movieId) => 
  apiFetch(`/movies/${userParam}/likes/${movieId}`, { method: 'DELETE' });

export const sendFriendRequest = (userParam) => 
  apiFetch(`/users/friends/request/${userParam}`, { method: 'POST' });

export const acceptFriendRequest = (userParam) => 
  apiFetch(`/users/friends/accept/${userParam}`, { method: 'POST' });

export const removeFriend = (userParam) => 
  apiFetch(`/users/friends/${userParam}`, { method: 'DELETE' });

export const getIncomingFriendRequests = (userParam) => 
  apiFetch(`/users/friends/requests/incoming/${userParam}`);