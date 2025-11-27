import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"; 
import { getAllMovies, getAllPeople } from "../api" 
import MovieCard from "../components/MovieCard"
import { useAuth } from '../hooks/useAuth'; 
import { articles } from "../data/articles";
import { movieQuotes, getQuoteOfTheDay } from "../data/quotes";
import { gallery } from "../data/gallery";
const SearchIcon = () => (
  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
)

export default function Movies() {
  const { isAdmin } = useAuth();
  const [movies, setMovies] = useState([])
  const [allPeople, setAllPeople] = useState([])

  const [searchTerm, setSearchTerm] = useState("")
  const [genreFilter, setGenreFilter] = useState("")
  const [peopleSearchTerm, setPeopleSearchTerm] = useState("")
  const [sortOption, setSortOption] = useState("newest") 
  
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [quoteOfDay, setQuoteOfDay] = useState(null);

  const [showGallery, setShowGallery] = useState(false);
const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);
const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  const openArticle = (article) => {
  setSelectedArticle(article);
  document.body.style.overflow = 'hidden';
};

const closeArticle = () => {
  setSelectedArticle(null);
  document.body.style.overflow = 'auto';
};

const openGallery = () => {
  setShowGallery(true);
  document.body.style.overflow = 'hidden';
};

const closeGallery = () => {
  setShowGallery(false);
  setSelectedGalleryImage(null);
  document.body.style.overflow = 'auto';
};

const openGalleryImage = (index) => {
  setCurrentGalleryIndex(index);
  setSelectedGalleryImage(gallery[index]);
};

const closeGalleryImage = () => {
  setSelectedGalleryImage(null);
};

const nextGalleryImage = () => {
  const newIndex = (currentGalleryIndex + 1) % gallery.length;
  setCurrentGalleryIndex(newIndex);
  setSelectedGalleryImage(gallery[newIndex]);
};

const prevGalleryImage = () => {
  const newIndex = (currentGalleryIndex - 1 + gallery.length) % gallery.length;
  setCurrentGalleryIndex(newIndex);
  setSelectedGalleryImage(gallery[newIndex]);
};

