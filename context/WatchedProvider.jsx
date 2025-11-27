import { useState, useEffect } from "react";
import { WatchedContext } from "./WatchedContext";

export function WatchedProvider({ children }) {
  const [watchedMovies, setWatchedMovies] = useState(() => {

    const saved = localStorage.getItem('watchedMovies');
    return saved ? JSON.parse(saved) : [];
  });


  useEffect(() => {
    localStorage.setItem('watchedMovies', JSON.stringify(watchedMovies));
  }, [watchedMovies]);

  const addWatchedMovie = (movieId) => {
    setWatchedMovies(prev => {
      if (prev.some(m => m.id === movieId)) return prev;
      return [...prev, { id: movieId }];
    });
  };

  const removeWatchedMovie = (movieId) => {
    setWatchedMovies(prev => prev.filter(m => m.id !== movieId));
  };

  return (
    <WatchedContext.Provider value={{ watchedMovies, addWatchedMovie, removeWatchedMovie }}>
      {children}
    </WatchedContext.Provider>
  );
}
export default WatchedProvider