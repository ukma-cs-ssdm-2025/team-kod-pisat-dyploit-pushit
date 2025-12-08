import { useState } from 'react';

export default function StarRating({ rating, onRatingChange }) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
        const isActive = (hoverRating || rating) >= star;

        return (
          <button
            type="button"
            key={star}
            className={`
              text-2xl font-extrabold
              transition-colors duration-200
              cursor-pointer
            `}
            style={{
              color: isActive ? '#e6e1e2' : '#4b4b4b',        // активна / неактивна
            }}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => onRatingChange(star)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
