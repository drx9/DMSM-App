import { Product } from '../store/slices/productsSlice';

type SortOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest' | 'oldest';
type FilterOption = 'all' | 'in_stock' | 'on_sale' | 'new_arrivals';

export const searchProducts = (
    products: Product[],
    query: string,
    sortBy: SortOption,
    filterBy: FilterOption,
    selectedCategory: string | null,
    priceRange: { min: number; max: number }
): Product[] => {
    if (!Array.isArray(products)) {
        return [];
    }
    let filtered = [...products];

    // Filter by search query
    if (query.trim()) {
        const searchTerm = query.toLowerCase().trim();
        filtered = filtered.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category?.name.toLowerCase().includes(searchTerm)
        );
    }

    // Filter by category
    if (selectedCategory) {
        filtered = filtered.filter(product => product.category?.name === selectedCategory);
    }

    // Filter by price range
    filtered = filtered.filter(product => {
        const discountedPrice = product.price * (1 - product.discount / 100);
        return discountedPrice >= priceRange.min && discountedPrice <= priceRange.max;
    });

    // Apply filters
    switch (filterBy) {
        case 'in_stock':
            filtered = filtered.filter(product => product.stock > 0 && !product.isOutOfStock);
            break;
        case 'on_sale':
            filtered = filtered.filter(product => product.discount > 0);
            break;
        case 'new_arrivals':
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            filtered = filtered.filter(product => new Date(product.createdAt) > thirtyDaysAgo);
            break;
        default:
            break;
    }

    // Sort products
    switch (sortBy) {
        case 'name_asc':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name_desc':
            filtered.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'price_asc':
            filtered.sort((a, b) => {
                const priceA = a.price * (1 - a.discount / 100);
                const priceB = b.price * (1 - b.discount / 100);
                return priceA - priceB;
            });
            break;
        case 'price_desc':
            filtered.sort((a, b) => {
                const priceA = a.price * (1 - a.discount / 100);
                const priceB = b.price * (1 - b.discount / 100);
                return priceB - priceA;
            });
            break;
        case 'rating_desc':
            filtered.sort((a, b) => b.rating - a.rating);
            break;
        case 'newest':
            filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            break;
    }

    return filtered;
};

export const getSortOptions = () => [
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating_desc', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
];

export const getFilterOptions = () => [
    { value: 'all', label: 'All Products' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'on_sale', label: 'On Sale' },
    { value: 'new_arrivals', label: 'New Arrivals' },
]; 