useEffect(() => {
  const handleKeyPress = (e) => {
    if (!selectedGalleryImage) return;
    
    if (e.key === 'Escape') closeGalleryImage();
    if (e.key === 'ArrowRight') nextGalleryImage();
    if (e.key === 'ArrowLeft') prevGalleryImage();
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [selectedGalleryImage, currentGalleryIndex]);
  useEffect(() => {
    setQuoteOfDay(getQuoteOfTheDay());
    const fetchData = async () => {
      try {
        const [moviesData, peopleData] = await Promise.all([
          getAllMovies(),
          getAllPeople()
        ]);
        
        setMovies(moviesData);
        setAllPeople(peopleData);

      } catch (err) {
        console.error("Не вдалося завантажити дані:", err)
      } finally {
        setIsLoading(false)
      }
    };

    fetchData();
  }, [])

  const processedMovies = useMemo(() => {
    let tempMovies = [...movies]

    if (searchTerm) {
      tempMovies = tempMovies.filter((movie) => movie.title.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (genreFilter) {
      tempMovies = tempMovies.filter((movie) => movie.genre?.toLowerCase().includes(genreFilter.toLowerCase()))
    }

    if (peopleSearchTerm) {
      const term = peopleSearchTerm.toLowerCase();
      tempMovies = tempMovies.filter(movie => {
        if (!movie.people_ids || !Array.isArray(movie.people_ids)) return false;
        
        const actorsInMovie = allPeople.filter(p => movie.people_ids.includes(p.id));
        
        return actorsInMovie.some(person => 
          person.first_name.toLowerCase().includes(term) || 
          person.last_name.toLowerCase().includes(term)
        );
      });
    }

    tempMovies.sort((a, b) => {
      const ratingA = parseFloat(a.rating) || 0;
      const ratingB = parseFloat(b.rating) || 0;

      switch (sortOption) {
        case "title_asc":
          return a.title.localeCompare(b.title);
        case "rating_desc":
          return ratingB - ratingA;
        case "rating_asc":
          return ratingA - ratingB;
        case "oldest":
          return a.id - b.id;
        case "newest":
        default:
          return b.id - a.id;
      }
    });

    return tempMovies
  }, [movies, allPeople, searchTerm, genreFilter, peopleSearchTerm, sortOption])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-center pt-32 text-lg text-blue-400">
        Завантаження фільмів...
      </div>
    )
  }

  return (
    
    
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
{quoteOfDay && (
  <div className="card p-7 mt-5  relative overflow-hidden">

     <div className="absolute top-0 right-0 text-9xl text-blue-500/5 leading-none" style={{ fontFamily: 'Georgia, serif' }}>
      "
    </div>
    
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
        <h3 className="text-xl font-bold text-blue-400">Цитата дня</h3>
      </div>
      
      <blockquote className="text-2xl md:text-3xl text-gray-300 font-semibold mb-4 leading-relaxed">
        "{quoteOfDay.quote}"
      </blockquote>
      
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-gray-400">
          <span className="font-semibold text-blue-300">{quoteOfDay.character}</span>
          <span className="mx-2">•</span>
          <span className="font-semibold">{quoteOfDay.movie}</span>
        </div>
        <div className="text-gray-500 text-sm">
          {quoteOfDay.year}
        </div>
      </div>
    </div>
  </div>
)}
  <div className="max-w-7xl mx-auto p-4 pt-12 pb-8">
       <div className="flex justify-between items-center mb-8">
  <h1 className="section-title">
    Огляд фільмів
  </h1>
  <div className="flex gap-4">
    <button
      onClick={openGallery}
      className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      Галерея
    </button>
    
    {isAdmin && (
      <Link
        to="/movies/new"
        className="btn-primary"
      >
        + Додати фільм
      </Link>
    )}
  </div>
</div>
        <div className="card p-6 mb-26 sticky top-16 z-10">
            <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Шукати фільм за назвою..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
              <div className="absolute top-0 left-0 p-3">
                <SearchIcon />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary"
            >
              {showFilters ? "Сховати" : "Фільтри та Сортування"}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t border-gray-700 pt-4">
              <div>
                <label className="block text-blue-400 mb-2 text-sm font-medium">Жанр</label>
                <input
                  type="text"
                  placeholder="Жанр"
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-blue-400 mb-2 text-sm font-medium">Актори / Режисери</label>
                <input
                  type="text"
                  placeholder="Актори / Режисери / Продюсери"
                  value={peopleSearchTerm}
                  onChange={(e) => setPeopleSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-blue-400 mb-2 text-sm font-medium">Сортувати за</label>
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="form-input"
                >
                  <option value="newest" className="bg-gray-800">Спочатку нові</option>
                  <option value="oldest" className="bg-gray-800">Спочатку старі</option>
                  <option value="title_asc" className="bg-gray-800">Назва (А-Я)</option>
                  <option value="rating_desc" className="bg-gray-800">Рейтинг (високий - низький)</option>
                  <option value="rating_asc" className="bg-gray-800">Рейтинг (низький - високий)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {processedMovies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {processedMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-lg mt-12">На жаль, за вашим запитом нічого не знайдено.</p>
        )}
      </div>
<div className="mt-16 border-t border-gray-700 pt-12">
  <h2 className="text-3xl font-bold text-white mb-8 text-center">
    Статті про кіно
  </h2>
  
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {articles.map((article) => (
      <div
        key={article.id}
        onClick={() => openArticle(article)}
        className="bg-gray-800/50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl 
                 hover:scale-105 transition-all duration-300 cursor-pointer group"
      >
        <div className="relative h-48 overflow-hidden">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent pointer-events-none"></div>
        </div>
        
        <div className="p-5">
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
            {article.title}
          </h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-3">
            {article.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{article.author}</span>
            <span>{article.date}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>

{selectedArticle && (
  <div 
    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={closeArticle}
  >
    <div 
      className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-start z-10">
        <div className="flex-1 pr-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {selectedArticle.title}
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{selectedArticle.author}</span>
            <span>{selectedArticle.date}</span>
          </div>
        </div>
        <button
          onClick={closeArticle}
          className="text-gray-400 hover:text-white transition-colors text-3xl leading-none"
          title="Закрити"
        >
          ×
        </button>
      </div>

      <div className="relative h-96 overflow-hidden">
        <img
          src={selectedArticle.image}
          alt={selectedArticle.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-800 via-transparent to-transparent"></div>
      </div>

      <div 
        className="p-8 text-gray-300 leading-relaxed prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
        style={{
          fontSize: '1.1rem',
          lineHeight: '1.8'
        }}
      />

      <div className="border-t border-gray-700 p-6 flex justify-end">
        <button
          onClick={closeArticle}
          className="btn-primary"
        >
          Закрити
        </button>
      </div>
    </div>
  </div>
)}

<style>{`
  .prose h3 {
    color: #60a5fa;
    font-size: 1.5rem;
    font-weight: bold;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
  }
  .prose h4 {
    color: #93c5fd;
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 1.25rem;
    margin-bottom: 0.75rem;
  }
  .prose p {
    margin-bottom: 1rem;
  }
  .prose ol, .prose ul {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }
  .prose li {
    margin-bottom: 0.5rem;
  }
  .prose strong {
    color: #fff;
    font-weight: 600;
  }
`}</style>

{showGallery && (
  <div 
    className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto"
    onClick={closeGallery}
  >
    <div className="min-h-screen p-8">
      <div 
        className="max-w-7xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex justify-between items-center mb-8 sticky top-0 bg-black/80 backdrop-blur-sm p-4 rounded-lg z-10">
          <h2 className="text-3xl font-bold text-white">
            Кінематографічна галерея
          </h2>
          <button
            onClick={closeGallery}
            className="text-gray-400 hover:text-white transition-colors text-3xl"
            title="Закрити"
          >
            ×
          </button>
        </div>

   
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {gallery.map((image, index) => (
            <div
              key={image.id}
              onClick={() => openGalleryImage(index)}
              className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group bg-gray-800"
            >
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              
  
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <h3 className="text-white font-bold text-lg mb-1">{image.title}</h3>
                <p className="text-gray-300 text-sm line-clamp-2">{image.caption}</p>
                <p className="text-gray-400 text-xs mt-1">{image.year}</p>
              </div>

       
              <div className="absolute top-3 right-3 bg-black/60 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}


{selectedGalleryImage && (
  <div 
    className="fixed inset-0 bg-black/98 z-[60] flex items-center justify-center p-4"
    onClick={closeGalleryImage}
  >
  
    <button
      onClick={closeGalleryImage}
      className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
      title="Закрити (Esc)"
    >
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <button
      onClick={(e) => { e.stopPropagation(); prevGalleryImage(); }}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-4 hover:bg-black/70"
      title="Попередній (←)"
    >
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <button
      onClick={(e) => { e.stopPropagation(); nextGalleryImage(); }}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-4 hover:bg-black/70"
      title="Наступний (→)"
    >
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>


    <div 
      className="relative max-w-6xl max-h-[85vh] w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <img
        src={selectedGalleryImage.url}
        alt={selectedGalleryImage.title}
        className="w-full h-full object-contain rounded-lg"
      />
   
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6 rounded-b-lg">
        <h3 className="text-white text-2xl font-bold mb-2">
          {selectedGalleryImage.title}
        </h3>
        <p className="text-gray-300 text-lg mb-2">
          {selectedGalleryImage.caption}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            {selectedGalleryImage.year}
          </p>
          <p className="text-gray-500 text-sm">
            {currentGalleryIndex + 1} / {gallery.length}
          </p>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  )
}