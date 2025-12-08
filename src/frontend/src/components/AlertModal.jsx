export default function AlertModal({ isOpen, onClose, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="
          bg-[#606aa2]
          border-[3px] border-black
          rounded-[15px]
          p-6
          max-w-sm w-full
          shadow-2xl
          text-[#d6cecf]
        "
      >
        <h3 className="text-xl font-extrabold tracking-[0.12em] uppercase mb-3">
          {title}
        </h3>

        <p className="text-sm mb-6 whitespace-pre-wrap leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="
              bg-[#e6e1e2]
              text-black
              font-extrabold
              tracking-[0.12em]
              uppercase
              border-[3px] border-black
              rounded-[12px]
              px-6 py-2
              hover:bg-[#cfcaca]
              transition-colors
              cursor-pointer
            "
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
