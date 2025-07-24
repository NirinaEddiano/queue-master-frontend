import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8000',
});

const publicEndpoints = ['/api/stats/', '/api/token/', '/api/users/register/'];

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && !publicEndpoints.includes(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (publicEndpoints.includes(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.error('Jeton de rafraîchissement manquant');
          throw new Error('Jeton de rafraîchissement manquant');
        }
        const response = await axios.post('http://localhost:8000/api/token/refresh/', {
          refresh: refreshToken,
        });
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        console.log('Jeton rafraîchi pour HTTP');
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return instance(originalRequest);
      } catch (err) {
        console.error('Échec du rafraîchissement:', err);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default instance;