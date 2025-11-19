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

  const safeRating = Math.max(0, Math.min(10, review.rating || 0));
  const emptyStars = Math.max(0, 10 - safeRating);

  return (
    <div className="border-b border-gray-700 pb-4 last:border-b-0">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-white">
             {review.movieTitle ? (
                <Link to={`/movie/${review.movie_id}`} className="hover:text-blue-300 transition-colors">
                  {review.movieTitle} - <span className="font-normal">{review.title}</span>
                </Link>
             ) : (
                review.title
             )}
          </h3>
          <div className="flex items-center mt-1 mb-2 text-sm">
            <span className="rating-stars">
              {'★'.repeat(safeRating)}
              {'☆'.repeat(emptyStars)}
            </span>
            <span className="ml-2 text-gray-500">({safeRating}/10)</span>
          </div>
        </div>
        
        {canDelete && (
          <button 
            onClick={() => onDelete(review.id)}
            className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
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
            className="font-semibold text-blue-400 hover:underline"
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