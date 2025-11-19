CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'user' NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    avatar_url VARCHAR(255),
    liked_movies INTEGER[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(100),
    rating NUMERIC(3, 1) DEFAULT 0, 
    cover_url VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 10),
  movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS people (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255),
    profession VARCHAR(50) CHECK (profession IN ('actor', 'producer', 'director')) NOT NULL,
    biography TEXT
);

CREATE TABLE IF NOT EXISTS movie_people (
  movie_id INT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  person_id INT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, person_id)
);

CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (requester_id, receiver_id)
);





INSERT INTO users (username, role, nickname, password, email)
VALUES ('@admin', 'admin', 'Admin', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;