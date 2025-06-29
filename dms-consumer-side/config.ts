export const API_URL = 'http://192.168.33.188:5000/api';

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
};

export const SORT_OPTIONS = {
  PRICE_LOW_TO_HIGH: 'price_asc',
  PRICE_HIGH_TO_LOW: 'price_desc',
  NEWEST: 'created_at_desc',
  OLDEST: 'created_at_asc',
  RATING: 'rating_desc',
};

export const FILTER_OPTIONS = {
  IN_STOCK: 'in_stock',
  ON_SALE: 'on_sale',
  NEW_ARRIVALS: 'new_arrivals',
}; 