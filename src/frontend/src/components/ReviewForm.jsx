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
    <div
      className="
        bg-[#606aa2]
        border-[3px] border-black
        rounded-[16px]
        p-6 md:p-8
        mt-10
        shadow-2xl
      "
    >
      <h2
        className="
          text-2xl font-extrabold
          text-[#d6cecf]
          uppercase
          tracking-[0.18em]
          mb-6
        "
        style={{ letterSpacing: "0.12em" }}
      >
        Leave a Review
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* RATING */}
        <div>
          <label className="block text-[#d6cecf] mb-2 font-extrabold uppercase tracking-[0.12em] cursor-default">
            Your Rating
          </label>
          <div className="bg-[#1a1a1a] border-[3px] border-black rounded-[14px] inline-block px-4 py-2 cursor-pointer">
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>
        </div>

        {/* TITLE */}
        <div>
          <label className="block text-[#d6cecf] mb-2 font-extrabold uppercase tracking-[0.12em] cursor-default">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="
              w-full
              bg-[#2b2727]
              text-[#d6cecf]
              border-[3px] border-black
              rounded-[16px]
              px-4 py-3
              focus:outline-none
              focus:border-[#d6cecf]
              placeholder:uppercase
              placeholder:text-[#c9c7c7]
              placeholder:tracking-[0.12em]
              cursor-text
            "
            placeholder="Review title..."
          />
        </div>

        {/* TEXT */}
        <div>
          <label className="block text-[#d6cecf] mb-2 font-extrabold uppercase tracking-[0.12em] cursor-default">
            Review Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows="5"
            className="
              w-full
              bg-[#2b2727]
              text-[#d6cecf]
              border-[3px] border-black
              rounded-[16px]
              px-4 py-3
              focus:outline-none
              focus:border-[#d6cecf]
              placeholder:uppercase
              placeholder:text-[#c9c7c7]
              placeholder:tracking-[0.12em]
              cursor-text
              resize-none
            "
            placeholder="Write your thoughts here..."
          ></textarea>
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          className="
            bg-[#c9c7c7]
            text-black
            font-extrabold
            text-xs md:text-sm
            tracking-[0.18em]
            uppercase
            border-[3px] border-black
            rounded-[14px]
            px-6 py-3
            hover:bg-[#e0dfdf]
            transition-colors
            cursor-pointer
            w-full md:w-auto
          "
        >
          Submit Review
        </button>
      </form>
    </div>
  );
}
