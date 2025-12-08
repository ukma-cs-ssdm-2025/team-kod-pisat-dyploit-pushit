import { Link } from "react-router-dom"

export default function MovieCard({ movie }) {
  const rating = movie.rating ? Number(movie.rating).toFixed(1) : "0.0";

  return (
    <Link
      to={`/movie/${movie.id}`}
      className="
        block
        bg-[#606aa2]
        border-[3px] border-black
        rounded-[16px]
        shadow-2xl
        overflow-hidden
        transition-all
        hover:brightness-105
        hover:-translate-y-1
      "
    >
      {/* POSTER WRAPPER */}
      <div className="bg-[#1a1a1a] border-b-[3px] border-black p-3">
        <div className="w-full h-[260px] rounded-[12px] overflow-hidden border-[3px] border-black">
          <img
            src={movie.cover_url || 'https://placehold.co/300x450/1a1a1a/FFFFFF?text=No+Poster'}
            alt={movie.title}
            className="
              w-full h-full object-cover
              transition-transform duration-300
              group-hover:scale-105
            "
          />
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 text-center">
        {/* TITLE */}
        <h3
          className="
            text-[#d6cecf]
            font-extrabold
            uppercase
            tracking-[0.14em]
            text-sm md:text-base
            truncate
            cursor-pointer
          "
          title={movie.title}
        >
          {movie.title}
        </h3>

        {/* RATING */}
        <div
          className="
            inline-flex items-center
            bg-[#c9c7c7]
            border-[3px] border-black
            rounded-[999px]
            px-3 py-1
            mt-3
          "
        >
          <span className="text-black font-extrabold text-sm">
            ★
          </span>
          <span className="ml-1 text-black font-extrabold text-xs tracking-[0.12em] uppercase">
            {rating}
          </span>
        </div>
      </div>
    </Link>
  );
}
