// src/components/TVAvatar.jsx
/* eslint-disable react/prop-types */

export default function TVAvatar({ src, alt = "avatar" }) {
  return (
    <div className="relative w-44 h-32 mt-4 tv-wrapper">
      {/* корпус телевізора */}
      <div className="absolute inset-0 rounded-[20px] bg-black overflow-hidden z-10 shadow-[0_0_15px_7px_rgba(0,0,0,0.6)]">
        {/* смужка-блік, яка буде рухатися по корпусу */}
        <div className="tv-glow-layer" />
      </div>

      {/* екран з аватаркою */}
      <div className="absolute left-5 right-14 top-5 bottom-5 rounded-[14px] bg-white overflow-hidden z-20">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>

      {/* кнопки справа */}
      <div className="absolute right-5 top-10 flex flex-col gap-4 z-30">
        <div className="w-5 h-5 rounded-full bg-white" />
        <div className="w-5 h-5 rounded-full bg-white" />
      </div>

      {/* антена 1 */}
      <div
        className="
          absolute
          -top-8
          left-[40%]
          h-8
          w-[3px]
          bg-black
          origin-bottom
          -rotate-12
          z-30
        "
      />

      {/* антена 2 */}
      <div
        className="
          absolute
          -top-8
          left-[55%]
          h-8
          w-[3px]
          bg-black
          origin-bottom
          rotate-12
          z-30
        "
      />
    </div>
  );
}






