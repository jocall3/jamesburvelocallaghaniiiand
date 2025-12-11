```tsx
import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

interface BondTradingDeskProps {
    bondDetails: any; // Define the type for bond details
}

const BondTradingDesk: React.FC<BondTradingDeskProps> = ({ bondDetails }) => {
    const [orderType, setOrderType] = useState('');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState(''); // Or yield, depending on the bond
    const [side, setSide] = useState(''); // Buy or Sell

    const handleOrderTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setOrderType(event.target.value as string);
    };

    const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuantity(event.target.value);
    };

    const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPrice(event.target.value);
    };

    const handleSideChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setSide(event.target.value as string);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Implement order submission logic here
        console.log('Order Submitted:', { orderType, quantity, price, side });
        // You would typically send this data to an API
    };


    if (!bondDetails) {
        return <Typography variant="h6">Select a bond to trade.</Typography>;
    }


    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Bond Trading Desk
            </Typography>

            <Typography variant="subtitle1" gutterBottom>
                {bondDetails.issueName} ({bondDetails.isin})
            </Typography>

            <form onSubmit={handleSubmit}>
                <FormControl fullWidth margin="normal">
                    <InputLabel id="order-type-label">Order Type</InputLabel>
                    <Select
                        labelId="order-type-label"
                        id="order-type"
                        value={orderType}
                        label="Order Type"
                        onChange={handleOrderTypeChange}
                    >
                        <MenuItem value="market">Market</MenuItem>
                        <MenuItem value="limit">Limit</MenuItem>
                        {/* Add more order types as needed */}
                    </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                    <InputLabel id="side-label">Buy/Sell</InputLabel>
                    <Select
                        labelId="side-label"
                        id="side"
                        value={side}
                        label="Buy/Sell"
                        onChange={handleSideChange}
                    >
                        <MenuItem value="buy">Buy</MenuItem>
                        <MenuItem value="sell">Sell</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    margin="normal"
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={handleQuantityChange}
                />

                <TextField
                    fullWidth
                    margin="normal"
                    label={orderType === 'limit' ? "Limit Price" : "Price"}
                    type="number"
                    value={price}
                    onChange={handlePriceChange}
                />



                <Button type="submit" variant="contained" color="primary">
                    Place Order
                </Button>
            </form>
        </Box>
    );
};

export default BondTradingDesk;
```