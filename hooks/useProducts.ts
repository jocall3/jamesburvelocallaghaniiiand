import { useState, useEffect, useCallback } from 'react';
import { Product, fetchProducts, fetchProductById } from '../api/products'; // Assuming an API utility file exists

/**
 * Interface for the state managed by the useProducts hook.
 */
interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  selectedProduct: Product | null;
}

/**
 * React hook for fetching and managing product data.
 *
 * @param productId Optional ID of a specific product to fetch initially.
 * @returns An object containing products, loading state, error, and a function to refetch.
 */
export const useProducts = (productId?: string): ProductsState & { refetch: () => Promise<void> } => {
  const [state, setState] = useState<ProductsState>({
    products: [],
    loading: true,
    error: null,
    selectedProduct: null,
  });

  const fetchAllProducts = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchProducts();
      setState(prev => ({
        ...prev,
        products: data,
        loading: false,
      }));
    } catch (err) {
      console.error("Error fetching products:", err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'An unknown error occurred while fetching products.',
      }));
    }
  }, []);

  const fetchSingleProduct = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null, selectedProduct: null }));
    try {
      const data = await fetchProductById(id);
      setState(prev => ({
        ...prev,
        selectedProduct: data,
        loading: false,
      }));
    } catch (err) {
      console.error(`Error fetching product ${id}:`, err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : `An unknown error occurred while fetching product ${id}.`,
      }));
    }
  }, []);

  useEffect(() => {
    if (productId) {
      fetchSingleProduct(productId);
    } else {
      fetchAllProducts();
    }
  }, [productId, fetchAllProducts, fetchSingleProduct]);

  const refetch = useCallback(async () => {
    if (productId) {
      await fetchSingleProduct(productId);
    } else {
      await fetchAllProducts();
    }
  }, [productId, fetchAllProducts, fetchSingleProduct]);

  return {
    ...state,
    refetch,
  };
};

// --- Mock Types/APIs for completeness (These would typically be imported) ---
// In a real project, Product and API functions would be defined elsewhere.

/*
// Example Mock Product Type
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  isActive: boolean;
}

// Example Mock API Functions
const mockProducts: Product[] = [
  { id: 'prod_1', name: 'Basic Subscription', price: 9.99, description: 'Monthly access', isActive: true },
  { id: 'prod_2', name: 'Premium Subscription', price: 19.99, description: 'Yearly access with features', isActive: true },
];

const fetchProducts = async (): Promise<Product[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockProducts), 500);
  });
};

const fetchProductById = async (id: string): Promise<Product> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const product = mockProducts.find(p => p.id === id);
      if (product) {
        resolve(product);
      } else {
        reject(new Error(`Product with ID ${id} not found`));
      }
    }, 300);
  });
};
*/