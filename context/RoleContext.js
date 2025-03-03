// context/RoleContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/apicheck';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchRoles = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if API URL exists in localStorage
      const apiUrl = typeof window !== 'undefined' 
        ? window.localStorage.getItem('apiUrl') 
        : null;
      
      if (!apiUrl) {
        console.log('API URL not found in localStorage, will retry when available');
        setLoading(false);
        return;
      }
      
      // Force api to refresh with the new apiUrl
      const response = await fetch(`${apiUrl}/AdminRoleList/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data && data.roles) {
        setRoles(data.roles);
        setIsInitialized(true);
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

  // This useEffect runs on initial mount and when apiUrl changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const apiUrl = window.localStorage.getItem('apiUrl');
      if (apiUrl) {
        fetchRoles();
      }
      
      // Set up a listener for localStorage changes
      const handleStorageChange = () => {
        if (window.localStorage.getItem('apiUrl') && !isInitialized) {
          console.log('API URL changed in localStorage, fetching roles');
          fetchRoles();
        }
      };
      
      // Check for localStorage changes every second
      const interval = setInterval(handleStorageChange, 1000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [isInitialized]);

  console.log('Roles in context:', roles);

  return (
    <RoleContext.Provider value={{ roles, loading, error, refetchRoles: fetchRoles }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRoles = () => useContext(RoleContext);