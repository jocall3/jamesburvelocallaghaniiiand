```typescript
import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { useProducts } from './useProducts';
import { useShopWithPoints } from './useShopWithPoints';
import { Intent, IntentHandler, IntentMap } from '../types';

interface UseCommandIntentProps {
    onShowProfile: () => void;
    onSignOut: () => void;
    onLinkCard: (cardNumber: string, phoneNumber: string) => Promise<void>;
    onGetProducts: () => Promise<void>;
}

export const useCommandIntent = (props: UseCommandIntentProps) => {
    const { onShowProfile, onSignOut, onLinkCard, onGetProducts } = props;
    const { isAuthenticated } = useAuth();
    const { profile, isLoadingProfile, errorProfile } = useProfile();
    const { products, isLoadingProducts, errorProducts, fetchProducts } = useProducts();
    const { linkCard, isLoadingLinkCard, errorLinkCard } = useShopWithPoints();


    const intentMap: IntentMap = useMemo(() => ({
        'show profile': {
            handler: () => {
                onShowProfile();
            },
            requiredAuth: true,
        },
        'sign out': {
            handler: () => {
                onSignOut();
            },
            requiredAuth: true,
        },
        'link card': {
            handler: async (cardNumber: string, phoneNumber: string) => {
                if (!cardNumber || !phoneNumber) {
                    throw new Error("Card number and phone number are required.");
                }
                await onLinkCard(cardNumber, phoneNumber);
            },
            requiredAuth: true,
        },
        'get products': {
            handler: async () => {
                await onGetProducts();
            },
            requiredAuth: true,
        }
    }), [onShowProfile, onSignOut, onLinkCard, onGetProducts]);

    const handleIntent = useCallback(
        async (intent: Intent, ...args: any[]) => {
            const handlerConfig = intentMap[intent.name];

            if (!handlerConfig) {
                console.warn(`No handler found for intent: ${intent.name}`);
                return false;
            }

            if (handlerConfig.requiredAuth && !isAuthenticated) {
                console.warn(`Authentication required for intent: ${intent.name}`);
                return false;
            }

            try {
                await handlerConfig.handler(...args);
                return true;
            } catch (error) {
                console.error(`Error handling intent ${intent.name}:`, error);
                return false;
            }
        },
        [intentMap, isAuthenticated]
    );

    return {
        handleIntent,
        isLoadingProfile,
        errorProfile,
        profile,
        isLoadingProducts,
        errorProducts,
        products,
        isLoadingLinkCard,
        errorLinkCard,
        linkCard,
    };
};
```