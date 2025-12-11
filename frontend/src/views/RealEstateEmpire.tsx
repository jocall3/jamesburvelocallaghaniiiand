```typescript
import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Text,
    Button,
    Input,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    VStack,
    HStack,
    Divider,
    useToast,
    Flex,
    Spacer,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Stack,
    ButtonGroup,
} from '@chakra-ui/react';

interface Property {
    id: number;
    name: string;
    purchasePrice: number;
    rent: number;
}

const RealEstateEmpire = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [propertyName, setPropertyName] = useState('');
    const [propertyPurchasePrice, setPropertyPurchasePrice] = useState(0);
    const [propertyRent, setPropertyRent] = useState(0);
    const [totalValue, setTotalValue] = useState(0);
    const [totalRent, setTotalRent] = useState(0);

    const toast = useToast();

    useEffect(() => {
        calculateTotals();
    }, [properties]);


    const handleAddProperty = () => {
        if (!propertyName || propertyPurchasePrice <= 0 || propertyRent <= 0) {
            toast({
                title: 'Error',
                description: 'Please fill in all fields with valid values.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const newProperty: Property = {
            id: properties.length > 0 ? Math.max(...properties.map(p => p.id)) + 1 : 1,
            name: propertyName,
            purchasePrice: propertyPurchasePrice,
            rent: propertyRent,
        };

        setProperties([...properties, newProperty]);
        setPropertyName('');
        setPropertyPurchasePrice(0);
        setPropertyRent(0);

        toast({
            title: 'Property Added',
            description: `${propertyName} added to your empire!`,
            status: 'success',
            duration: 3000,
            isClosable: true,
        });
    };

    const handleDeleteProperty = (id: number) => {
        setProperties(properties.filter(property => property.id !== id));
        toast({
            title: 'Property Deleted',
            description: `Property deleted from your empire.`,
            status: 'success',
            duration: 3000,
            isClosable: true,
        });
    };

    const calculateTotals = () => {
        let value = 0;
        let rent = 0;
        properties.forEach(property => {
            value += property.purchasePrice;
            rent += property.rent;
        });
        setTotalValue(value);
        setTotalRent(rent);
    };


    return (
        <Box p={5} maxW="container.xl" mx="auto">
            <Heading mb={4} textAlign="center">
                Real Estate Empire
            </Heading>

            {/* Add Property Section */}
            <Card mb={5}>
                <CardHeader>
                    <Heading size="md">Add a New Property</Heading>
                </CardHeader>
                <CardBody>
                    <VStack spacing={3} align="stretch">
                        <Text>Property Name:</Text>
                        <Input
                            placeholder="Property Address or Name"
                            value={propertyName}
                            onChange={(e) => setPropertyName(e.target.value)}
                        />

                        <Text>Purchase Price:</Text>
                        <NumberInput
                            precision={2}
                            step={1000}
                            value={propertyPurchasePrice}
                            onChange={(valueString) => setPropertyPurchasePrice(parseFloat(valueString))}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>

                        <Text>Monthly Rent:</Text>
                        <NumberInput
                            precision={2}
                            step={100}
                            value={propertyRent}
                            onChange={(valueString) => setPropertyRent(parseFloat(valueString))}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>

                        <Button colorScheme="green" onClick={handleAddProperty}>
                            Add Property
                        </Button>
                    </VStack>
                </CardBody>
            </Card>

            {/* Property List Section */}
            <Heading size="md" mb={2}>
                Your Properties
            </Heading>
            <Divider mb={4} />

            {properties.length === 0 ? (
                <Text>No properties yet. Add some to start building your empire!</Text>
            ) : (
                <VStack spacing={4} align="stretch">
                    {properties.map(property => (
                        <Card key={property.id}>
                            <CardHeader>
                                <Flex>
                                    <Heading size="sm">{property.name}</Heading>
                                    <Spacer />
                                    <ButtonGroup size='sm'>
                                        <Button colorScheme='red' onClick={() => handleDeleteProperty(property.id)}>Delete</Button>
                                    </ButtonGroup>
                                </Flex>


                            </CardHeader>
                            <CardBody>
                                <Stack divider={<Divider />} spacing='4'>
                                    <Box>
                                        <Heading size="xs" textTransform="uppercase">
                                            Purchase Price
                                        </Heading>
                                        <Text pt='2' fontSize='sm'>
                                            ${property.purchasePrice.toLocaleString()}
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Heading size="xs" textTransform="uppercase">
                                            Monthly Rent
                                        </Heading>
                                        <Text pt='2' fontSize='sm'>
                                            ${property.rent.toLocaleString()}
                                        </Text>
                                    </Box>
                                </Stack>
                            </CardBody>
                        </Card>
                    ))}
                </VStack>
            )}

            {/* Totals Section */}
            <Divider mt={4} mb={4} />
            <Box mt={4}>
                <Heading size="md" mb={2}>
                    Empire Totals
                </Heading>
                <HStack spacing={8}>
                    <Box>
                        <Text fontWeight="bold">Total Property Value:</Text>
                        <Text>${totalValue.toLocaleString()}</Text>
                    </Box>
                    <Box>
                        <Text fontWeight="bold">Total Monthly Rent:</Text>
                        <Text>${totalRent.toLocaleString()}</Text>
                    </Box>
                </HStack>
            </Box>
        </Box>
    );
};

export default RealEstateEmpire;
```