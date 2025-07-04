import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationSelectionScreen from '../location/LocationSelectionScreen';

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
            const addr = await AsyncStorage.getItem('userAddress');
            if (addr) {
                const parsed = JSON.parse(addr);
                if (isWithinNalbari(parsed.latitude, parsed.longitude)) {
                    setUserLocation(parsed);
                    setShowLocationScreen(false);
                } else {
                    setShowLocationScreen(true);
                }
            } else {
                setShowLocationScreen(true);
            }
            setLoading(false);
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