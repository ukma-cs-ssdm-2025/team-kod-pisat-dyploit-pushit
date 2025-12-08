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
    <div
      className="
        bg-[#1a1a1a]
        border-[3px] border-black
        rounded-[14px]
        p-4 md:p-5
        shadow-2xl
      "
    >
      {/* HEADER */}
      <div className="flex justify-between items-start gap-3">
        <div>
          {/* MOVIE + TITLE */}
          {review.movieTitle ? (
            <Link
              to={`/movie/${review.movie_id}`}
              className="group cursor-pointer"
            >
              <div className="text-xs font-extrabold text-[#d6cecf] uppercase tracking-[0.14em] group-hover:underline">
                {review.movieTitle}
              </div>
              <div className="text-base md:text-lg font-extrabold text-[#d6cecf] mt-1">
                {review.title}
              </div>
            </Link>
          ) : (
            <h3 className="text-base md:text-lg font-extrabold text-[#d6cecf]">
              {review.title}
            </h3>
          )}

          {/* RATING */}
          <div className="mt-2">
            <div
              className="
                inline-flex items-center
                bg-[#c9c7c7]
                border-[3px] border-black
                rounded-[999px]
                px-3 py-1
              "
            >
              <span className="text-sm md:text-base font-extrabold text-black leading-none">
                {'★'.repeat(safeRating)}
                {'☆'.repeat(emptyStars)}
              </span>
              <span className="ml-2 text-xs font-extrabold text-black uppercase tracking-[0.14em]">
                {safeRating}/10
              </span>
            </div>
          </div>
        </div>

        {/* DELETE BUTTON */}
        {canDelete && (
          <button
            onClick={() => onDelete(review.id)}
            className="
              text-[#c0392b]
              hover:text-[#e74c3c]
              text-xs md:text-sm
              font-extrabold
              uppercase
              tracking-[0.14em]
              cursor-pointer
            "
          >
            Delete
          </button>
        )}
      </div>

      {/* TEXT */}
      <p className="text-[#d6cecf] text-sm md:text-base leading-relaxed mt-3 mb-4 whitespace-pre-wrap">
        {review.text || review.body}
      </p>
      
      {/* FOOTER: AUTHOR + DATE */}
      <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-[#c9c7c7] uppercase tracking-[0.08em]">
        {review.user && (
          <Link
            to={`/user/${review.user.username}`}
            className="font-extrabold text-[#d6cecf] hover:underline cursor-pointer"
          >
            {review.user.nickname || review.user.username}
          </Link>
        )}
        <span>•</span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
}
