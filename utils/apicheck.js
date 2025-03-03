import axios from 'axios';

// Create a function to get the API instance with the latest localStorage values
const getApi = () => {
  let apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;
  let token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  
  // Create a fresh instance with the latest config
  const instance = axios.create({
    baseURL: apiUrl ? `${apiUrl}AdminRoleList/admin/roles` : '/api',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  
  return instance;
};

// Export a proxy object that creates a fresh api instance for each request
const api = new Proxy({}, {
  get: function(target, prop) {
    const apiInstance = getApi();
    return apiInstance[prop];
  }
});

export default api;