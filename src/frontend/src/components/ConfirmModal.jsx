export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
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

        <p className="text-sm mb-6 leading-relaxed whitespace-pre-wrap">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          {/* CANCEL BUTTON */}
          <button
            onClick={onClose}
            className="
              bg-[#2b2727]
              text-[#d6cecf]
              font-extrabold
              tracking-[0.18em]
              uppercase
              rounded-[14px]
              px-5 py-2

              hover:bg-black
              cursor-pointer

              transition-colors
              transition-transform
              hover:scale-[0.97]
              active:scale-90
            "
          >
            Cancel
          </button>

          {/* DELETE BUTTON */}
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="
              bg-[#830707]
              text-[#f5f0f0]
              font-extrabold
              tracking-[0.18em]
              uppercase
              rounded-[14px]
              px-5 py-2

              hover:bg-[#a90a0a]
              cursor-pointer

              transition-colors
              transition-transform
              hover:scale-[0.97]
              active:scale-90
            "
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
