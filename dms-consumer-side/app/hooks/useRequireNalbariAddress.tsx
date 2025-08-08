import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationSelectionScreen from '../location/LocationSelectionScreen';
import { API_URL } from '../config';

const NALBARI_BOUNDS = {
    northeast: { lat: 26.464, lng: 91.468 },
    southwest: { lat: 26.420, lng: 91.410 },
};

function isWithinNalbari(lat: number, lng: number) {
    return (
        lat >= NALBARI_BOUNDS.southwest.lat &&
        lat <= NALBARI_BOUNDS.northeast.lat &&
        lng >= NALBARI_BOUNDS.southwest.lng &&
        lng <= NALBARI_BOUNDS.northeast.lng
    );
}

export default function useRequireNalbariAddress() {
    const [showLocationScreen, setShowLocationScreen] = useState(false);
    const [userLocation, setUserLocation] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAddress = async () => {
            try {
                // First check AsyncStorage
                const addr = await AsyncStorage.getItem('userAddress');
                if (addr) {
                    const parsed = JSON.parse(addr);
                    if (isWithinNalbari(parsed.latitude, parsed.longitude)) {
                        setUserLocation(parsed);
                        setShowLocationScreen(false);
                        setLoading(false);
                        return;
                    } else {
                        setShowLocationScreen(true);
                        setLoading(false);
                        return;
                    }
                }

                // If no local address, check backend for existing addresses
                const userId = await AsyncStorage.getItem('userId');
                if (userId) {
                    try {
                        const response = await fetch(`${API_URL}/addresses/${userId}`);
                        if (response.ok) {
                            const addresses = await response.json();
                            if (addresses && addresses.length > 0) {
                                // User has addresses in backend, use the first one as primary
                                const primaryAddress = addresses.find((addr: any) => addr.isDefault) || addresses[0];
                                
                                if (isWithinNalbari(primaryAddress.latitude, primaryAddress.longitude)) {
                                    await AsyncStorage.setItem('userAddress', JSON.stringify(primaryAddress));
                                    setUserLocation(primaryAddress);
                                    setShowLocationScreen(false);
                                    setLoading(false);
                                    return;
                                } else {
                                    setShowLocationScreen(true);
                                    setLoading(false);
                                    return;
                                }
                            }
                        }
                    } catch (backendError) {
                        console.log('Backend check failed in useRequireNalbariAddress:', backendError);
                    }
                }

                // No addresses found anywhere
                setShowLocationScreen(true);
                setLoading(false);
            } catch (error) {
                console.error('Error in useRequireNalbariAddress:', error);
                setShowLocationScreen(true);
                setLoading(false);
            }
        };
        checkAddress();
    }, []);

    const locationScreen = showLocationScreen ? (
        <LocationSelectionScreen
            onLocationSelected={(address: any) => {
                setUserLocation(address);
                setShowLocationScreen(false);
            }}
            savedAddress={userLocation}
        />
    ) : null;

    return { address: userLocation, loading, locationScreen };
} 