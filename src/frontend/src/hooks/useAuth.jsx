import { useState, useEffect } from 'react';
 
import { getUserDataFromToken } from '../api';  

export const useAuth = () => {
  const [authInfo, setAuthInfo] = useState({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isModerator: false,
    isLoading: true,  
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

     
     
    getUserDataFromToken(token).then(userData => {
      if (userData) {
         
        setAuthInfo({
          user: userData,  
          isAuthenticated: true,
          isAdmin: userData.role === 'admin',
          isModerator: userData.role === 'admin' || userData.role === 'moderator',
          isLoading: false,
        });
      } else {
         
        localStorage.removeItem('token');  
        setAuthInfo({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          isModerator: false,
          isLoading: false,
        });
      }
    }).catch(err => {
       
      console.error("Auth error:", err);
      localStorage.removeItem('token');
      setAuthInfo({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isModerator: false,
        isLoading: false,
      });
    });
  }, []);  

  return authInfo;
};