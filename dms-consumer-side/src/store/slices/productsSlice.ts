import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../../app/config';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    discount: number;
    stock: number;
    images: string[];
    categoryId: string;
    category?: {
        id: string;
        name: string;
    };
    isActive: boolean;
    rating: number;
    reviewCount: number;
    isOutOfStock: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ProductsState {
    items: Product[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
    categories: { id: string; name: string }[];
    categoriesLoading: boolean;
    categoriesError: string | null;
}

const initialState: ProductsState = {
    items: [],
    loading: false,
    error: null,
    lastFetched: null,
    categories: [],
    categoriesLoading: false,
    categoriesError: null,
};

// Async thunk for fetching all products
export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Fetching products from:', `${API_URL}/products`);
            const response = await axios.get(`${API_URL}/products?limit=1000&page=1`);
            console.log('Products response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching products:', error);
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
        }
    }
);

// Async thunk for fetching categories
export const fetchCategories = createAsyncThunk(
    'products/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/categories`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
        }
    }
);

const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearProducts: (state) => {
            state.items = [];
            state.lastFetched = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch products
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                // Handle both array response and paginated response
                const products = Array.isArray(action.payload)
                    ? action.payload
                    : (action.payload?.products || []);
                state.items = products;
                state.lastFetched = Date.now();
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch categories
            .addCase(fetchCategories.pending, (state) => {
                state.categoriesLoading = true;
                state.categoriesError = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.categoriesLoading = false;
                state.categories = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.categoriesLoading = false;
                state.categoriesError = action.payload as string;
            });
    },
});

export const { clearProducts, clearError } = productsSlice.actions;
export default productsSlice.reducer; 