import axios from 'axios';

const createApi = () => {
  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;
  
  const api = axios.create({
    baseURL: apiUrl ? `${apiUrl}AdminRoleList/admin/roles` : '/api', // Fallback to a relative path
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add a request interceptor to include the JWT token in every request
  api.interceptors.request.use(
    config => {
      if (typeof window !== 'undefined') {
        const token = window.localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    error => Promise.reject(error)
  );

  return api;
};

let api;

if (typeof window !== 'undefined') {
  api = createApi();
}

export default api;