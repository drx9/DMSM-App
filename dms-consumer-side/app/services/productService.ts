import axios from 'axios';
import { API_URL } from '../config';
import { SortOption, FilterOption } from '../config';

interface Product {
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
  sort?: SortOption;
  filters?: string; // Add this line
}

interface GetProductsResponse {
  products: Product[];
  totalPages: number;
  currentPage: number;
  totalProducts: number;
}

const productService = {
  // Get all products with filters
  getProducts: async (params: GetProductsParams = {}): Promise<GetProductsResponse> => {
    try {
      const response = await axios.get(`${API_URL}/products`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get a single product by ID
  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await axios.get(`${API_URL}/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  // Create a new product (admin only)
  createProduct: async (productData: Omit<Product, 'id'>): Promise<Product> => {
    try {
      const response = await axios.post(`${API_URL}/products`, productData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update a product (admin only)
  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    try {
      const response = await axios.put(`${API_URL}/products/${id}`, productData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete a product (admin only)
  deleteProduct: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Add a review to a product
  addReview: async (productId: string, reviewData: { rating: number; comment: string }) => {
    try {
      const response = await axios.post(
        `${API_URL}/products/${productId}/reviews`,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  },

  // Update a review
  updateReview: async (
    productId: string,
    reviewId: string,
    reviewData: { rating: number; comment: string }
  ) => {
    try {
      const response = await axios.put(
        `${API_URL}/products/${productId}/reviews/${reviewId}`,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  // Delete a review
  deleteReview: async (productId: string, reviewId: string) => {
    try {
      const response = await axios.delete(
        `${API_URL}/products/${productId}/reviews/${reviewId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },
};

export default productService; 