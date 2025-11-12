import { useState, useEffect } from 'react';
import { getUserData } from '../api'; // Імпортуємо ВАШУ реальну функцію

export const useAuth = () => {
  const [authInfo, setAuthInfo] = useState({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isModerator: false,
    isLoading: true, // Додаємо стан завантаження
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setAuthInfo({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isModerator: false,
        isLoading: false,
      });
      return;
    }

    // Токен є, робимо запит до бекенду
    getUserData(token).then(userData => {
      if (userData) {
        // Успішно отримали дані
        setAuthInfo({
          user: userData, // Зберігаємо повний об'єкт юзера з бекенду
          isAuthenticated: true,
          isAdmin: userData.role === 'admin',
          isModerator: userData.role === 'admin' || userData.role === 'moderator',
          isLoading: false,
        });
      } else {
        // Токен є, але він невалідний (напр. прострочений)
        localStorage.removeItem('token'); // Чистимо невалідний токен
        setAuthInfo({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          isModerator: false,
          isLoading: false,
        });
      }
    });
  }, []); // Запускається один раз при завантаженні

  return authInfo;
};