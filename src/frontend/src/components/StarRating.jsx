import { useState } from 'react';

export default function StarRating({ rating, onRatingChange }) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button" 
          key={star}
          className={`text-3xl transition-colors ${
            (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-600'
          }`}
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
        >
          ★
        </button>
      ))}
    </div>
  );
}