export const movieQuotes = [
  {
    id: 1,
    quote:
      "Життя - як коробка шоколадних цукерок, ніколи не знаєш, що тобі дістанеться",
    movie: "Forrest Gump",
    character: "Форрест Гамп",
    year: 1994,
  },
  {
    id: 2,
    quote: "Чому ми падаємо? Щоб навчитися підніматися",
    movie: "Batman Begins",
    character: "Томас Вейн",
    year: 2005,
  },
  {
    id: 3,
    quote: "Найтемніша ніч настає перед світанком",
    movie: "The Dark Knight",
    character: "Гарві Дент",
    year: 2008,
  },
  {
    id: 4,
    quote: "Щастя справжнє лише тоді, коли ним ділишся",
    movie: "Into the Wild",
    character: "Крістофер Маккендлесс",
    year: 2007,
  },
  {
    id: 5,
    quote:
      "Вчора - це історія, завтра - таємниця, а сьогодні - це дар. Тому воно і зветься сьогоденням",
    movie: "Kung Fu Panda",
    character: "Майстер Угвей",
    year: 2008,
  },
  {
    id: 6,
    quote: "Не дозволяй нікому казати тобі, що ти чогось не можеш. Навіть мені",
    movie: "The Pursuit of Happyness",
    character: "Кріс Гарднер",
    year: 2006,
  },
  {
    id: 7,
    quote: "Страх - це вбивця розуму",
    movie: "Dune",
    character: "Пол Атрейдес",
    year: 2021,
  },
  {
    id: 8,
    quote: "Іноді треба зробити крок у прірву і довіритися долі",
    movie: "Inception",
    character: "Домінік Кобб",
    year: 2010,
  },
  {
    id: 9,
    quote: "Найважливіші речі - найпростіші",
    movie: "The Shawshank Redemption",
    character: "Енді Дюфрейн",
    year: 1994,
  },
  {
    id: 10,
    quote: "З великою силою приходить велика відповідальність",
    movie: "Spider-Man",
    character: "Дядько Бен",
    year: 2002,
  },
  {
    id: 11,
    quote: "Життя знаходить свій шлях",
    movie: "Jurassic Park",
    character: "Ієн Малкольм",
    year: 1993,
  },
  {
    id: 12,
    quote: "Неможливе можливе",
    movie: "Mission: Impossible",
    character: "Ітан Хант",
    year: 1996,
  },
  {
    id: 13,
    quote: "Єдиний спосіб зробити щось правильно - робити це з пристрастю",
    movie: "Ratatouille",
    character: "Огюст Гюсто",
    year: 2007,
  },
  {
    id: 14,
    quote: "Не треба плакати, бо все минає, треба посміхатися, бо все було",
    movie: "The Notebook",
    character: "Ноа",
    year: 2004,
  },
  {
    id: 15,
    quote: "Час - найцінніший ресурс",
    movie: "Interstellar",
    character: "Купер",
    year: 2014,
  },
];

export const getQuoteOfTheDay = () => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
  );
  const index = dayOfYear % movieQuotes.length;
  return movieQuotes[index];
};
