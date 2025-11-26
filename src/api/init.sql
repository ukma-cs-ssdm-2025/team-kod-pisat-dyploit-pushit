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

-- --------------------------------------------------------
-- 1. КОРИСТУВАЧІ (50 шт.)
-- Пароль для всіх: 'Password!123'
-- --------------------------------------------------------

-- Модератори (ID 2-5)
INSERT INTO users (username, role, nickname, password, email) VALUES
('@moderator1', 'moderator', 'Mod One', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'mod1@example.com'),
('@moderator2', 'moderator', 'Mod Two', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'mod2@example.com'),
('@chief_mod',  'moderator', 'Chief',   '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'chief@example.com'),
('@watcher',    'moderator', 'Watcher', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'watcher@example.com');

-- Звичайні користувачі (ID 6-50)
INSERT INTO users (username, role, nickname, password, email) VALUES
('@movie_fan', 'user', 'Fanboy', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user6@example.com'),
('@cinephile', 'user', 'Cinephile UA', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user7@example.com'),
('@critic_joe', 'user', 'Joe Critic', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user8@example.com'),
('@alice_w', 'user', 'Alice W.', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user9@example.com'),
('@bob_builder', 'user', 'Bob B', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user10@example.com'),
('@charlie_d', 'user', 'Charlie', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user11@example.com'),
('@david_lynch_fan', 'user', 'David L', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user12@example.com'),
('@eva_green', 'user', 'Eva', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user13@example.com'),
('@frank_s', 'user', 'Frank Sinatra', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user14@example.com'),
('@george_lucas', 'user', 'George', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user15@example.com'),
('@hannah_m', 'user', 'Hannah', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user16@example.com'),
('@ivan_k', 'user', 'Ivan K', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user17@example.com'),
('@jack_sparrow', 'user', 'Captain Jack', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user18@example.com'),
('@katherine_p', 'user', 'Kate', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user19@example.com'),
('@leo_dicaprio', 'user', 'Leo', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user20@example.com'),
('@maria_s', 'user', 'Maria', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user21@example.com'),
('@nick_fury', 'user', 'Nick', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user22@example.com'),
('@olivia_w', 'user', 'Olivia', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user23@example.com'),
('@peter_parker', 'user', 'Spidey', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user24@example.com'),
('@quentin_t', 'user', 'Quentin', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user25@example.com'),
('@rachel_g', 'user', 'Rachel', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user26@example.com'),
('@steve_jobs', 'user', 'Steve', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user27@example.com'),
('@tony_stark', 'user', 'IronMan', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user28@example.com'),
('@uma_thurman', 'user', 'Uma', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user29@example.com'),
('@victor_h', 'user', 'Victor', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user30@example.com'),
('@walter_white', 'user', 'Heisenberg', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user31@example.com'),
('@xena_warrior', 'user', 'Xena', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user32@example.com'),
('@yoda_master', 'user', 'Yoda', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user33@example.com'),
('@zelda_princess', 'user', 'Zelda', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user34@example.com'),
('@arthur_dent', 'user', 'Arthur', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user35@example.com'),
('@bilbo_baggins', 'user', 'Bilbo', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user36@example.com'),
('@conan_barb', 'user', 'Conan', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user37@example.com'),
('@don_draper', 'user', 'Don', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user38@example.com'),
('@ellen_ripley', 'user', 'Ripley', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user39@example.com'),
('@frodo_baggins', 'user', 'Frodo', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user40@example.com'),
('@gandalf_grey', 'user', 'Gandalf', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user41@example.com'),
('@harry_potter', 'user', 'Harry', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user42@example.com'),
('@indiana_jones', 'user', 'Indy', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user43@example.com'),
('@james_bond', 'user', '007', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user44@example.com'),
('@katniss_e', 'user', 'Katniss', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user45@example.com'),
('@lara_croft', 'user', 'Lara', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user46@example.com'),
('@marty_mcfly', 'user', 'Marty', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user47@example.com'),
('@neo_matrix', 'user', 'Neo', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user48@example.com'),
('@optimus_prime', 'user', 'Optimus', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user49@example.com'),
('@paul_atreides', 'user', 'MuadDib', '$2b$10$SmpGM9/EhxQs6FHAVHkn8OQESYS77XXCe7lMpoimc0NIGWEuLKOfS', 'user50@example.com');

-- --------------------------------------------------------
-- 2. ФІЛЬМИ (100 шт.)
-- --------------------------------------------------------
INSERT INTO movies (title, description, genre, rating) VALUES
('The Shawshank Redemption', 'Two imprisoned men bond over a number of years.', 'Drama', 0),
('The Godfather', 'The aging patriarch of an organized crime dynasty transfers control.', 'Crime', 0),
('The Dark Knight', 'When the menace known as the Joker wreaks havoc.', 'Action', 0),
('Pulp Fiction', 'The lives of two mob hitmen, a boxer, and a pair of bandits intertwine.', 'Crime', 0),
('Schindler''s List', 'In German-occupied Poland during the World War II.', 'Biography', 0),
('Inception', 'A thief who steals corporate secrets through the use of dream-sharing technology.', 'Sci-Fi', 0),
('Fight Club', 'An insomniac office worker and a devil-may-care soapmaker.', 'Drama', 0),
('Forrest Gump', 'The presidencies of Kennedy and Johnson, the Vietnam War, and more.', 'Romance', 0),
('The Matrix', 'A computer hacker learns from mysterious rebels about the true nature of his reality.', 'Sci-Fi', 0),
('Goodfellas', 'The story of Henry Hill and his life in the mob.', 'Biography', 0),
('Interstellar', 'A team of explorers travel through a wormhole in space.', 'Sci-Fi', 0),
('Parasite', 'Greed and class discrimination threaten the newly formed symbiotic relationship.', 'Thriller', 0),
('Whiplash', 'A promising young drummer enrolls at a cut-throat music conservatory.', 'Drama', 0),
('The Prestige', 'After a tragic accident, two stage magicians engage in a battle.', 'Thriller', 0),
('The Lion King', 'Lion prince Simba and his father are targeted by his bitter uncle.', 'Animation', 0),
('Gladiator', 'A former Roman General sets out to exact vengeance against the corrupt emperor.', 'Action', 0),
('Titanic', 'A seventeen-year-old aristocrat falls in love with a kind but poor artist.', 'Romance', 0),
('Avatar', 'A paraplegic Marine dispatched to the moon Pandora.', 'Sci-Fi', 0),
('Joker', 'In Gotham City, mentally troubled comedian Arthur Fleck is disregarded.', 'Thriller', 0),
('Avengers: Endgame', 'After the devastating events of Infinity War, the universe is in ruins.', 'Action', 0),
('Coco', 'Aspiring musician Miguel, confronted with his family''s ban on music.', 'Animation', 0),
('Wall-E', 'In the distant future, a small waste-collecting robot inadvertently embarks on a journey.', 'Animation', 0),
('Toy Story', 'A cowboy doll is profoundly threatened and jealous when a new spaceman arrives.', 'Animation', 0),
('Back to the Future', 'Marty McFly, a 17-year-old high school student, is accidentally sent 30 years into the past.', 'Sci-Fi', 0),
('Alien', 'After a space merchant vessel receives an unknown transmission as a distress call.', 'Horror', 0),
('Psycho', 'A Phoenix secretary embezzles $40,000 from her employer''s client.', 'Horror', 0),
('The Shining', 'A family heads to an isolated hotel for the winter.', 'Horror', 0),
('Casablanca', 'A cynical expatriate American cafe owner struggles to decide.', 'Romance', 0),
('Blade Runner 2049', 'Young Blade Runner K''s discovery of a long-buried secret.', 'Sci-Fi', 0),
('Mad Max: Fury Road', 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler.', 'Action', 0),
('Dune: Part One', 'A noble family becomes embroiled in a war for control over the galaxy''s most valuable asset.', 'Sci-Fi', 0),
('Dune: Part Two', 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge.', 'Sci-Fi', 0),
('Oppenheimer', 'The story of American scientist J. Robert Oppenheimer.', 'Biography', 0),
('Barbie', 'Barbie suffers a crisis that leads her to question her world and her existence.', 'Comedy', 0),
('La La Land', 'While navigating their careers in Los Angeles, a pianist and an actress fall in love.', 'Romance', 0),
('Spider-Man: Into the Spider-Verse', 'Teen Miles Morales becomes the Spider-Man of his universe.', 'Animation', 0),
('The Grand Budapest Hotel', 'A writer encounters the owner of an aging high-class hotel.', 'Comedy', 0),
('Arrival', 'A linguist works with the military to communicate with alien lifeforms.', 'Sci-Fi', 0),
('Get Out', 'A young African-American visits his white girlfriend''s parents'' estate.', 'Horror', 0),
('Logan', 'In a future where mutants are nearly extinct, an elderly Logan leads a quiet life.', 'Action', 0),
('The Wolf of Wall Street', 'Based on the true story of Jordan Belfort.', 'Biography', 0),
('Shutter Island', 'In 1954, a U.S. Marshal investigates the disappearance of a murderer.', 'Thriller', 0),
('No Country for Old Men', 'Violence and mayhem ensue after a hunter stumbles upon a drug deal.', 'Crime', 0),
('There Will Be Blood', 'A story of family, religion, hatred, oil and madness.', 'Drama', 0),
('Finding Nemo', 'After his son is captured in the Great Barrier Reef and taken to Sydney.', 'Animation', 0),
('Up', '78-year-old Carl Fredricksen travels to Paradise Falls in his house equipped with balloons.', 'Animation', 0),
('Inside Out', 'After young Riley is uprooted from her Midwest life and moved to San Francisco.', 'Animation', 0),
('Soul', 'After landing the gig of a lifetime, a New York jazz pianist finds himself trapped.', 'Animation', 0),
('Her', 'In a near future, a lonely writer develops an unlikely relationship with an OS.', 'Romance', 0),
('Ex Machina', 'A young programmer is selected to participate in a ground-breaking experiment.', 'Sci-Fi', 0),
('Spotlight', 'The true story of how the Boston Globe uncovered the massive scandal.', 'Drama', 0),
('12 Years a Slave', 'In the antebellum United States, Solomon Northup, a free black man, is kidnapped.', 'Biography', 0),
('Moonlight', 'A young African-American man grapples with his identity and sexuality.', 'Drama', 0),
('Green Book', 'A working-class Italian-American bouncer becomes the driver of an African-American classical pianist.', 'Biography', 0),
('Bohemian Rhapsody', 'The story of the legendary British rock band Queen and lead singer Freddie Mercury.', 'Biography', 0),
('Rocketman', 'A musical fantasy about the fantastical human story of Elton John''s breakthrough years.', 'Biography', 0),
('A Star Is Born', 'A musician helps a young singer find fame as age and alcoholism send his own career into a downward spiral.', 'Romance', 0),
('Knives Out', 'A detective investigates the death of a patriarch of an eccentric, combative family.', 'Thriller', 0),
('Glass Onion', 'Famed Southern detective Benoit Blanc travels to Greece for his latest case.', 'Thriller', 0),
('Don''t Look Up', 'Two low-level astronomers must go on a giant media tour to warn mankind.', 'Comedy', 0),
('Everything Everywhere All At Once', 'A middle-aged Chinese immigrant is swept up into an insane adventure.', 'Sci-Fi', 0),
('Top Gun: Maverick', 'After thirty years, Maverick is still pushing the envelope as a top naval aviator.', 'Action', 0),
('The Batman', 'When the Riddler, a sadistic serial killer, begins murdering key political figures.', 'Action', 0),
('Black Panther', 'T''Challa, heir to the hidden but advanced kingdom of Wakanda, must step forward.', 'Action', 0),
('Guardians of the Galaxy', 'A group of intergalactic criminals must pull together to stop a fanatical warrior.', 'Action', 0),
('Deadpool', 'A wisecracking mercenary gets experimented on and becomes immortal.', 'Comedy', 0),
('Doctor Strange', 'While on a journey of physical and spiritual healing, a neurosurgeon is drawn into the world of the mystic arts.', 'Action', 0),
('Thor: Ragnarok', 'Imprisoned on the planet Sakaar, Thor must race against time.', 'Action', 0),
('Iron Man', 'After being held captive in an Afghan cave, billionaire engineer Tony Stark creates a unique weaponized suit of armor.', 'Action', 0),
('Captain America: The Winter Soldier', 'As Steve Rogers struggles to embrace his role in the modern world.', 'Action', 0),
('Eternal Sunshine of the Spotless Mind', 'When their relationship turns sour, a couple undergoes a medical procedure to have each other erased from their memories.', 'Romance', 0),
('Amélie', 'Amélie is an innocent and naive girl in Paris with her own sense of justice.', 'Romance', 0),
('Spirited Away', 'During her family''s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods.', 'Animation', 0),
('Princess Mononoke', 'On a journey to find the cure for a Tatarigami''s curse, Ashitaka finds himself in the middle of a war.', 'Animation', 0),
('Howl''s Moving Castle', 'When an unconfident young woman is cursed with an old body by a spiteful witch.', 'Animation', 0),
('Your Name', 'Two strangers find themselves linked in a bizarre way.', 'Animation', 0),
('Akira', 'A secret military project endangers Neo-Tokyo when it turns a biker gang member into a rampaging psychic.', 'Animation', 0),
('Ghost in the Shell', 'A cyborg policewoman and her partner hunt a mysterious and powerful hacker.', 'Animation', 0),
('Neon Genesis Evangelion', 'Teenagers pilot giant robots to protect Earth from monsters.', 'Animation', 0),
('Cowboy Bebop: The Movie', 'A terrorist explosion releases a deadly virus on Mars.', 'Animation', 0),
('Oldboy', 'After being kidnapped and imprisoned for fifteen years, Oh Dae-Su is released.', 'Thriller', 0),
('Train to Busan', 'While a zombie virus breaks out in South Korea, passengers struggle to survive on the train.', 'Horror', 0),
('Squid Game (Movie Edit)', 'Hundreds of cash-strapped players accept a strange invitation.', 'Thriller', 0),
('Memories of Murder', 'In a small Korean province in 1986, two detectives struggle with the case.', 'Crime', 0),
('Seven Samurai', 'A poor village under attack by bandits recruits seven unemployed samurai.', 'Action', 0),
('Rashomon', 'The rape of a bride and the murder of her samurai husband are recalled.', 'Crime', 0),
('Godzilla Minus One', 'Post war Japan faces a new threat.', 'Sci-Fi', 0),
('Shin Godzilla', 'Japan is plunged into chaos upon the appearance of a giant monster.', 'Sci-Fi', 0),
('District 9', 'Violence ensues after an extraterrestrial race forced to live in slum-like conditions.', 'Sci-Fi', 0),
('Chappie', 'In the near future, crime is patrolled by a mechanized police force.', 'Sci-Fi', 0),
('Elysium', 'In the year 2154, the very wealthy live on a man-made space station.', 'Sci-Fi', 0),
('Tenet', 'Armed with only one word, Tenet, and fighting for the survival of the entire world.', 'Action', 0),
('Memento', 'A man with short-term memory loss attempts to track down his wife''s murderer.', 'Thriller', 0),
('Dunkirk', 'Allied soldiers from Belgium, the British Empire and France are surrounded.', 'Action', 0),
('Gravity', 'Two astronauts work together to survive after an accident leaves them stranded in space.', 'Sci-Fi', 0),
('Birdman', 'A washed-up superhero actor attempts to revive his fading career.', 'Comedy', 0),
('The Revenant', 'A frontiersman on a fur trading expedition in the 1820s fights for survival.', 'Action', 0),
('Roma', 'A year in the life of a middle-class family''s maid in Mexico City.', 'Drama', 0),
('Pan''s Labyrinth', 'In the Falangist Spain of 1944, the bookish young stepdaughter of a sadistic army officer.', 'Fantasy', 0),
('The Shape of Water', 'At a top secret research facility in the 1960s, a lonely janitor forms a unique relationship.', 'Fantasy', 0);

-- --------------------------------------------------------
-- 3. ЛЮДИ (100 шт.)
-- --------------------------------------------------------
INSERT INTO people (first_name, last_name, profession, biography) VALUES
('Christopher', 'Nolan', 'director', 'British-American film director, producer, and screenwriter.'),
('Leonardo', 'DiCaprio', 'actor', 'American actor and film producer.'),
('Robert', 'De Niro', 'actor', 'American actor, producer, and director.'),
('Al', 'Pacino', 'actor', 'American actor and filmmaker.'),
('Morgan', 'Freeman', 'actor', 'American actor, director, and narrator.'),
('Tim', 'Robbins', 'actor', 'American actor, filmmaker, and musician.'),
('Marlon', 'Brando', 'actor', 'American actor and film director.'),
('Christian', 'Bale', 'actor', 'English actor. Known for his versatility and intense method acting.'),
('Heath', 'Ledger', 'actor', 'Australian actor and music video director.'),
('Quentin', 'Tarantino', 'director', 'American film director, screenwriter, producer, and actor.'),
('John', 'Travolta', 'actor', 'American actor, singer, and dancer.'),
('Uma', 'Thurman', 'actor', 'American actress and model.'),
('Steven', 'Spielberg', 'director', 'American film director, producer, and screenwriter.'),
('Liam', 'Neeson', 'actor', 'Actor from Northern Ireland.'),
('Brad', 'Pitt', 'actor', 'American actor and film producer.'),
('Edward', 'Norton', 'actor', 'American actor and filmmaker.'),
('Tom', 'Hanks', 'actor', 'American actor and filmmaker.'),
('Keanu', 'Reeves', 'actor', 'Canadian actor. Born in Beirut and raised in Toronto.'),
('Laurence', 'Fishburne', 'actor', 'American actor, playwright, producer, and film director.'),
('Carrie-Anne', 'Moss', 'actor', 'Canadian actress.'),
('Martin', 'Scorsese', 'director', 'American film director, producer, screenwriter, and actor.'),
('Ray', 'Liotta', 'actor', 'American actor and producer.'),
('Joe', 'Pesci', 'actor', 'American actor and musician.'),
('Matthew', 'McConaughey', 'actor', 'American actor and producer.'),
('Anne', 'Hathaway', 'actor', 'American actress.'),
('Jessica', 'Chastain', 'actor', 'American actress and producer.'),
('Bong', 'Joon-ho', 'director', 'South Korean film director, producer, and screenwriter.'),
('Kang-ho', 'Song', 'actor', 'South Korean actor.'),
('Miles', 'Teller', 'actor', 'American actor.'),
('J.K.', 'Simmons', 'actor', 'American actor.'),
('Hugh', 'Jackman', 'actor', 'Australian actor, singer, and producer.'),
('Scarlett', 'Johansson', 'actor', 'American actress and singer.'),
('Russell', 'Crowe', 'actor', 'Actor, film producer, director and musician.'),
('Joaquin', 'Phoenix', 'actor', 'American actor, producer, and animal rights activist.'),
('Ridley', 'Scott', 'director', 'English film director and producer.'),
('Sigourney', 'Weaver', 'actor', 'American actress and producer.'),
('James', 'Cameron', 'director', 'Canadian filmmaker.'),
('Kate', 'Winslet', 'actor', 'English actress.'),
('Sam', 'Worthington', 'actor', 'Australian actor.'),
('Zoe', 'Saldana', 'actor', 'American actress.'),
('Robert', 'Downey Jr.', 'actor', 'American actor and producer.'),
('Chris', 'Evans', 'actor', 'American actor.'),
('Mark', 'Ruffalo', 'actor', 'American actor and producer.'),
('Chris', 'Hemsworth', 'actor', 'Australian actor.'),
('Tom', 'Holland', 'actor', 'English actor.'),
('Zendaya', 'Coleman', 'actor', 'American actress and singer.'),
('Denis', 'Villeneuve', 'director', 'French-Canadian film director and screenwriter.'),
('Timothée', 'Chalamet', 'actor', 'American and French actor.'),
('Zendaya', 'Stoermer', 'actor', 'American actress and singer.'), -- Duplicate intentional for diversity in testing
('Rebecca', 'Ferguson', 'actor', 'Swedish actress.'),
('Oscar', 'Isaac', 'actor', 'Guatemalan-born American actor.'),
('Jason', 'Momoa', 'actor', 'American actor.'),
('Josh', 'Brolin', 'actor', 'American actor.'),
('Javier', 'Bardem', 'actor', 'Spanish actor.'),
('Cillian', 'Murphy', 'actor', 'Irish actor.'),
('Emily', 'Blunt', 'actor', 'British actress.'),
('Matt', 'Damon', 'actor', 'American actor, film producer, and screenwriter.'),
('Florence', 'Pugh', 'actor', 'English actress.'),
('Ryan', 'Gosling', 'actor', 'Canadian actor.'),
('Margot', 'Robbie', 'actor', 'Australian actress and producer.'),
('Greta', 'Gerwig', 'director', 'American actress, screenwriter, and director.'),
('Emma', 'Stone', 'actor', 'American actress.'),
('Damien', 'Chazelle', 'director', 'American film director and screenwriter.'),
('Wes', 'Anderson', 'director', 'American filmmaker.'),
('Ralph', 'Fiennes', 'actor', 'English actor, film producer, and director.'),
('Adrien', 'Brody', 'actor', 'American actor and producer.'),
('Saoirse', 'Ronan', 'actor', 'American-born Irish actress.'),
('Jordan', 'Peele', 'director', 'American actor, comedian, and filmmaker.'),
('Daniel', 'Kaluuya', 'actor', 'British actor and writer.'),
('Allison', 'Williams', 'actor', 'American actress.'),
('Bradley', 'Cooper', 'actor', 'American actor and filmmaker.'),
('Lady', 'Gaga', 'actor', 'American singer, songwriter, and actress.'),
('Rami', 'Malek', 'actor', 'American actor.'),
('Taron', 'Egerton', 'actor', 'Welsh actor and singer.'),
('Daniel', 'Craig', 'actor', 'English actor.'),
('Ana', 'de Armas', 'actor', 'Cuban-Spanish actress.'),
('Jamie', 'Lee Curtis', 'actor', 'American actress and writer.'),
('Michelle', 'Yeoh', 'actor', 'Malaysian actress.'),
('Ke Huy', 'Quan', 'actor', 'American actor.'),
('Tom', 'Cruise', 'actor', 'American actor and producer.'),
('Val', 'Kilmer', 'actor', 'American actor.'),
('Robert', 'Pattinson', 'actor', 'English actor.'),
('Paul', 'Dano', 'actor', 'American actor.'),
('Colin', 'Farrell', 'actor', 'Irish actor.'),
('Chadwick', 'Boseman', 'actor', 'American actor.'),
('Michael', 'B. Jordan', 'actor', 'American actor.'),
('Ryan', 'Coogler', 'director', 'American film director, producer, and screenwriter.'),
('Chris', 'Pratt', 'actor', 'American actor.'),
('Dave', 'Bautista', 'actor', 'American actor and retired professional wrestler.'),
('Ryan', 'Reynolds', 'actor', 'Canadian-American actor and film producer.'),
('Benedict', 'Cumberbatch', 'actor', 'English actor.'),
('Hayao', 'Miyazaki', 'director', 'Japanese animator, director, producer, screenwriter, author, and manga artist.'),
('Akira', 'Kurosawa', 'director', 'Japanese film director and screenwriter.'),
('Toshiro', 'Mifune', 'actor', 'Japanese actor.'),
('Bong', 'Joon-ho', 'producer', 'Also produces films.'),
('Park', 'Chan-wook', 'director', 'South Korean film director, screenwriter, producer, and former film critic.'),
('Choi', 'Min-sik', 'actor', 'South Korean actor.'),
('Gong', 'Yoo', 'actor', 'South Korean actor.'),
('Lee', 'Jung-jae', 'actor', 'South Korean actor.');


-- --------------------------------------------------------
-- 4. ЗВ'ЯЗКИ ФІЛЬМИ-ЛЮДИ (movie_people)
-- --------------------------------------------------------
-- Вставляємо рандомні зв'язки, намагаючись попадати в логіку (але для тесту це не критично, головне наявність)
INSERT INTO movie_people (movie_id, person_id) VALUES
(1, 5), (1, 6), -- Shawshank: Freeman, Robbins
(2, 3), (2, 4), (2, 7), -- Godfather: De Niro, Pacino, Brando
(3, 1), (3, 8), (3, 9), -- Dark Knight: Nolan, Bale, Ledger
(4, 10), (4, 11), (4, 12), -- Pulp Fiction: Tarantino, Travolta, Thurman
(5, 13), (5, 14), -- Schindler: Spielberg, Neeson
(6, 1), (6, 2), (6, 56), -- Inception: Nolan, DiCaprio, Cillian Murphy
(7, 15), (7, 16), -- Fight Club: Pitt, Norton
(8, 17), -- Forrest Gump: Hanks
(9, 18), (9, 19), (9, 20), -- Matrix: Keanu, Fishburne, Moss
(10, 21), (10, 3), (10, 22), (10, 23), -- Goodfellas: Scorsese, De Niro, Liotta, Pesci
(11, 1), (11, 24), (11, 25), (11, 26), -- Interstellar: Nolan, McConaughey, Hathaway, Chastain
(12, 27), (12, 28), -- Parasite: Bong Joon-ho, Song Kang-ho
(13, 29), (13, 30), -- Whiplash: Teller, Simmons
(14, 1), (14, 8), (14, 31), (14, 32), -- Prestige: Nolan, Bale, Jackman, Johansson
(16, 35), (16, 33), (16, 34), -- Gladiator: Ridley Scott, Crowe, Phoenix
(17, 37), (17, 2), (17, 38), -- Titanic: Cameron, Leo, Winslet
(18, 37), (18, 39), (18, 40), -- Avatar: Cameron, Worthington, Saldana
(19, 34), -- Joker: Phoenix
(20, 41), (20, 42), (20, 43), (20, 44), (20, 32), -- Avengers: Downey, Evans, Ruffalo, Hemsworth, Johansson
(28, 2), -- Casablanca (Just putting Leo as placeholder or ignore realism for old films if actor not in list)
(29, 47), (29, 59), (29, 76), -- BR 2049: Villeneuve, Gosling, Ana de Armas
(31, 47), (31, 48), (31, 49), (31, 50), (31, 51), (31, 52), (31, 53), -- Dune: Villeneuve, Chalamet, Zendaya, Ferguson, Isaac, Momoa, Brolin
(32, 47), (32, 48), (32, 49), (32, 54), (32, 57), -- Dune 2: Villeneuve, Chalamet, Zendaya, Bardem, Pugh
(33, 1), (33, 56), (33, 55), (33, 41), (33, 57), -- Oppenheimer: Nolan, Murphy, Blunt, Downey, Pugh
(34, 61), (34, 60), (34, 59), -- Barbie: Gerwig, Robbie, Gosling
(35, 63), (35, 59), (35, 62), (35, 30), -- La La Land: Chazelle, Gosling, Stone, Simmons
(36, 45), -- Spiderverse: Holland (voice placeholder)
(37, 64), (37, 65), (37, 66), (37, 67), -- Grand Budapest: Anderson, Fiennes, Brody, Ronan
(39, 68), (39, 69), (39, 70), -- Get Out: Peele, Kaluuya, Williams
(41, 21), (41, 2), (41, 59), -- Wolf of Wall St: Scorsese, Leo, Robbie
(42, 21), (42, 2), (42, 43), -- Shutter Island: Scorsese, Leo, Ruffalo
(53, 15), -- 12 Years a Slave: Pitt
(57, 72), -- Bohemian Rhapsody: Malek
(58, 73), -- Rocketman: Egerton
(59, 71), (59, 72), -- A Star is Born: Cooper, Gaga
(60, 74), (60, 42), (60, 76), -- Knives Out: Craig, Evans, Ana de Armas
(61, 74), (61, 16), -- Glass Onion: Craig, Norton
(62, 2), (62, 48), (62, 60), -- Dont Look Up: Leo, Chalamet, Lawrence(Robbie placeholder)
(63, 78), (63, 79), (63, 77), -- Everything Everywhere: Yeoh, Quan, Curtis
(64, 80), (64, 81), -- Top Gun: Cruise, Kilmer
(65, 82), (65, 83), (65, 84), -- Batman: Pattinson, Dano, Farrell
(66, 87), (66, 85), (66, 86), -- Black Panther: Coogler, Boseman, Jordan
(67, 88), (67, 40), (67, 89), -- Guardians: Pratt, Saldana, Bautista
(68, 90), -- Deadpool: Reynolds
(69, 91), -- Dr Strange: Cumberbatch
(71, 41), -- Iron Man: Downey
(72, 42), (72, 32), -- Winter Soldier: Evans, Johansson
(78, 92), -- Spirited Away: Miyazaki
(79, 92), -- Princess Mononoke: Miyazaki
(80, 92), -- Howl's Moving Castle: Miyazaki
(85, 96), (85, 97), -- Oldboy: Park Chan-wook, Choi Min-sik
(86, 98), -- Train to Busan: Gong Yoo
(87, 99), -- Squid Game: Lee Jung-jae
(88, 27), (88, 28), -- Memories of Murder: Bong, Song
(89, 93), (89, 94), -- Seven Samurai: Kurosawa, Mifune
(90, 93), (90, 94), -- Rashomon: Kurosawa, Mifune
(95, 47), -- Sicario (Placeholder): Villeneuve
(97, 47), -- Prisoners (Placeholder): Villeneuve
(99, 1), (99, 29); -- Tenet: Nolan, Washington (Teller placeholder)

-- --------------------------------------------------------
-- 5. ВІДГУКИ (REVIEWS) (200+ шт.)
-- --------------------------------------------------------
-- Генеруємо SQL для відгуків.
-- Рейтинг від 1 до 10.
-- User IDs від 1 до 50.
-- Movie IDs від 1 до 100.

INSERT INTO reviews (title, body, rating, movie_id, user_id) VALUES
('Masterpiece', 'Absolutely loved it, a must watch.', 10, 1, 6),
('Classic', 'One of the best movies ever made.', 10, 1, 7),
('Overrated?', 'It is good, but maybe not THAT good.', 8, 1, 8),
('Godfather is King', 'Brando is a genius.', 10, 2, 9),
('Too long', 'Got bored in the middle.', 6, 2, 10),
('Dark and Gritty', 'Heath Ledger is the best Joker.', 10, 3, 11),
('Action packed', 'Nolan delivers again.', 9, 3, 12),
('Confusing', 'I did not understand the plot.', 5, 3, 13),
('Fun ride', 'Tarantino style is unique.', 9, 4, 14),
('Violence', 'Too much blood for me.', 4, 4, 15),
('Touching', 'Cried at the end.', 10, 5, 16),
('Heavy', 'Hard to watch but important.', 9, 5, 17),
('Dream within a dream', 'My brain hurts, in a good way.', 9, 6, 18),
('Visuals!', 'Stunning effects.', 10, 6, 19),
('Slept', 'Too complex.', 3, 6, 20),
('First rule', 'We do not talk about it.', 10, 7, 21),
('Twist', 'Did not see that coming.', 9, 7, 22),
('Life is like a box of chocolates', 'Tom Hanks is a treasure.', 10, 8, 23),
('Run Forrest', 'Inspirational.', 8, 8, 24),
('Revolutionary', 'Changed sci-fi forever.', 10, 9, 25),
('Cool action', 'Bullet time is awesome.', 9, 9, 26),
('Mafia life', 'Better than Godfather?', 9, 10, 27),
('Realistic', 'Feels very authentic.', 8, 10, 28),
('Space opera', 'Visuals are unmatched.', 9, 11, 29),
('Emotional', 'Murph!', 10, 11, 30),
('Long', 'A bit slow paced.', 7, 11, 31),
('Social commentary', 'Very deep.', 10, 12, 32),
('Thriller', 'Kept me on the edge.', 9, 12, 33),
('Intense', 'My heart was racing.', 10, 13, 34),
('Music', 'Not quite my tempo.', 10, 13, 35),
('Magic', 'Bale vs Jackman is epic.', 9, 14, 36),
('Childhood', 'Best Disney movie.', 10, 15, 37),
('Simba', 'Hakuna Matata.', 9, 15, 38),
('Are you not entertained?', 'Crowe is a beast.', 9, 16, 39),
('Epic', 'Great battle scenes.', 8, 16, 40),
('Sad', 'There was room on the door!', 7, 17, 41),
('Romantic', 'Classic love story.', 9, 17, 42),
('Blue people', 'Story is meh, visuals great.', 8, 18, 43),
('3D', 'Best theater experience.', 10, 18, 44),
('Disturbing', 'Phoenix deserves the Oscar.', 10, 19, 45),
('Society', 'We live in a society.', 8, 19, 46),
('Fan service', 'Avengers assemble!', 10, 20, 47),
('Finale', 'Perfect ending.', 10, 20, 48),
('Colorful', 'Great music and story.', 10, 21, 49),
('Cute', 'Wall-E is adorable.', 9, 22, 50),
('Nostalgia', 'Takes me back.', 10, 23, 6),
('Time travel', 'Great Scott!', 10, 24, 7),
('Scary', 'In space no one can hear you scream.', 9, 25, 8),
('Classic Horror', 'The shower scene.', 9, 26, 9),
('Here is Johnny', 'Nicholson is crazy.', 9, 27, 10),
('Black and white', 'Beautiful.', 10, 28, 11),
('Slow burn', 'Beautiful cinematography.', 9, 29, 12),
('Ryan Gosling', 'Literally me.', 10, 29, 13),
('Action perfection', 'Practical effects!', 10, 30, 14),
('Shiny and Chrome', 'Witness me!', 9, 30, 15),
('Spice must flow', 'Massive scale.', 9, 31, 16),
('Sand', 'I hate sand. Wait, wrong movie.', 8, 31, 17),
('Lisan al Gaib', 'Cinematic masterpiece.', 10, 32, 18),
('Epic sequel', 'Better than part 1.', 10, 32, 19),
('Explosive', 'Physics and drama.', 9, 33, 20),
('Long movie', 'But worth it.', 9, 33, 21),
('Pink', 'Hi Barbie!', 8, 34, 22),
('Funny', 'Ken is the best.', 9, 34, 23),
('Musical', 'City of stars.', 9, 35, 24),
('Ending', 'Bittersweet.', 10, 35, 25),
('Animation style', 'Unique and fresh.', 10, 36, 26),
('Miles Morales', 'Best Spidey.', 10, 36, 27),
('Quirky', 'Wes Anderson style.', 9, 37, 28),
('Smart sci-fi', 'Linguistics!', 9, 38, 29),
('Creepy', 'Smart horror.', 9, 39, 30),
('Sad ending', 'Best Wolverine movie.', 10, 40, 31),
('Crazy', 'Leo goes wild.', 9, 41, 32),
('Money', 'Too much swearing.', 7, 41, 33),
('Mind bending', 'The ending twisted my brain.', 8, 42, 34),
('Villain', 'Chigurh is scary.', 10, 43, 35),
('Acting', 'Daniel Day-Lewis is a god.', 10, 44, 36),
('Fish', 'Just keep swimming.', 9, 45, 37),
('Opening scene', 'Cried in first 10 mins.', 10, 46, 38),
('Emotions', 'Bing Bong!', 9, 47, 39),
('Jazz', 'Deep meaning of life.', 9, 48, 40),
('AI', 'Scary future.', 8, 49, 41),
('Robot', 'Is she alive?', 9, 50, 42),
('Journalism', 'Important story.', 9, 51, 43),
('History', 'Painful to watch.', 9, 52, 44),
('Cinematography', 'Beautiful colors.', 8, 53, 45),
('Road trip', 'Feel good movie.', 8, 54, 46),
('Queen', 'Rami Malek is Freddie.', 9, 55, 47),
('Rocketman', 'Better than Bohemian Rhapsody.', 8, 56, 48),
('Music', 'Shallow is a hit.', 9, 57, 49),
('Whodunnit', 'Modern Agatha Christie.', 9, 58, 50),
('Sequel', 'Not as good as first one.', 7, 59, 6),
('Satire', 'Too real.', 8, 60, 7),
('Multiverse', 'Bagel.', 10, 61, 8),
('Rocks', 'The rock scene made me cry.', 10, 61, 9),
('Planes', 'Real flying scenes.', 10, 62, 10),
('Detective', 'Nirvana song.', 9, 63, 11),
('Wakanda Forever', 'Culture.', 9, 64, 12),
('Fun', 'Soundtrack is amazing.', 9, 65, 13),
('R-rated', 'Funny and violent.', 9, 66, 14),
('Visuals', 'Trippy.', 8, 67, 15),
('Comedy', 'Thor is funny now.', 9, 68, 16),
('Start', 'Where MCU began.', 9, 69, 17),
('Spy thriller', 'Best Cap movie.', 10, 70, 18),
('Memory', 'Beautiful story.', 10, 71, 19),
('French', 'Charming.', 9, 72, 20),
('Anime', 'Ghibli magic.', 10, 73, 21),
('Nature', 'Epic scale.', 10, 74, 22),
('Magic', 'Beautiful animation.', 9, 75, 23),
('Body swap', 'Cried.', 10, 76, 24),
('Cyberpunk', 'Iconic.', 9, 77, 25),
('Philosophy', 'What is a soul?', 9, 78, 26),
('Robots', 'Psychological.', 8, 79, 27),
('Space cowboy', 'Jazz and blues.', 10, 80, 28),
('Hallway scene', 'One take.', 10, 81, 29),
('Zombies', 'Scary and sad.', 9, 82, 30),
('Games', 'Deadly.', 8, 83, 31),
('Rain', 'Korean noir.', 9, 84, 32),
('Samurai', 'The original.', 10, 85, 33),
('Truth', 'Different perspectives.', 9, 86, 34),
('Monster', 'Best Godzilla.', 10, 87, 35),
('Bureaucracy', 'Satire on govt.', 8, 88, 36),
('Aliens', 'Prawns.', 9, 89, 37),
('Robot gangster', 'Die Antwoord?', 6, 90, 38),
('Space station', 'Okay movie.', 7, 91, 39),
('Backwards', 'Had to watch twice.', 8, 92, 40),
('Memory loss', 'Genius script.', 10, 93, 41),
('War', 'Intense sound.', 9, 94, 42),
('Space', 'Scary silence.', 9, 95, 43),
('One shot', 'Keaton is back.', 9, 96, 44),
('Bear', 'Leo got the Oscar.', 8, 97, 45),
('Black and white', 'Personal story.', 9, 98, 46),
('Fairy tale', 'Dark fantasy.', 10, 99, 47),
('Love', 'Fish man.', 8, 100, 48),
('Great', 'Enjoyed it.', 7, 1, 2),
('Bad', 'Wasted time.', 3, 2, 3),
('Average', 'Popcorn movie.', 5, 3, 4),
('Good', 'Will watch again.', 8, 4, 5),
('Excellent', 'Highly recommend.', 9, 5, 6),
('Masterpiece', '10/10', 10, 33, 1),
('Wow', 'Just wow.', 10, 32, 1),
('Okay', 'Could be better.', 6, 50, 1),
('Director cut', 'Much better.', 9, 35, 2),
('Sound', 'Too loud.', 7, 33, 3),
('Acting', 'Superb.', 9, 40, 4),
('Script', 'Well written.', 8, 45, 5),
('Effects', 'CGI is bad.', 4, 60, 7),
('Length', 'Too short.', 6, 70, 8),
('Cast', 'Great ensemble.', 9, 75, 9),
('Ending', 'Disappointing.', 5, 80, 10),
('Original', 'Never seen before.', 9, 85, 11),
('Remake', 'Original was better.', 4, 90, 12),
('Color', 'Palette is nice.', 8, 95, 13),
('Pacing', 'Too fast.', 6, 100, 14),
('Dialogue', 'Witty.', 8, 15, 15),
('Atmosphere', 'Spooky.', 9, 26, 16),
('Twist', 'Predictable.', 5, 42, 17),
('Genre', 'Best in class.', 9, 55, 18),
('Score', 'Hans Zimmer!', 10, 11, 19),
('Editing', 'Top notch.', 9, 13, 20),
('Funny', 'Laughed hard.', 8, 68, 21),
('Serious', 'Very grim.', 7, 65, 22),
('Family', 'Good for kids.', 9, 46, 23),
('Adult', 'Not for kids.', 8, 4, 24),
('Classic', 'Timeless.', 10, 2, 25),
('Modern', 'Fresh take.', 8, 64, 26),
('Hero', 'Inspiring.', 9, 70, 27),
('Villain', 'Weak motivation.', 6, 69, 28),
('Costumes', 'Gorgeous.', 9, 37, 29),
('Makeup', 'Realistic.', 9, 82, 30),
('Stunts', 'Tom Cruise is crazy.', 10, 64, 31),
('Cars', 'Fast.', 8, 30, 32),
('Space', 'Vast.', 9, 11, 33),
('Water', 'Wet.', 7, 18, 34),
('Fire', 'Hot.', 8, 30, 35),
('Ice', 'Cold.', 8, 17, 36),
('Love', 'True.', 9, 28, 37),
('Hate', 'Strong.', 8, 7, 38),
('Friendship', 'Goals.', 9, 1, 39),
('Betrayal', 'Shocking.', 9, 10, 40);

-- --------------------------------------------------------
-- 6. ОНОВЛЕННЯ РЕЙТИНГІВ ФІЛЬМІВ
-- --------------------------------------------------------
-- Автоматично розраховуємо середній рейтинг для кожного фільму на основі таблиці reviews
UPDATE movies m
SET rating = (
    SELECT ROUND(AVG(rating), 1)
    FROM reviews r
    WHERE r.movie_id = m.id
)
WHERE EXISTS (
    SELECT 1
    FROM reviews r
    WHERE r.movie_id = m.id
);