// context/RoleContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/apicheck';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRoles = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = localStorage.getItem('apiUrl');
      if (!apiUrl) {
        throw new Error('API URL not found');
      }
      const response = await api.get('/');
      console.log('API Response:', response.data);
      if (response.data && response.data.roles) {
        setRoles(response.data.roles);
      } else {
        throw new Error('Roles data not found in API response');
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      if (retryCount < 3) {
        console.log(`Retrying... Attempt ${retryCount + 1}`);
        setTimeout(() => fetchRoles(retryCount + 1), 1000); // Retry after 1 second
        return;
      }
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  console.log('Roles in context:', roles);

  return (
    <RoleContext.Provider value={{ roles, loading, error, refetchRoles: fetchRoles }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRoles = () => useContext(RoleContext);