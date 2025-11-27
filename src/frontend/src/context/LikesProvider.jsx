import { useState, useEffect } from "react";
import { LikesContext } from "./LikesContext";

export function LikesProvider({ children }) {
  const [likedMovies, setLikedMovies] = useState(() => {
   
    const saved = localStorage.getItem('likedMovies');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('likedMovies', JSON.stringify(likedMovies));
  }, [likedMovies]);

  return (
    <LikesContext.Provider value={{ likedMovies, setLikedMovies }}>
      {children}
    </LikesContext.Provider>
  );
}
export default LikesProvider