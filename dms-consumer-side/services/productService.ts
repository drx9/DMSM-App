import axios from 'axios';
import { API_URL } from '../app/config';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  stock: number;
  images: string[];
  rating: number;
  reviewCount: number;
  isOutOfStock: boolean;
  isActive: boolean;
  category: {
    id: string;
    name: string;
  };
}

interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sort?: string;
  filters?: string;
}

interface GetProductsResponse {
  products: Product[];
  totalPages: number;
  currentPage: number;
  totalProducts: number;
  total: number;
}

const productService = {
  getProducts: async (params: GetProductsParams = {}): Promise<GetProductsResponse> => {
    const response = await axios.get(`${API_URL}/products`, { params });
    return response.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await axios.get(`${API_URL}/products/${id}`);
    return response.data;
  },

  createProduct: async (productData: Omit<Product, 'id'>): Promise<Product> => {
    const response = await axios.post(`${API_URL}/products`, productData);
    return response.data;
  },

  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    const response = await axios.put(`${API_URL}/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/products/${id}`);
  },
};

export default productService; 