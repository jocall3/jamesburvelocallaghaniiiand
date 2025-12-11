export const SYSTEM_ROLE_FINANCIAL_ASSISTANT = `You are an expert financial assistant AI designed to interpret banking data for Citi customers. 
Your goal is to transform raw JSON responses from financial APIs into clear, human-readable insights.
Rules:
1. Tone: Professional, helpful, and secure.
2. Security: Never output full unmasked Account IDs or raw Access Tokens. Refer to accounts by their 'productName' and the last 4 digits of 'accountNumberDisplay'.
3. Context: You are analyzing data related to Customer Profiles, Account Products, and Reward Linkages.
4. Output Format: Provide concise bullet points or natural language summaries. Do not output raw JSON blocks unless specifically asked for debugging.`;

export const generateProductPortfolioPrompt = (productsData: string): string => {
  return `
Context: The user has retrieved their list of active bank products.
Data: ${productsData}

Task:
1. Analyze the 'products' array.
2. Group the accounts by 'accountType' (e.g., CREDIT_CARD, CHECKING, SAVINGS).
3. List each active product using its 'productName' and masked number.
4. If the status is not 'ACTIVE', flag it.
5. Provide a one-sentence summary of their financial portfolio composition (e.g., "You have 2 credit cards and 1 savings account with us.").
`;
};

export const generateCustomerProfileSummaryPrompt = (profileData: string): string => {
  return `
Context: The user is viewing their personal profile details.
Data: ${profileData}

Task:
1. Identify the user by 'fullName'.
2. extract the PRIMARY email address and PRIMARY phone number.
3. Summarize the mailing address (City, State, Country) without reading out the full street lines unless necessary for verification.
4. Check if there are any discrepancies, such as missing primary contact methods.
`;
};

export const generateRewardLinkageResultPrompt = (linkageResponse: string): string => {
  return `
Context: The user attempted to link their credit card to a merchant for "Shop with Points".
Data: ${linkageResponse}

Task:
1. Determine if the linkage was successful.
2. If successful, extract the 'rewardLinkCode' and explain that this code maps the specific credit card to the merchant.
3. If the input contains an error object (like 'invalidCardType' or 'registrationFailed'), explain the error in plain English and suggest the user check their card eligibility or input details.
`;
};

export const generateAuthErrorExplanationPrompt = (errorResponse: string): string => {
  return `
Context: An authorization or authentication request failed.
Data: ${errorResponse}

Task:
1. Analyze the 'error', 'error_description', and 'code'.
2. Explain why the request failed (e.g., "Token Expired", "Invalid Client ID", "Insufficient Permissions").
3. Suggest the immediate next step for the developer or user (e.g., "Refresh your access token using the /oauth2/refresh endpoint" or "Check your client_id configuration").
`;
};

export const generateCompositeFinancialOverviewPrompt = (
  profileJson: string, 
  productsJson: string
): string => {
  return `
Context: Generating a dashboard overview for a logged-in user.
Profile Data: ${profileJson}
Products Data: ${productsJson}

Task:
1. Greet the user by their 'firstName'.
2. Provide a high-level summary of their active accounts (from Products Data).
3. Mention which email address notifications regarding these accounts will be sent to (from Profile Data).
4. Do not list specific account balances (as that data is not provided here), but confirm that the account list is retrieved successfully.
`;
};