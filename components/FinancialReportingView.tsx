import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

const FinancialReportingView = () => {
  return (
    <Box p={8} maxWidth="800px" mx="auto">
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        Unlocking Your Business's Financial Story: 3 Surprising Insights from Your Dashboard
      </Heading>

      <Text fontSize="lg" mb={6}>
        Ever felt a slight dread when it's time to dive into financial reports? You're not alone. For many, financial data can feel like a dense jungle of numbers, intimidating and hard to navigate. But what if your financial dashboard wasn't just a collection of figures, but a powerful storyteller, revealing profound truths about your business you might otherwise miss? Let's peel back the layers of a typical financial reporting view and uncover some truly impactful takeaways.
      </Text>

      {/* Takeaway 1 */}
      <Box mb={8}>
        <Heading as="h2" size="lg" mb={3}>
          <Text as="span" fontWeight="bold">1. The Symphony of Data: Why a Unified View is Non-Negotiable</Text>
        </Heading>
        <Text mb={3}>
          Imagine trying to understand a complex symphony by listening to each instrument separately. You'd miss the harmony, the interplay, the grand narrative. Financial data is much the same. Our dashboard, by design, brings together disparate reports – from cash flow to balance sheets – into one cohesive view. This isn't just about convenience; it's about enabling holistic understanding.
        </Text>
        <Text mb={3}>
          When you see your income statement alongside your cash flow, for instance, you can quickly spot discrepancies or confirm trends that isolated reports might obscure. This integrated perspective is crucial for making informed, strategic decisions rather than reactive ones.
        </Text>
        <Box p={4} bg="gray.50" borderLeft="4px solid" borderColor="blue.300" fontStyle="italic" mb={3}>
          <Text>
            "The true power of financial reporting isn't just in the data, but in its accessibility and synthesis – a single pane of glass revealing the whole picture."
          </Text>
        </Box>
      </Box>

      {/* Takeaway 2 */}
      <Box mb={8}>
        <Heading as="h2" size="lg" mb={3}>
          <Text as="span" fontWeight="bold">2. Beyond the Buzzwords: The Enduring Power of Core Financial Statements</Text>
        </Heading>
        <Text mb={3}>
          Our dashboard explicitly highlights key reports: Overview, Cash Flow, Balance Sheet, Income Statement, and AR/AP Summary. These aren't arbitrary choices; they are the foundational pillars of financial health analysis. While new metrics and KPIs emerge constantly, these core statements remain the bedrock for a reason.
        </Text>
        <Text mb={3}>
          The <Text as="span" fontWeight="semibold">Cash Flow Chart</Text> tells you if you have enough liquid assets to operate. The <Text as="span" fontWeight="semibold">Balance Sheet</Text> offers a snapshot of your assets, liabilities, and equity at a specific point. The <Text as="span" fontWeight="semibold">Income Statement</Text> (or P&L) reveals your profitability over a period. And the <Text as="span" fontWeight="semibold">AR/AP Summary</Text> gives insight into your working capital and operational efficiency. Understanding each of these, and how they interrelate, is non-negotiable for any business leader.
        </Text>
        <Box p={4} bg="gray.50" borderLeft="4px solid" borderColor="blue.300" fontStyle="italic" mb={3}>
          <Text>
            "These aren't just accounting terms; they are the vital signs of your business, each telling a crucial part of its ongoing health saga."
          </Text>
        </Box>
      </Box>

      {/* Takeaway 3 */}
      <Box mb={8}>
        <Heading as="h2" size="lg" mb={3}>
          <Text as="span" fontWeight="bold">3. The Iceberg Effect: What Lies Beneath a 'Simple' Dashboard</Text>
        </Heading>
        <Text mb={3}>
          Take a closer look at the original code comments: "Replace with actual report components." This seemingly simple directive hides a profound truth: a truly effective financial dashboard is an iceberg. What you see on the surface – the clean charts and clear figures – is just a fraction of the effort involved.
        </Text>
        <Text mb={3}>
          Beneath that elegant UI lies complex data integration from various sources, meticulous calculation logic, robust error handling, and careful design choices to ensure accuracy and relevance. The ease of consumption for the end-user is a testament to the sophisticated engineering and thoughtful architecture that powers it. It reminds us that simplicity in presentation often requires immense complexity in implementation.
        </Text>
        <Box p={4} bg="gray.50" borderLeft="4px solid" borderColor="blue.300" fontStyle="italic" mb={3}>
          <Text>
            "A truly effective financial dashboard is a masterpiece of engineering, where simplicity on the surface belies a robust, intelligent architecture beneath."
          </Text>
        </Box>
      </Box>

      {/* Conclusion */}
      <Box mt={8} pt={4} borderTop="1px solid" borderColor="gray.200">
        <Text fontSize="lg" mb={4}>
          A well-designed financial reporting dashboard is far more than just a collection of numbers; it's a strategic asset, a powerful storyteller, and a window into the very soul of your business. By understanding these underlying principles – the need for synthesis, the enduring relevance of core statements, and the hidden complexity behind simplicity – you can leverage your financial tools not just to track, but to truly understand and propel your business forward.
        </Text>
        <Text fontSize="lg" fontWeight="bold">
          What surprising insights has your financial dashboard revealed to you lately?
        </Text>
      </Box>
    </Box>
  );
};

export default FinancialReportingView;