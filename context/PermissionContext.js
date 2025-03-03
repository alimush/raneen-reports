// context/PermissionContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchPermissions = async (retryCount = 0) => {
    try {
      setLoading(true);
      
      // Check if we have required data in localStorage
      const apiUrl = typeof window !== 'undefined' 
        ? window.localStorage.getItem('apiUrl') 
        : null;
      
      const token = typeof window !== 'undefined'
        ? window.localStorage.getItem('token')
        : null;
      
      if (!apiUrl || !token) {
        console.log('API URL or token not found, will retry when available');
        setLoading(false);
        return;
      }
      
      // Make a fresh API call with current localStorage values
      const response = await fetch(`${apiUrl}/AdminRoleList/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Permissions API Response:', data);
      
      if (data && data.roles && data.roles[0] && data.roles[0].permissions) {
        setPermissions(data.roles[0].permissions);
        setIsInitialized(true);
      } else {
        throw new Error('Permissions data not found in API response');
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      if (retryCount < 3) {
        console.log(`Retrying permissions... Attempt ${retryCount + 1}`);
        setTimeout(() => fetchPermissions(retryCount + 1), 1000);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  // Run on mount and when localStorage changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const apiUrl = window.localStorage.getItem('apiUrl');
      const token = window.localStorage.getItem('token');
      
      if (apiUrl && token) {
        fetchPermissions();
      }
      
      // Check for localStorage changes regularly
      const handleStorageCheck = () => {
        if (window.localStorage.getItem('apiUrl') && 
            window.localStorage.getItem('token') && 
            !isInitialized) {
          console.log('API URL or token changed, fetching permissions');
          fetchPermissions();
        }
      };
      
      const interval = setInterval(handleStorageCheck, 1000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [isInitialized]);

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  return (
    <PermissionContext.Provider value={{ hasPermission, loading, refetchPermissions: fetchPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = (permission) => {
  const context = useContext(PermissionContext);
  
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  
  const { hasPermission, loading, refetchPermissions } = context;
  const permissionCheck = hasPermission(permission);
  
  return { hasPermission: permissionCheck, loading, refetchPermissions };
};