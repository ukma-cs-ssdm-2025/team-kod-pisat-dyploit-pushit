import { useState } from 'react';
import StarRating from './StarRating';

export default function ReviewForm({ onSubmit }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState(''); // В стейті залишаємо text для зручності
  const [rating, setRating] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text || !title || rating === 0) {
      alert("Будь ласка, заповніть заголовок, текст та оберіть рейтинг.");
      return;
    }
    // ВИПРАВЛЕННЯ: Бекенд очікує 'body', а не 'text'
    onSubmit({ 
      title, 
      body: text, // Мапимо text на body
      rating, 
      // date додається, але бекенд використовує NOW(), тож це скоріше для миттєвого відображення
      created_at: new Date().toISOString() 
    });
    
    setTitle('');
    setText('');
    setRating(0);
  };

  return (
    <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 shadow-xl rounded-2xl p-6 border border-amber-500/20 backdrop-blur mt-8">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
        Залишити відгук
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-amber-400 mb-2">Ваш рейтинг</label>
          <StarRating rating={rating} onRatingChange={setRating} />
        </div>
        <div>
          <label className="block text-amber-400 mb-2">Заголовок</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"
          />
        </div>
        <div>
          <label className="block text-amber-400 mb-2">Текст відгуку</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows="5"
            className="w-full p-2 bg-transparent border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:border-amber-400"
          ></textarea>
        </div>
        <button
          type="submit"
          className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white px-6 py-3 rounded-lg transition-all font-medium border border-amber-400/30"
        >
          Відправити
        </button>
      </form>
    </div>
  );
}