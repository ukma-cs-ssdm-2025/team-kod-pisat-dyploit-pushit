export default function Avatar({ src, alt, size = "md", className = "" }) {
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-32 h-32 text-4xl",
    xl: "w-40 h-40 text-5xl",
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${currentSize} rounded-full object-cover border-2 border-gray-700 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${currentSize} rounded-full bg-[#606aa2] flex items-center justify-center text-white font-bold border-2 border-gray-700 shadow-lg ${className}`}
      title={alt}
    >
      {getInitials(alt)}
    </div>
  );
}