export const gallery = [
  {
    id: 1,
    url: "https://m.media-amazon.com/images/I/51v5ZpFyaFL._AC_.jpg",
    title: "Inception",
    caption: "Кристофер Нолан створив неймовірний світ сновидінь",
    year: 2010,
  },
  {
    id: 2,
    url: "https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
    title: "The Shawshank Redemption",
    caption: "Надія - це добра річ, можливо найкраща з речей",
    year: 1994,
  },
  {
    id: 6,
    url: "https://m.media-amazon.com/images/M/MV5BNWIwODRlZTUtY2U3ZS00Yzg1LWJhNzYtMmZiYmEyNmU1NjMzXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg",
    title: "Forrest Gump",
    caption: "Життя - як коробка шоколадних цукерок",
    year: 1994,
  },

  {
    id: 8,
    url: "https://m.media-amazon.com/images/M/MV5BMjExNzM0NDM0N15BMl5BanBnXkFtZTcwMzkxOTUwNw@@._V1_.jpg",
    title: "Titanic",
    caption: "Найбільша романтична історія всіх часів",
    year: 1997,
  },
  {
    id: 10,
    url: "https://www.pluggedin.com/wp-content/uploads/2019/12/avatar-1024x576.jpg",
    title: "Avatar",
    caption: "Епічний світ Пандори",
    year: 2009,
  },
  {
    id: 11,
    url: "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
    title: "The Godfather",
    caption: "Пропозиція, від якої не можна відмовитися",
    year: 1972,
  },
  {
    id: 12,
    url: "https://m.media-amazon.com/images/I/51v5ZpFyaFL._AC_.jpg",
    title: "Fight Club",
    caption: "Перше правило Бійцівського клубу...",
    year: 1999,
  },
  {
    id: 13,
    url: "https://image.tmdb.org/t/p/original/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    title: "The Lord of the Rings",
    caption: "Одна каблучка, щоб усіма правити",
    year: 2001,
  },
  {
    id: 16,
    url: "https://upload.wikimedia.org/wikipedia/en/5/53/Parasite_%282019_film%29.png",
    title: "Parasite",
    caption: "Соціальна драма року",
    year: 2019,
  },
  {
    id: 18,
    url: "https://upload.wikimedia.org/wikipedia/en/0/00/Spider-Man_No_Way_Home_poster.jpg",
    title: "Spider-Man: No Way Home",
    caption: "З великою силою приходить велика відповідальність",
    year: 2021,
  },
];

export const getQuoteOfTheDay = () => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
  );
  const index = dayOfYear % gallery.length;
  return gallery[index];
};
