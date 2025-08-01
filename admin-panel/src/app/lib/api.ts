import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dmsm-app-production-a35d.up.railway.app';

const api = {
  post: async (url: string, data: any) => {
    if (url === '/api/offers') {
      // Directly call backend if no local route exists
      return axios.post(`${API_URL}/api/offers`, data);
    }
  },
  put: async (url: string, data: any) => {
    if (url.startsWith('/api/offers/')) {
      // Directly call backend if no local route exists
      const id = url.split('/').pop();
      return axios.put(`${API_URL}/api/offers/${id}`, data);
    }
  },
};

export default api; 