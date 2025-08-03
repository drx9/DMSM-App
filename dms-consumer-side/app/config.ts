export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Use the API key from app.json or environment variables
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 
                                   process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 
                                   'AIzaSyDxIJneZ8qgkgKLsffP46EENI-EGOdnCEU' || 
                                   'YOUR_GOOGLE_MAPS_API_KEY';

export const APP_CONFIG = {
    APP_NAME: 'DMS Mart',
    VERSION: '1.0.0',
    SUPPORT_EMAIL: 'support@dmsmart.com',
    SUPPORT_PHONE: '+91 1234567890',
};

export const CURRENCY = {
    SYMBOL: '₹',
    CODE: 'INR',
};

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50,
} as const;

export const SORT_OPTIONS = [
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'created_at_desc', label: 'Newest' },
    { value: 'created_at_asc', label: 'Oldest' },
    { value: 'rating_desc', label: 'Rating' },
] as const;

export type SortOption = typeof SORT_OPTIONS[number]['value'];

export const FILTER_OPTIONS = [
    { value: 'in_stock', label: 'In Stock' },
    { value: 'on_sale', label: 'On Sale' },
    { value: 'new_arrivals', label: 'New Arrivals' },
] as const;

export type FilterOption = typeof FILTER_OPTIONS[number]['value'];

export const IMAGE_PLACEHOLDER = 'https://via.placeholder.com/300'; 

// Default export for Expo Router
export default {
  API_URL,
  GOOGLE_MAPS_API_KEY,
  APP_CONFIG,
  CURRENCY,
  PAGINATION,
  SORT_OPTIONS,
  FILTER_OPTIONS,
  IMAGE_PLACEHOLDER
}; 