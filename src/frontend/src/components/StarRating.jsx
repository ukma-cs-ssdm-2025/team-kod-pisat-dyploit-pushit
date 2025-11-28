import { useState } from 'react';

export default function StarRating({ rating, onRatingChange }) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
        <button
          type="button" 
          key={star}
          className={`text-2xl transition-colors duration-200 ${
            (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-600'
          } hover:text-yellow-300 cursor-pointer`}
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