import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    StatusBar,
    TextInput,
    ScrollView,
    Image,
    Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LocationSelectionScreen from './location/LocationSelectionScreen';
import { useCart } from './context/CartContext';
import { applyCoupon } from './services/couponService';

const { width } = Dimensions.get('window');

interface CartItem {
    id: string;
    name: string;
    mrp: number;
    salePrice: number;
    discount: number;
    quantity: number;
    image: string;
}

interface Address {
    id: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
}

// Helper to ensure icon is a valid Ionicons name
const validIonicons = [
    'card-outline', 'logo-google', 'call-outline', 'add-outline', 'business-outline', 'cash-outline', 'gift-outline'
];
const getIoniconName = (icon: string) =>
    validIonicons.includes(icon) ? (icon as any) : 'card-outline';

function getValidImageUrl(images: string | string[] | undefined) {
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'string' && images[0].startsWith('http')) {
    return images[0];
  }
  return 'https://via.placeholder.com/150?text=No+Image';
}

const CheckoutScreen = () => {
    const { buyNow } = useLocalSearchParams();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedPayment, setSelectedPayment] = useState('googlepay');
    const [selectedUpiMethod, setSelectedUpiMethod] = useState('googlepay');
    const [userId, setUserId] = useState<string | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [newAddress, setNewAddress] = useState<Partial<Address>>({});
    const [expandedPayment, setExpandedPayment] = useState('upi');
    const [showLocationSelector, setShowLocationSelector] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const router = useRouter();
    const { refreshCartFromBackend } = useCart();
    const [showStatusBar, setShowStatusBar] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [orderPlacing, setOrderPlacing] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const countdownRef = useRef<any>(null);
    const [promoCode, setPromoCode] = useState('');
    const [promoError, setPromoError] = useState('');
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

    useEffect(() => {
        const fetchCartAndAddressesAndPayments = async () => {
            try {
                setLoading(true);
                const storedUserId = await AsyncStorage.getItem('userId');
                setUserId(storedUserId);
                let items: CartItem[] = [];
                let fetchedAddresses: Address[] = [];
                if (buyNow) {
                    // If buyNow param is present, use it as the only cart item
                    const parsed = JSON.parse(Array.isArray(buyNow) ? buyNow[0] : buyNow);
                    const mrp = Number(parsed.price) || 0;
                    const discount = Number(parsed.discount) || 0;
                    const salePrice = mrp - (mrp * discount / 100);
                    items = [{ ...parsed, mrp, salePrice, discount }];
                    if (storedUserId) {
                        const addrRes = await axios.get(`${API_URL}/addresses/${storedUserId}`);
                        fetchedAddresses = addrRes.data;
                        setAddresses(fetchedAddresses);
                    }
                } else if (storedUserId) {
                    const [cartRes, addrRes, paymentRes] = await Promise.all([
                        axios.get(`${API_URL}/cart/${storedUserId}`),
                        axios.get(`${API_URL}/addresses/${storedUserId}`),
                        axios.get(`${API_URL}/payment-methods/${storedUserId}`),
                    ]);
                    items = cartRes.data.map((item: any) => {
                        const prod = item.Product || item.product;
                        const mrp = Number(prod?.price) || 0;
                        const discount = Number(prod?.discount) || 0;
                        const salePrice = mrp - (mrp * discount / 100);
                        return {
                            id: item.productId?.toString() || prod?.id?.toString(),
                            name: prod?.name || '',
                            mrp,
                            salePrice,
                            discount,
                            quantity: item.quantity,
                            image: prod?.images?.[0] || '',
                        };
                    });
                    fetchedAddresses = addrRes.data;
                    setAddresses(fetchedAddresses);
                    setPaymentMethods(paymentRes.data || []);
                }
                setCartItems(items);
                // Always set default/primary address after fetching
                if (fetchedAddresses.length > 0) {
                    const defaultAddr = fetchedAddresses.find((a: any) => a.isDefault);
                    setSelectedAddressId(defaultAddr ? defaultAddr.id : fetchedAddresses[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch cart, addresses, or payment methods:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCartAndAddressesAndPayments();
    }, [buyNow]);

    // Calculate the true MRP (original price) total
    const calculateMRPTotal = () => {
        return cartItems.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
    };

    // Subtotal (discounted price)
    const calculateSubtotal = () => {
        return cartItems.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);
    };

    // Discount is the difference between MRP and subtotal
    const mrpTotal = calculateMRPTotal();
    const subtotal = calculateSubtotal();
    const savings = mrpTotal - subtotal;
    const deliveryFee = subtotal >= 399 ? 0 : 39;
    const platformFee = 9;
    const totalAmount = subtotal + deliveryFee + platformFee - promoDiscount;

    const getDeliveryDate = () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const dayAfter = new Date(today);
        dayAfter.setDate(today.getDate() + 2);

        return {
            option1: {
                day: 'Fri',
                date: `${tomorrow.getDate()} Jun`,
                selected: true
            },
            option2: {
                day: 'Sat',
                date: `${dayAfter.getDate()} Jun`,
                selected: false
            }
        };
    };

    const handleAddAddress = async () => {
        if (!userId || !newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.postalCode) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }
        try {
            const res = await axios.post(`${API_URL}/addresses`, {
                ...newAddress,
                userId,
                country: newAddress.country || 'India'
            });
            setAddresses((prev) => [...prev, res.data]);
            await AsyncStorage.setItem('hasSetAddressOnce', 'true');
            setShowAddAddress(false);
            setNewAddress({});
            setSelectedAddressId(res.data.id);
        } catch (error) {
            const err = error as any;
            console.error('Failed to add address:', err?.response?.data || err);
            Alert.alert('Error', err?.response?.data?.error || 'Failed to add address');
        }
    };

    const handleSelectAddress = (id: string) => {
        setSelectedAddressId(id);
    };

    const handlePlaceOrder = async () => {
        if (!userId) {
            Alert.alert('Error', 'Please log in to place an order.');
            return;
        }
        if (!selectedAddressId) {
            Alert.alert('Error', 'Please select a delivery address.');
            return;
        }
        const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
        if (!selectedAddress) {
            Alert.alert('Error', 'Selected address not found.');
            return;
        }
        setShowStatusBar(true);
        setCountdown(10);
        setOrderPlacing(true);
        setOrderPlaced(false);
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current!);
                    actuallyPlaceOrder();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleApplyPromo = async () => {
        setPromoError('');
        if (!promoCode) return;
        try {
            const res = await applyCoupon({ code: promoCode, userId: userId || '', cartTotal: subtotal + deliveryFee + platformFee });
            setPromoDiscount(res.discount);
            setAppliedCoupon(res.coupon);
            setPromoError('');
        } catch (err: any) {
            setPromoDiscount(0);
            setAppliedCoupon(null);
            setPromoError(err.response?.data?.message || 'Invalid coupon');
        }
    };

    const actuallyPlaceOrder = async () => {
        if (orderPlaced) return;
        setOrderPlacing(false);
        setOrderPlaced(true);
        try {
            await axios.post(`${API_URL}/orders/place-order`, {
                userId,
                address: addresses.find(addr => addr.id === selectedAddressId),
                cartItems: cartItems.map(item => ({
                    id: item.id,
                    price: item.salePrice,
                    quantity: item.quantity,
                })),
                paymentMethod: selectedPayment,
                total: totalAmount,
                couponCode: appliedCoupon?.code || undefined,
            });
            await refreshCartFromBackend();
            Alert.alert('Success', 'Order placed successfully!');
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Order placement error:', error);
            Alert.alert('Error', 'Failed to place order.');
            setShowStatusBar(false);
            setOrderPlacing(false);
            setOrderPlaced(false);
        }
    };

    const handleCancelOrder = () => {
        setShowStatusBar(false);
        setOrderPlacing(false);
        setOrderPlaced(false);
        if (countdownRef.current) clearInterval(countdownRef.current);
    };

    useEffect(() => {
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    // Handler for location selection from modal
    const handleLocationSelected = async (locationAddress: any) => {
        if (!userId || !locationAddress.line1 || !locationAddress.city || !locationAddress.state || !locationAddress.postalCode) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }
        try {
            // Save address to backend
            const res = await axios.post(`${API_URL}/addresses`, {
                ...locationAddress,
                userId,
                country: locationAddress.country || 'India',
            });
            setAddresses((prev) => [...prev, res.data]);
            await AsyncStorage.setItem('hasSetAddressOnce', 'true');
            setSelectedAddressId(res.data.id);
            setShowLocationSelector(false);
        } catch (error) {
            const err = error as any;
            console.error('Failed to add address:', err?.response?.data || err);
            Alert.alert('Error', err?.response?.data?.error || 'Failed to add address');
        }
    };

    const renderStepIndicator = () => {
        const steps = ['Address', 'Order Summary', 'Payment'];
        return (
            <View style={styles.stepContainer}>
                {steps.map((step, index) => (
                    <View key={index} style={styles.stepItem}>
                        <View style={[
                            styles.stepCircle,
                            index + 1 <= currentStep ? styles.stepCircleActive : styles.stepCircleInactive
                        ]}>
                            {index + 1 < currentStep ? (
                                <Ionicons name="checkmark" size={16} color="white" />
                            ) : (
                                <Text style={[
                                    styles.stepNumber,
                                    index + 1 === currentStep ? styles.stepNumberActive : styles.stepNumberInactive
                                ]}>
                                    {index + 1}
                                </Text>
                            )}
                        </View>
                        <Text style={[
                            styles.stepLabel,
                            index + 1 === currentStep ? styles.stepLabelActive : styles.stepLabelInactive
                        ]}>
                            {step}
                        </Text>
                        {index < steps.length - 1 && (
                            <View style={[
                                styles.stepLine,
                                index + 1 < currentStep ? styles.stepLineActive : styles.stepLineInactive
                            ]} />
                        )}
                    </View>
                ))}
            </View>
        );
    };

    const renderAddressStep = () => {
        const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

        return (
            <ScrollView style={styles.stepContent}>
                <View style={styles.addressHeader}>
                    <Text style={styles.userName}>
                        {selectedAddress ? `${selectedAddress.line1.split(',')[0]}` : 'User'}
                    </Text>
                    <Text style={styles.addressType}>HOME</Text>
                    <TouchableOpacity style={styles.changeButton}>
                        <Text style={styles.changeButtonText}>Change</Text>
                    </TouchableOpacity>
                </View>

                {selectedAddress && (
                    <View style={styles.selectedAddressContainer}>
                        <Text style={styles.selectedAddressText}>
                            {selectedAddress.line1}, {selectedAddress.line2 ? selectedAddress.line2 + ', ' : ''}
                            {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.postalCode}
                        </Text>
                        <Text style={styles.phoneNumber}>9957898979</Text>
                    </View>
                )}

                <View style={styles.mapPrompt}>
                    <Text style={styles.mapPromptText}>
                        Help us deliver faster. Confirm your location on the map.
                    </Text>
                    <TouchableOpacity style={styles.mapButton}>
                        <Text style={styles.mapButtonText}>Open Map</Text>
                    </TouchableOpacity>
                </View>

                {addresses.length > 0 && (
                    <View style={styles.addressList}>
                        <Text style={styles.sectionTitle}>Other Addresses</Text>
                        {addresses.filter(addr => addr.id !== selectedAddressId).map((addr) => (
                            <TouchableOpacity
                                key={addr.id}
                                style={styles.addressOption}
                                onPress={() => handleSelectAddress(addr.id)}
                            >
                                <Text style={styles.addressOptionText}>
                                    {addr.line1}, {addr.city}, {addr.state}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <TouchableOpacity
                    style={styles.addAddressButton}
                    onPress={() => setShowLocationSelector(true)}
                >
                    <Ionicons name="add" size={20} color="#2874F0" />
                    <Text style={styles.addAddressText}>Add New Address</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    const renderOrderSummaryStep = () => {
        const deliveryDates = getDeliveryDate();
        return (
            <ScrollView style={styles.stepContent}>
                <View style={styles.groceryBasket}>
                    <Text style={styles.basketTitle}>Grocery basket ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})</Text>
                    {cartItems.map((item) => (
                        <View key={item.id} style={styles.basketItem}>
                            <Image source={{ uri: getValidImageUrl(item.image ? [item.image] : []) }} style={styles.itemImage} />
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemName} numberOfLines={2}>{item.name ?? 'No Name'}</Text>
                                <View style={styles.itemPricing}>
                                    <Text style={styles.itemPrice}>₹{typeof item.salePrice === 'number' ? item.salePrice.toFixed(2) : 0}</Text>
                                    {item.discount > 0 && (
                                        <Text style={styles.itemOriginalPrice}>₹{typeof item.mrp === 'number' ? item.mrp.toFixed(2) : 0}</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.deliverySlot}>
                    <Text style={styles.deliveryTitle}>Choose a Delivery slot</Text>
                    <View style={styles.dateOptions}>
                        <TouchableOpacity style={[styles.dateOption, styles.dateOptionSelected]}>
                            <Text style={styles.dateOptionDay}>Fri</Text>
                            <Text style={styles.dateOptionDate}>27 Jun</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dateOption}>
                            <Text style={styles.dateOptionDay}>Sat</Text>
                            <Text style={styles.dateOptionDate}>28 Jun</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.timeSlot}>
                        <View style={styles.timeSlotOption}>
                            <View style={styles.radioSelected} />
                            <Text style={styles.timeSlotText}>8:00 AM to 8:00 PM</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.gstOption}>
                    <View style={styles.checkbox} />
                    <Text style={styles.gstText}>Use GST Invoice</Text>
                </View>

                <View style={styles.priceDetails}>
                    <Text style={styles.priceDetailsTitle}>Price Details</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>MRP ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})</Text>
                        <Text style={styles.priceValue}>₹{Math.round(mrpTotal)}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Product Discount</Text>
                        <Text style={[styles.priceValue, styles.discountValue]}>-₹{Math.round(savings)}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Platform Fee</Text>
                        <Text style={styles.priceValue}>₹{platformFee}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Delivery Fee</Text>
                        <Text style={styles.priceValue}>₹{deliveryFee}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Promo Discount</Text>
                        <Text style={[styles.priceValue, styles.discountValue]}>-₹{promoDiscount}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>₹{totalAmount}</Text>
                    </View>
                    <Text style={styles.savings}>You will save ₹{Math.round(savings)} on this order</Text>
                </View>

                <View style={styles.securityInfo}>
                    <Ionicons name="shield-checkmark" size={20} color="#28a745" />
                    <Text style={styles.securityText}>
                        Safe and secure payments. Easy returns. 100% Authentic products.
                    </Text>
                </View>

                {/* Promo Code Input */}
                <View style={{ marginVertical: 16 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Enter Promo Code</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <TextInput
                            style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8 }}
                            placeholder="Promo code"
                            value={promoCode}
                            onChangeText={setPromoCode}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity
                            style={{ marginLeft: 8, backgroundColor: '#28a745', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 }}
                            onPress={handleApplyPromo}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                    {promoError ? <Text style={{ color: 'red', marginTop: 4 }}>{promoError}</Text> : null}
                    {promoDiscount > 0 && appliedCoupon && (
                        <Text style={{ color: 'green', marginTop: 4 }}>Coupon applied: -₹{promoDiscount.toFixed(2)}</Text>
                    )}
                </View>
            </ScrollView>
        );
    };

    const renderPaymentStep = () => {
        return (
            <ScrollView style={styles.stepContent}>
                <View style={styles.paymentHeader}>
                    <View style={styles.totalAmountContainer}>
                        <Text style={styles.totalAmountLabel}>Total Amount</Text>
                        <Ionicons name="chevron-down" size={16} color="#2874F0" />
                        <Text style={styles.totalAmountValue}>₹{totalAmount}</Text>
                    </View>

                    <View style={styles.cashbackOffer}>
                        <Text style={styles.cashbackText}>99% Cashback</Text>
                        <Text style={styles.cashbackSubtext}>Claim now with payment offers</Text>
                        <View style={styles.cashbackLogos}>
                            <View style={styles.cashbackLogo} />
                            <View style={styles.cashbackLogo} />
                        </View>
                    </View>
                </View>

                <View style={styles.paymentMethods}>
                    {paymentMethods.map((method) => (
                        <View key={method.id} style={styles.paymentMethodContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.paymentMethod,
                                    expandedPayment === method.id && styles.paymentMethodExpanded
                                ]}
                                onPress={() => {
                                    setExpandedPayment(expandedPayment === method.id ? '' : method.id);
                                    setSelectedPayment(method.id);
                                }}
                            >
                                <View style={styles.paymentMethodLeft}>
                                    <Ionicons name={getIoniconName(method.icon)} size={20} color="#666" />
                                    <View style={styles.paymentMethodText}>
                                        <Text style={styles.paymentMethodLabel}>{method.label}</Text>
                                        {method.subtitle && (
                                            <Text style={styles.paymentMethodSubtitle}>{method.subtitle}</Text>
                                        )}
                                        {method.offer && (
                                            <Text style={styles.paymentMethodOffer}>{method.offer}</Text>
                                        )}
                                    </View>
                                </View>
                                <View style={styles.paymentMethodRight}>
                                    {method.action && (
                                        <Text style={styles.paymentMethodAction}>{method.action}</Text>
                                    )}
                                    <Ionicons
                                        name={expandedPayment === method.id ? "chevron-up" : "chevron-down"}
                                        size={16}
                                        color="#666"
                                    />
                                </View>
                            </TouchableOpacity>

                            {expandedPayment === method.id && method.subMethods && (
                                <View style={styles.subMethods}>
                                    {method.subMethods.map((subMethod: any) => (
                                        <TouchableOpacity
                                            key={subMethod.id}
                                            style={[
                                                styles.subMethod,
                                                selectedUpiMethod === subMethod.id && styles.subMethodSelected
                                            ]}
                                            onPress={() => setSelectedUpiMethod(subMethod.id)}
                                        >
                                            <View style={[
                                                styles.radioButton,
                                                selectedUpiMethod === subMethod.id && styles.radioButtonSelected
                                            ]}>
                                                {selectedUpiMethod === subMethod.id && (
                                                    <View style={styles.radioButtonInner} />
                                                )}
                                            </View>
                                            <Text style={styles.subMethodLabel}>{subMethod.label}</Text>
                                            {subMethod.id === 'googlepay' && selectedUpiMethod === subMethod.id && (
                                                <TouchableOpacity style={styles.payButton}>
                                                    <Text style={styles.payButtonText}>Pay ₹{totalAmount}</Text>
                                                </TouchableOpacity>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                <View style={styles.customerCount}>
                    <Text style={styles.customerCountText}>35 Crore happy customers</Text>
                    <Text style={styles.customerCountText}>and counting!</Text>
                    <Text style={styles.customerCountEmoji}>😊</Text>
                </View>
            </ScrollView>
        );
    };

    const renderBottomButton = () => {
        const buttonText = currentStep === 1 ? 'Continue' :
            currentStep === 2 ? 'Continue' : 'Place Order';
        const total = totalAmount;

        return (
            <View style={styles.bottomContainer}>
                <View style={styles.bottomLeft}>
                    <Text style={styles.bottomPrice}>₹{total}</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewDetails}>View price details</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => {
                        if (currentStep === 1) {
                            if (!selectedAddressId) {
                                Alert.alert('Error', 'Please select an address');
                                return;
                            }
                            setCurrentStep(2);
                        } else if (currentStep === 2) {
                            setCurrentStep(3);
                        } else {
                            handlePlaceOrder();
                        }
                    }}
                >
                    <Text style={styles.continueButtonText}>{buttonText}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                    if (currentStep > 1) {
                        setCurrentStep(currentStep - 1);
                    } else {
                        router.back();
                    }
                }}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {currentStep === 3 ? `Step ${currentStep} of 3` : ''}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {currentStep < 3 && renderStepIndicator()}

            {currentStep === 3 && (
                <View style={styles.paymentStepHeader}>
                    <Text style={styles.paymentStepTitle}>Payments</Text>
                    <View style={styles.secureIndicator}>
                        <Ionicons name="lock-closed" size={12} color="#666" />
                        <Text style={styles.secureText}>100% Secure</Text>
                    </View>
                </View>
            )}

            <View style={styles.content}>
                {currentStep === 1 && renderAddressStep()}
                {currentStep === 2 && renderOrderSummaryStep()}
                {currentStep === 3 && renderPaymentStep()}
            </View>

            {renderBottomButton()}

            {showLocationSelector && (
                <LocationSelectionScreen
                    onLocationSelected={handleLocationSelected}
                    userId={userId}
                    editingAddress={null}
                    savedAddress={null}
                    onBack={() => setShowLocationSelector(false)}
                />
            )}

            {showStatusBar && (
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 60, zIndex: 100, backgroundColor: '#fffbe6', borderTopWidth: 1, borderColor: '#ffe58f', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    {!orderPlaced ? (
                        <>
                            <Text style={{ color: '#faad14', fontWeight: 'bold', fontSize: 15 }}>
                                Confirming your order in {countdown} sec...
                            </Text>
                            <TouchableOpacity onPress={handleCancelOrder} style={{ backgroundColor: '#fff1f0', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ffccc7', marginLeft: 16 }}>
                                <Text style={{ color: '#ff4d4f', fontWeight: 'bold' }}>Cancel</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <Text style={{ color: '#52c41a', fontWeight: 'bold', fontSize: 15 }}>Confirming your order...</Text>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 20,
        justifyContent: 'center',
    },
    stepItem: {
        alignItems: 'center',
        position: 'relative',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    stepCircleActive: {
        backgroundColor: '#2874F0',
    },
    stepCircleInactive: {
        backgroundColor: '#E0E0E0',
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '600',
    },
    stepNumberActive: {
        color: '#FFFFFF',
    },
    stepNumberInactive: {
        color: '#999',
    },
    stepLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
    stepLabelActive: {
        color: '#2874F0',
        fontWeight: '600',
    },
    stepLabelInactive: {
        color: '#999',
    },
    stepLine: {
        position: 'absolute',
        top: 16,
        left: 32,
        width: 60,
        height: 2,
    },
    stepLineActive: {
        backgroundColor: '#2874F0',
    },
    stepLineInactive: {
        backgroundColor: '#E0E0E0',
    },
    paymentStepHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    paymentStepTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    secureIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    secureText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    content: {
        flex: 1,
    },
    stepContent: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    // Address Step Styles
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        flex: 1,
    },
    addressType: {
        fontSize: 12,
        color: '#666',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 12,
    },
    changeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#2874F0',
        borderRadius: 4,
    },
    changeButtonText: {
        fontSize: 12,
        color: '#2874F0',
        fontWeight: '600',
    },
    selectedAddressContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 8,
    },
    selectedAddressText: {
        fontSize: 14,
        color: '#000',
        lineHeight: 20,
        marginBottom: 4,
    },
    phoneNumber: {
        fontSize: 14,
        color: '#000',
    },
    mapPrompt: {
        backgroundColor: '#FFF3E0',
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    mapPromptText: {
        flex: 1,
        fontSize: 12,
        color: '#F57C00',
        marginRight: 12,
    },
    // Continuing from the mapButton style...
    mapButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#F57C00',
    },
    mapButtonText: {
        fontSize: 12,
        color: '#F57C00',
        fontWeight: '600',
    },
    addressList: {
        backgroundColor: '#FFFFFF',
        marginTop: 8,
        paddingVertical: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    addressOption: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    addressOptionText: {
        fontSize: 14,
        color: '#333',
    },
    addAddressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    addAddressText: {
        fontSize: 14,
        color: '#2874F0',
        fontWeight: '600',
        marginLeft: 8,
    },
    addAddressForm: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    formTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#000',
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    formButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    saveButton: {
        backgroundColor: '#2874F0',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 4,
        flex: 1,
        marginRight: 8,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    cancelButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        flex: 1,
        marginLeft: 8,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },

    // Order Summary Step Styles
    groceryBasket: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        marginBottom: 8,
    },
    basketTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    basketItem: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 4,
        marginRight: 12,
        backgroundColor: '#F8F8F8',
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        color: '#000',
        fontWeight: '500',
        marginBottom: 4,
    },
    itemPricing: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginRight: 8,
    },
    itemOriginalPrice: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    paymentOption: {
        fontSize: 12,
        color: '#2874F0',
        fontWeight: '500',
    },
    deliverySlot: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        marginBottom: 8,
    },
    deliveryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    dateOptions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    dateOption: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginRight: 12,
        backgroundColor: '#FFFFFF',
    },
    dateOptionSelected: {
        borderColor: '#2874F0',
        backgroundColor: '#F0F7FF',
    },
    dateOptionDay: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    dateOptionDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    timeSlot: {
        paddingHorizontal: 16,
    },
    timeSlotOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    radioSelected: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#2874F0',
        marginRight: 12,
    },
    timeSlotText: {
        fontSize: 14,
        color: '#000',
    },
    gstOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 8,
    },
    checkbox: {
        width: 16,
        height: 16,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginRight: 12,
        backgroundColor: '#FFFFFF',
    },
    gstText: {
        fontSize: 14,
        color: '#000',
    },
    priceDetails: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        marginBottom: 8,
    },
    priceDetailsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    priceLabel: {
        fontSize: 14,
        color: '#666',
    },
    priceValue: {
        fontSize: 14,
        color: '#000',
        fontWeight: '500',
    },
    discountValue: {
        color: '#388E3C',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 16,
        marginVertical: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    savings: {
        fontSize: 12,
        color: '#388E3C',
        fontWeight: '500',
        paddingHorizontal: 16,
        marginTop: 8,
    },
    securityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E8',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 8,
    },
    securityText: {
        fontSize: 12,
        color: '#2E7D32',
        marginLeft: 8,
        flex: 1,
    },

    // Payment Step Styles
    paymentHeader: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        marginBottom: 8,
    },
    totalAmountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    totalAmountLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    totalAmountValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginLeft: 8,
    },
    cashbackOffer: {
        backgroundColor: '#FFF3E0',
        marginHorizontal: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    cashbackText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F57C00',
        marginBottom: 4,
    },
    cashbackSubtext: {
        fontSize: 12,
        color: '#F57C00',
        marginBottom: 8,
    },
    cashbackLogos: {
        flexDirection: 'row',
    },
    cashbackLogo: {
        width: 24,
        height: 16,
        backgroundColor: '#FFE0B2',
        borderRadius: 2,
        marginRight: 8,
    },
    paymentMethods: {
        backgroundColor: '#FFFFFF',
    },
    paymentMethodContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    paymentMethodExpanded: {
        backgroundColor: '#F8F9FA',
    },
    paymentMethodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    paymentMethodText: {
        marginLeft: 12,
        flex: 1,
    },
    paymentMethodLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
        marginBottom: 2,
    },
    paymentMethodSubtitle: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    paymentMethodOffer: {
        fontSize: 11,
        color: '#388E3C',
        fontWeight: '500',
    },
    paymentMethodRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentMethodAction: {
        fontSize: 12,
        color: '#2874F0',
        fontWeight: '600',
        marginRight: 8,
    },
    subMethods: {
        backgroundColor: '#F8F9FA',
        paddingTop: 8,
    },
    subMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 12,
    },
    subMethodSelected: {
        backgroundColor: '#E3F2FD',
    },
    radioButton: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        borderColor: '#2874F0',
    },
    radioButtonInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2874F0',
    },
    subMethodLabel: {
        fontSize: 14,
        color: '#000',
        flex: 1,
    },
    payButton: {
        backgroundColor: '#2874F0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
    },
    payButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    customerCount: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: '#FFFFFF',
        marginTop: 16,
    },
    customerCountText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    customerCountEmoji: {
        fontSize: 18,
        marginTop: 8,
    },

    // Bottom Container Styles
    bottomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    bottomLeft: {
        flex: 1,
    },
    bottomPrice: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 2,
    },
    viewDetails: {
        fontSize: 12,
        color: '#2874F0',
        textDecorationLine: 'underline',
    },
    continueButton: {
        backgroundColor: '#FF9800',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 4,
        minWidth: 120,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
});


export default CheckoutScreen; 