import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ReviewCard({ review, onDelete }) {
  const { user: currentUser, isAdmin, isModerator } = useAuth();
  
  const formattedDate = new Date(review.date).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Може видалити адмін, модератор, АБО сам автор відгуку
  const canDelete = isAdmin || isModerator || currentUser?.id === review.user?.id;

  return (
    <div className="border-b border-amber-500/20 pb-4 last:border-b-0">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-white">{review.title}</h3>
          <div className="flex items-center mt-1 mb-2">
            <span className="ml-1 text-yellow-400">
              {'★'.repeat(review.rating)}
              {'☆'.repeat(5 - review.rating)}
            </span>
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

      <p className="text-gray-300 mt-2 mb-3">{review.text}</p>
      
      <div className="text-sm text-gray-500">
        <Link 
          to={`/user/${review.user.username}`} 
          className="font-semibold text-amber-400 hover:underline"
        >
          {review.user.nickname}
        </Link>
        <span className="mx-2">•</span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
}