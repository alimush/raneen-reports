// context/PermissionContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/apicheck';

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await api.get('/');
        setPermissions(response.data.roles[0].permissions); // Adjust as per your API structure
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  return (
    <PermissionContext.Provider value={{ hasPermission, loading }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = (permission) => {
  const { hasPermission, loading } = useContext(PermissionContext);
  const permissionCheck = hasPermission(permission);
  return { hasPermission: permissionCheck, loading };
};
