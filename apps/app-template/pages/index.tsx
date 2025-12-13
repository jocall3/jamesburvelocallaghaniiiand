import React from 'react';
import { useRouter } from 'next/router';
import { Button, Heading, Text, Box, Stack, Image } from '@chakra-ui/react';

interface AppProps {
  appName: string;
  appDescription: string;
  appImage?: string; // Optional image URL
  subscriptionDetails: {
    planName: string;
    price: string;
    features: string[];
  }[];
}

const AppLandingPage: React.FC<AppProps> = ({ appName, appDescription, appImage, subscriptionDetails }) => {
  const router = useRouter();

  const handleSubscribe = (planName: string) => {
    // Implement subscription logic here.  This is a placeholder.
    // In a real application, you'd redirect to a payment gateway or handle the subscription process.
    alert(`Subscribing to ${appName} - ${planName}`);
    // Example: router.push(`/subscribe?app=${appName}&plan=${planName}`);
  };

  return (
    <Box p={4} maxWidth="800px" mx="auto">
      <Stack spacing={6}>
        <Box textAlign="center">
          {appImage && <Image src={appImage} alt={appName} borderRadius="md" mx="auto" mb={4} />}
          <Heading as="h1" size="xl">{appName}</Heading>
          <Text fontSize="lg" color="gray.600">{appDescription}</Text>
        </Box>

        {subscriptionDetails.map((plan, index) => (
          <Box key={index} borderWidth="1px" borderColor="gray.200" borderRadius="md" p={4}>
            <Heading as="h2" size="md" mb={2}>{plan.planName}</Heading>
            <Text fontSize="lg" fontWeight="bold" mb={2}>{plan.price} / month</Text>
            <Stack spacing={2} mb={4}>
              {plan.features.map((feature, featureIndex) => (
                <Text key={featureIndex} fontSize="md" color="gray.700">
                  - {feature}
                </Text>
              ))}
            </Stack>
            <Button colorScheme="blue" onClick={() => handleSubscribe(plan.planName)}>
              Subscribe Now
            </Button>
          </Box>
        ))}

        <Text textAlign="center" fontSize="sm" color="gray.500">
          By subscribing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </Stack>
    </Box>
  );
};

export default AppLandingPage;