import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from './productsSlice';

export type SortOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest' | 'oldest';
export type FilterOption = 'all' | 'in_stock' | 'on_sale' | 'new_arrivals';

interface SearchState {
    query: string;
    filteredProducts: Product[];
    sortBy: SortOption;
    filterBy: FilterOption;
    selectedCategory: string | null;
    priceRange: { min: number; max: number };
    showFilters: boolean;
}

const initialState: SearchState = {
    query: '',
    filteredProducts: [],
    sortBy: 'name_asc',
    filterBy: 'all',
    selectedCategory: null,
    priceRange: { min: 0, max: 10000 },
    showFilters: false,
};

const searchSlice = createSlice({
    name: 'search',
    initialState,
    reducers: {
        setQuery: (state, action: PayloadAction<string>) => {
            state.query = action.payload;
        },
        setFilteredProducts: (state, action: PayloadAction<Product[]>) => {
            state.filteredProducts = action.payload;
        },
        setSortBy: (state, action: PayloadAction<SortOption>) => {
            state.sortBy = action.payload;
        },
        setFilterBy: (state, action: PayloadAction<FilterOption>) => {
            state.filterBy = action.payload;
        },
        setSelectedCategory: (state, action: PayloadAction<string | null>) => {
            state.selectedCategory = action.payload;
        },
        setPriceRange: (state, action: PayloadAction<{ min: number; max: number }>) => {
            state.priceRange = action.payload;
        },
        toggleFilters: (state) => {
            state.showFilters = !state.showFilters;
        },
        clearSearch: (state) => {
            state.query = '';
            state.filteredProducts = [];
            state.sortBy = 'name_asc';
            state.filterBy = 'all';
            state.selectedCategory = null;
            state.priceRange = { min: 0, max: 10000 };
        },
    },
});

export const {
    setQuery,
    setFilteredProducts,
    setSortBy,
    setFilterBy,
    setSelectedCategory,
    setPriceRange,
    toggleFilters,
    clearSearch,
} = searchSlice.actions;

export default searchSlice.reducer; 