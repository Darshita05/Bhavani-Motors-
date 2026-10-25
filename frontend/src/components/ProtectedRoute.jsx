import { useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      // Clear any existing localStorage items
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      // Redirect to login
      window.location.href = '/login';
      return;
    }

    // Check if token is expired
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
      const now = new Date().getTime();
      
      if (now > expirationTime) {
        // Clear localStorage and redirect
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      }
    } catch (error) {
      // If token is invalid, clear and redirect
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
  }, []);

  return children;
};

export default ProtectedRoute;
