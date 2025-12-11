```tsx
import React, { useState, useEffect } from 'react';
import { Typography, List, ListItem, ListItemText, CircularProgress } from '@mui/material';

interface Product {
  accountId: string;
  status: string;
  productName: string;
  accountType: string;
  accountNumberDisplay: string;
}

interface ProductsResponse {
  customerId: string;
  products: Product[];
}

const ExternalProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Replace with your actual API endpoint and headers
        const apiUrl = '/api/productDirectory/v1/products';
        const accessToken = localStorage.getItem('accessToken'); // Retrieve access token
        const clientId = 'your-client-id'; // Replace with your client ID

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'client_id': clientId,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (response.status === 204) {
          // No content found
          setProducts([]);
          setError("No products found.");
        } else {
          const data: ProductsResponse = await response.json();
          setProducts(data.products);
        }
      } catch (e: any) {
        setError(e.message || 'An error occurred while fetching products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <CircularProgress />
        <Typography variant="body1">Loading Products...</Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
        <Typography variant="body1">Error: {error}</Typography>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Typography variant="body1">No products found.</Typography>
      </div>
    );
  }

  return (
    <>
      <Typography variant="h6" gutterBottom>
        External Citi Products:
      </Typography>
      <List>
        {products.map((product) => (
          <ListItem key={product.accountId} divider>
            <ListItemText
              primary={product.productName}
              secondary={`${product.accountType} - ${product.accountNumberDisplay} (Status: ${product.status})`}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
};

export default ExternalProductList;
```