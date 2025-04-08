import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getCartCount = async (): Promise<number> => {
  try {
    const { data } = await api.get('/cart/count');
    return data.count || 0;
  } catch (error) {
    console.error('Error fetching cart count:', error);
    return 0;
  }
};

export default api; 