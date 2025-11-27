import { useState } from 'react';
import StarRating from './StarRating';

export default function ReviewForm({ onSubmit }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text || !title || rating === 0) {
      alert("Please fill in the title, text and select a rating.");
      return;
    }
    onSubmit({ 
      title, 
      body: text,
      rating, 
      created_at: new Date().toISOString() 
    });
    
    setTitle('');
    setText('');
    setRating(0);
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mt-8">
      <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-blue-500 pl-4">
        Leave a Review
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-blue-400 mb-2 font-medium cursor-default">Your Rating</label>
          <div className="cursor-pointer inline-block">
             <StarRating rating={rating} onRatingChange={setRating} />
          </div>
        </div>
        <div>
          <label className="block text-blue-400 mb-2 font-medium cursor-default">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors cursor-text"
            placeholder="Review title..."
          />
        </div>
        <div>
          <label className="block text-blue-400 mb-2 font-medium cursor-default">Review Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows="5"
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors cursor-text"
            placeholder="Write your thoughts here..."
          ></textarea>
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg transition-all shadow-lg hover:shadow-blue-500/20 cursor-pointer"
        >
          Submit Review
        </button>
      </form>
    </div>
  );
}