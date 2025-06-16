import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  FlatList,
  Dimensions, // Import Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');
// Calculate width for subcategory cards
const SUB_CATEGORY_CARD_MARGIN = 6; // Margin between cards
const SUB_CATEGORY_CARD_WIDTH = (width - (10 * 2) - (SUB_CATEGORY_CARD_MARGIN * (3 - 1))) / 3; // Total width - (2 * container padding) - (margins between cards) / numColumns

interface SubCategory {
  id: number;
  name: string;
  image: string;
}

interface Category {
  id: number;
  name: string;
  subcategories: SubCategory[];
}

const mockCategories: Category[] = [
  {
    id: 1,
    name: 'Groceries',
    subcategories: [
      { id: 1, name: 'Vegetables & Fruits', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/vegetables_fruits.png' },
      { id: 2, name: 'Atta, Dal & Rice', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/atta_dal_rice.png' },
      { id: 3, name: 'Oil, Ghee & Masala', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/oil_ghee_masala.png' },
      { id: 4, name: 'Dairy, Bread & Milk', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/dairy_bread_milk.png' },
      { id: 5, name: 'Biscuits, Snacks & Bakery', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/biscuits_snacks_bakery.png' },
      { id: 6, name: 'Ice Creams & much more', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/ice_cream.png' },
      { id: 7, name: 'Noodles, Pasta & Soup', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/noodles.png' },
      { id: 8, name: 'Dry Fruits & Cereals', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/dry_fruits.png' },
      { id: 9, name: 'Kitchen & Appliances', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/kitchen_appliances.png' },
      { id: 10, name: 'Tea & Coffees', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/tea_coffee.png' },
      { id: 11, name: 'Chips & Namkeens', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/chips_namkeens.png' },
      { id: 12, name: 'Sweets & Chocolates', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/sweets_chocolates.png' },
      { id: 13, name: 'Drinks & Juices', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/drinks_juices.png' },
      { id: 14, name: 'Sauces & Spreads', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/sauces_spreads.png' },
      { id: 15, name: 'Laundry & Detergents', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/laundry_detergents.png' },
      { id: 16, name: 'Dishwash & Cleaners', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/dishwash_cleaners.png' },
      { id: 17, name: 'Pooja Needs', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/pooja_needs.png' },
      { id: 18, name: 'Home Fragrances & Air Fresheners', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/home_fragrances.png' },
      { id: 19, name: 'Pet Care', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/pet_care.png' },
    ],
  },
  {
    id: 2,
    name: 'Cosmetics',
    subcategories: [
      { id: 1, name: 'Makeup', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/beauty_cosmetics.png' },
      { id: 2, name: 'Skincare', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/skincare.png' },
      { id: 3, name: 'Haircare', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/haircare.png' },
      { id: 4, name: 'Fragrances', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/fragrances.png' },
      { id: 5, name: 'Personal Care', image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/personal_care.png' },
    ],
  },
];

const CategoriesScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(mockCategories[0]);
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>

      <View style={styles.contentContainer}>
        {/* Left Side: Main Categories List */}
        <ScrollView style={styles.mainCategoryList} showsVerticalScrollIndicator={false}>
          {mockCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.mainCategoryItem,
                selectedCategory?.id === category.id && styles.mainCategoryItemActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.mainCategoryText,
                  selectedCategory?.id === category.id && styles.mainCategoryTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Right Side: Subcategories Grid */}
        {/* Changed from ScrollView to View to resolve VirtualizedLists nesting issue */}
        <View style={styles.subCategoryGridContainer}>
          {selectedCategory ? (
            <FlatList
              data={selectedCategory.subcategories}
              keyExtractor={(item) => item.id.toString()}
              numColumns={3} // Adjust as needed
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.subCategoryCard}>
                  <Image source={{ uri: item.image }} style={styles.subCategoryImage} />
                  <Text style={styles.subCategoryName}>{item.name}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.subCategoryListContent}
            />
          ) : (
            <View style={styles.noCategorySelected}>
              <Text style={styles.noCategoryText}>Select a category to view subcategories.</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  mainCategoryList: {
    width: 120, // Fixed width for main category list
    backgroundColor: '#F5F5F5',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  mainCategoryItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCategoryItemActive: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#CB202D', // Zomato Red
  },
  mainCategoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    textAlign: 'center',
  },
  mainCategoryTextActive: {
    color: '#CB202D',
    fontWeight: 'bold',
  },
  subCategoryGridContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  subCategoryListContent: {
    // No specific justifyContent or alignItems needed here if card widths and margins are controlled well
    // Just ensure items start from the beginning if that's desired, or centered if numColumns isn't filled.
    // If we use precise width and margin, FlatList itself will handle alignment.
  },
  subCategoryCard: {
    width: SUB_CATEGORY_CARD_WIDTH,
    marginHorizontal: SUB_CATEGORY_CARD_MARGIN / 2, // Half margin on each side for total of SUB_CATEGORY_CARD_MARGIN between cards
    marginBottom: SUB_CATEGORY_CARD_MARGIN, // Vertical margin
    aspectRatio: 1, // Make cards square
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  subCategoryImage: {
    width: '70%',
    height: '70%',
    resizeMode: 'contain',
    marginBottom: 5,
  },
  subCategoryName: {
    fontSize: 11,
    textAlign: 'center',
    color: '#333333',
    flexWrap: 'wrap', // Ensure text wraps
  },
  noCategorySelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCategoryText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default CategoriesScreen;