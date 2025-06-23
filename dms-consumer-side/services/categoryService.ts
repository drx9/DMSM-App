import axios from 'axios';
import { API_URL } from '../config';

export interface Category {
    id: string;
    name: string;
    image: string;
    description?: string;
    parentId?: string;
    isActive: boolean;
}

export interface GetCategoriesResponse {
    categories: Category[];
    totalCategories: number;
}

const categoryService = {
    getCategories: async (): Promise<GetCategoriesResponse> => {
        const response = await axios.get(`${API_URL}/categories`);
        return response.data;
    },

    getCategoryById: async (id: string): Promise<Category> => {
        const response = await axios.get(`${API_URL}/categories/${id}`);
        return response.data;
    },

    getSubCategories: async (parentId: string): Promise<Category[]> => {
        const response = await axios.get(`${API_URL}/categories/${parentId}/subcategories`);
        return response.data;
    }
};

export default categoryService; 