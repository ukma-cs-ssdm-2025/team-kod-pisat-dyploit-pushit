import { useState } from 'react';
import StarRating from './StarRating';

export default function ReviewForm({ onSubmit }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text || !title || rating === 0) {
      alert("Будь ласка, заповніть заголовок, текст та оберіть рейтинг.");
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
    <div className="card p-6 mt-8">
      <h2 className="section-title">
        Залишити відгук
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-blue-400 mb-2 font-medium">Ваш рейтинг</label>
          <StarRating rating={rating} onRatingChange={setRating} />
        </div>
        <div>
          <label className="block text-blue-400 mb-2 font-medium">Заголовок</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
          />
        </div>
        <div>
          <label className="block text-blue-400 mb-2 font-medium">Текст відгуку</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows="5"
            className="form-input"
          ></textarea>
        </div>
        <button
          type="submit"
          className="btn-primary"
        >
          Відправити
        </button>
      </form>
    </div>
  );
}