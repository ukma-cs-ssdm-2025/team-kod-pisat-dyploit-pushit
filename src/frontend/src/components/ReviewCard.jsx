import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ReviewCard({ review, onDelete }) {
  const { user: currentUser, isAdmin, isModerator } = useAuth();
  
  const formattedDate = new Date(review.created_at || review.date).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const canDelete = isAdmin || isModerator || currentUser?.id === review.user?.id;

  // --- ВИПРАВЛЕННЯ КРЕШУ ---
  // Переконуємось, що рейтинг - це число від 0 до 10
  const safeRating = Math.max(0, Math.min(10, review.rating || 0));
  // Рахуємо порожні зірки (10 - рейтинг), але не менше 0
  const emptyStars = Math.max(0, 10 - safeRating);

  return (
    <div className="border-b border-amber-500/20 pb-4 last:border-b-0">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-white">
             {/* Якщо це сторінка профілю, показуємо назву фільму, інакше просто заголовок */}
             {review.movieTitle ? (
                <Link to={`/movie/${review.movie_id}`} className="hover:text-amber-400 transition-colors">
                  {review.movieTitle} - <span className="font-normal">{review.title}</span>
                </Link>
             ) : (
                review.title
             )}
          </h3>
          <div className="flex items-center mt-1 mb-2 text-sm">
            <span className="ml-1 text-yellow-400 tracking-widest">
              {/* Відображаємо 10 зірок */}
              {'★'.repeat(safeRating)}
              {'☆'.repeat(emptyStars)}
            </span>
            <span className="ml-2 text-gray-500">({safeRating}/10)</span>
          </div>
        </div>
        
        {canDelete && (
          <button 
            onClick={() => onDelete(review.id)}
            className="text-red-500 hover:text-red-400 transition-colors text-sm"
          >
            Видалити
          </button>
        )}
      </div>

      <p className="text-gray-300 mt-2 mb-3 whitespace-pre-wrap">{review.text || review.body}</p>
      
      <div className="text-sm text-gray-500">
        {review.user && (
            <Link 
            to={`/user/${review.user.username}`} 
            className="font-semibold text-amber-400 hover:underline"
            >
            {review.user.nickname || review.user.username}
            </Link>
        )}
        <span className="mx-2">•</span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
}