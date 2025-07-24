import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../app/config';

type SortOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';
type FilterOption = 'all' | 'in_stock' | 'on_sale' | 'new_arrivals';

interface Category {
    id: string;
    name: string;
}

interface SearchWithFiltersProps {
    onSearchChange: (query: string) => void;
    onSortChange: (sortBy: SortOption) => void;
    onFilterChange: (filterBy: FilterOption) => void;
    onCategoryChange: (categoryId: string | null) => void;
    query: string;
    sortBy: SortOption;
    filterBy: FilterOption;
    selectedCategory: string | null;
}

const SearchWithFilters: React.FC<SearchWithFiltersProps> = ({
    onSearchChange,
    onSortChange,
    onFilterChange,
    onCategoryChange,
    query,
    sortBy,
    filterBy,
    selectedCategory,
}) => {
    const [localQuery, setLocalQuery] = useState(query);
    const [showSortModal, setShowSortModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Fetch categories from backend
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${API_URL}/categories`);
                setCategories(response.data.categories || response.data);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearchChange(localQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [localQuery, onSearchChange]);

    const handleClearSearch = () => {
        setLocalQuery('');
        onSearchChange('');
    };

    const sortOptions: { value: SortOption; label: string; icon: string }[] = [
        { value: 'name_asc', label: 'Name A-Z', icon: 'text' },
        { value: 'name_desc', label: 'Name Z-A', icon: 'text' },
        { value: 'price_asc', label: 'Price Low to High', icon: 'trending-up' },
        { value: 'price_desc', label: 'Price High to Low', icon: 'trending-down' },
        { value: 'rating_desc', label: 'Highest Rated', icon: 'star' },
        { value: 'newest', label: 'Newest First', icon: 'time' },
    ];

    const filterOptions: { value: FilterOption; label: string; icon: string }[] = [
        { value: 'all', label: 'All Products', icon: 'grid' },
        { value: 'in_stock', label: 'In Stock', icon: 'checkmark-circle' },
        { value: 'on_sale', label: 'On Sale', icon: 'pricetag' },
        { value: 'new_arrivals', label: 'New Arrivals', icon: 'sparkles' },
    ];

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search products..."
                        value={localQuery}
                        onChangeText={setLocalQuery}
                        placeholderTextColor="#999"
                    />
                    {localQuery.length > 0 && (
                        <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterButtonsContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, showSortModal && styles.activeFilterButton]}
                    onPress={() => setShowSortModal(true)}
                >
                    <Ionicons name="funnel" size={16} color={showSortModal ? '#fff' : '#666'} />
                    <Text style={[styles.filterButtonText, showSortModal && styles.activeFilterButtonText]}>
                        Sort
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterButton, showFilterModal && styles.activeFilterButton]}
                    onPress={() => setShowFilterModal(true)}
                >
                    <Ionicons name="options" size={16} color={showFilterModal ? '#fff' : '#666'} />
                    <Text style={[styles.filterButtonText, showFilterModal && styles.activeFilterButtonText]}>
                        Filter
                    </Text>
                </TouchableOpacity>

                {selectedCategory && (
                    <TouchableOpacity
                        style={styles.categoryChip}
                        onPress={() => onCategoryChange(null)}
                    >
                        <Text style={styles.categoryChipText}>{selectedCategory}</Text>
                        <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Sort Modal */}
            <Modal
                visible={showSortModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowSortModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Sort By</Text>
                            <TouchableOpacity onPress={() => setShowSortModal(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            {sortOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.optionItem,
                                        sortBy === option.value && styles.selectedOption,
                                    ]}
                                    onPress={() => {
                                        onSortChange(option.value);
                                        setShowSortModal(false);
                                    }}
                                >
                                    <Ionicons
                                        name={option.icon as any}
                                        size={20}
                                        color={sortBy === option.value ? '#007AFF' : '#666'}
                                    />
                                    <Text
                                        style={[
                                            styles.optionText,
                                            sortBy === option.value && styles.selectedOptionText,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                    {sortBy === option.value && (
                                        <Ionicons name="checkmark" size={20} color="#007AFF" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter By</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            {/* Filter Options */}
                            <Text style={styles.sectionTitle}>Availability</Text>
                            {filterOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.optionItem,
                                        filterBy === option.value && styles.selectedOption,
                                    ]}
                                    onPress={() => {
                                        onFilterChange(option.value);
                                        setShowFilterModal(false);
                                    }}
                                >
                                    <Ionicons
                                        name={option.icon as any}
                                        size={20}
                                        color={filterBy === option.value ? '#007AFF' : '#666'}
                                    />
                                    <Text
                                        style={[
                                            styles.optionText,
                                            filterBy === option.value && styles.selectedOptionText,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                    {filterBy === option.value && (
                                        <Ionicons name="checkmark" size={20} color="#007AFF" />
                                    )}
                                </TouchableOpacity>
                            ))}

                            {/* Categories */}
                            <Text style={styles.sectionTitle}>Categories</Text>
                            <TouchableOpacity
                                style={[
                                    styles.optionItem,
                                    !selectedCategory && styles.selectedOption,
                                ]}
                                onPress={() => {
                                    onCategoryChange(null);
                                    setShowFilterModal(false);
                                }}
                            >
                                <Ionicons
                                    name="grid"
                                    size={20}
                                    color={!selectedCategory ? '#007AFF' : '#666'}
                                />
                                <Text
                                    style={[
                                        styles.optionText,
                                        !selectedCategory && styles.selectedOptionText,
                                    ]}
                                >
                                    All Categories
                                </Text>
                                {!selectedCategory && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                            </TouchableOpacity>

                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[
                                        styles.optionItem,
                                        selectedCategory === category.name && styles.selectedOption,
                                    ]}
                                    onPress={() => {
                                        onCategoryChange(category.name);
                                        setShowFilterModal(false);
                                    }}
                                >
                                    <Ionicons
                                        name="folder"
                                        size={20}
                                        color={selectedCategory === category.name ? '#007AFF' : '#666'}
                                    />
                                    <Text
                                        style={[
                                            styles.optionText,
                                            selectedCategory === category.name && styles.selectedOptionText,
                                        ]}
                                    >
                                        {category.name}
                                    </Text>
                                    {selectedCategory === category.name && (
                                        <Ionicons name="checkmark" size={20} color="#007AFF" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchContainer: {
        marginBottom: 12,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        marginLeft: 8,
    },
    filterButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    activeFilterButton: {
        backgroundColor: '#007AFF',
    },
    filterButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeFilterButtonText: {
        color: '#fff',
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    categoryChipText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    modalBody: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        marginTop: 16,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 4,
        gap: 12,
    },
    selectedOption: {
        backgroundColor: '#f0f8ff',
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    selectedOptionText: {
        color: '#007AFF',
        fontWeight: '500',
    },
});

export default SearchWithFilters; 