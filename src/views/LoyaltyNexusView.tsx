import React, { useState, useEffect, useCallback } from 'react';

// --- Types based on OpenAPI Specifications ---

interface Product {
    accountId: string;
    status: 'ACTIVE';
    productName: string;
    accountType: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD';
    accountNumberDisplay: string;
}

interface ProductsResponse {
    customerId: string;
    products: Product[];
}

interface LinkageRequest {
    lastFourDigitsCardNumber: string;
    citiCardHolderPhoneNumber: string;
    merchantCustomerReferenceId: string;
}

interface LinkageResponse {
    rewardLinkCode: string;
}

interface ApiError {
    type: string;
    code: string;
    details: string;
    message?: string;
}

// --- Constants & Configuration ---
// In a real app, these would come from environment variables or auth context
const API_BASE_URL_PRODUCTS = '/api/productDirectory/v1';
const API_BASE_URL_REWARDS = '/api/rewards/shopWithPoints';
const CLIENT_ID = 'your-client-id'; // Mock
const ACCESS_TOKEN = 'mock-access-token'; // Mock

// --- Components ---

export default function LoyaltyNexusView() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [linkageForm, setLinkageForm] = useState<LinkageRequest>({
        lastFourDigitsCardNumber: '',
        citiCardHolderPhoneNumber: '',
        merchantCustomerReferenceId: ''
    });
    const [isLinking, setIsLinking] = useState<boolean>(false);
    const [linkageResult, setLinkageResult] = useState<LinkageResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // --- API Interactions ---

    const fetchProducts = useCallback(async () => {
        setIsLoadingProducts(true);
        setError(null);
        try {
            // Mapping to OpenAPI: Products_Partner_View GET /products
            const response = await fetch(`${API_BASE_URL_PRODUCTS}/products`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'client_id': CLIENT_ID,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch products: ${response.statusText}`);
            }

            const data: ProductsResponse = await response.json();
            // Filter only Credit Cards for loyalty linkage usually
            const creditCards = data.products.filter(p => p.accountType === 'CREDIT_CARD');
            setProducts(creditCards);
        } catch (err: any) {
            setError(err.message || 'An error occurred fetching products');
            // Fallback mock data for demonstration purposes if API fails
            setProducts([
                {
                    accountId: '8035a60debb671e89bd451c9ad0f283e8f1b8868dd4dc65520ceb7bdfeb4142999f574c9db37917ef0edfae296745142543e3ad2bc034887f37212ecbde83ee0',
                    status: 'ACTIVE',
                    productName: 'Citi Rewards+℠ Card',
                    accountType: 'CREDIT_CARD',
                    accountNumberDisplay: 'XXXXXXXXXXXX7899'
                }
            ]);
        } finally {
            setIsLoadingProducts(false);
        }
    }, []);

    const handleLinkageSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLinking(true);
        setLinkageResult(null);
        setError(null);

        try {
            // Generate a random UUID for the header requirement
            const uuid = crypto.randomUUID();

            // Mapping to OpenAPI: RewardLinkageShopWithPoints_OpenAPI POST /linkage
            const response = await fetch(`${API_BASE_URL_REWARDS}/linkage`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'uuid': uuid,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'client_id': CLIENT_ID,
                    // 'clientDetails': '...' // Optional
                },
                body: JSON.stringify(linkageForm)
            });

            if (!response.ok) {
                const errData: ApiError = await response.json();
                throw new Error(errData.details || 'Linkage failed');
            }

            const data: LinkageResponse = await response.json();
            setLinkageResult(data);
        } catch (err: any) {
            setError(err.message || 'Failed to link card for Shop with Points');
        } finally {
            setIsLinking(false);
        }
    };

    // --- Effects ---

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        // Auto-fill last 4 digits if a product is selected
        if (selectedProduct) {
            const last4 = selectedProduct.accountNumberDisplay.slice(-4);
            setLinkageForm(prev => ({ ...prev, lastFourDigitsCardNumber: last4 }));
        }
    }, [selectedProduct]);

    // --- Render Helpers ---

    const handleInputChange = (field: keyof LinkageRequest, value: string) => {
        setLinkageForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-blue-900">Loyalty Nexus</h1>
                <p className="text-gray-600">Manage your rewards, points, and redemption partners.</p>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Section 1: Product Selection / Portfolio */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Your Credit Cards</h2>
                    
                    {isLoadingProducts ? (
                        <div className="flex justify-center py-8">
                            <span className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {products.length === 0 ? (
                                <p className="text-gray-500 italic">No active credit cards found.</p>
                            ) : (
                                products.map((prod) => (
                                    <div 
                                        key={prod.accountId}
                                        onClick={() => setSelectedProduct(prod)}
                                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                            selectedProduct?.accountId === prod.accountId 
                                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                                                : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900">{prod.productName}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{prod.accountNumberDisplay}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                prod.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {prod.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Section 2: Shop with Points Linkage */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Enrollment Card */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-2">Shop with Points Enrollment</h2>
                        <p className="text-sm text-gray-500 mb-6">Link your eligible Citi credit card to participate in the merchant's reward program.</p>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                                <p className="font-bold">Error</p>
                                <p>{error}</p>
                            </div>
                        )}

                        {linkageResult ? (
                            <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                                <div className="text-green-600 text-5xl mb-2">✓</div>
                                <h3 className="text-lg font-bold text-green-800">Enrollment Successful!</h3>
                                <p className="text-green-700 mt-2">Your Reward Link Code is:</p>
                                <p className="text-2xl font-mono font-bold text-gray-800 mt-2 tracking-widest select-all bg-white inline-block px-4 py-1 border rounded">{linkageResult.rewardLinkCode}</p>
                                <button 
                                    onClick={() => setLinkageResult(null)}
                                    className="block mx-auto mt-6 text-sm text-blue-600 underline hover:text-blue-800"
                                >
                                    Link another card
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleLinkageSubmit} className="space-y-6 max-w-lg">
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label htmlFor="cardLast4" className="block text-sm font-medium text-gray-700">Card Last 4 Digits</label>
                                        <input
                                            type="text"
                                            id="cardLast4"
                                            required
                                            maxLength={4}
                                            pattern="\d{4}"
                                            value={linkageForm.lastFourDigitsCardNumber}
                                            onChange={(e) => handleInputChange('lastFourDigitsCardNumber', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                            placeholder="e.g. 5212"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Select a card from the left to auto-fill.</p>
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Registered Mobile Number</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            required
                                            value={linkageForm.citiCardHolderPhoneNumber}
                                            onChange={(e) => handleInputChange('citiCardHolderPhoneNumber', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                            placeholder="Country Code + Number (e.g. 6563471895)"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="merchantRef" className="block text-sm font-medium text-gray-700">Merchant Customer Reference ID</label>
                                        <input
                                            type="text"
                                            id="merchantRef"
                                            required
                                            value={linkageForm.merchantCustomerReferenceId}
                                            onChange={(e) => handleInputChange('merchantCustomerReferenceId', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                            placeholder="e.g. P125121001"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isLinking}
                                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                            isLinking ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                        }`}
                                    >
                                        {isLinking ? 'Processing...' : 'Link Card for Rewards'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Placeholder for Points Balance / Redemption History */}
                    <div className="bg-white rounded-xl shadow-md p-6 opacity-75">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Points Balance</h2>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">Coming Soon</span>
                        </div>
                        <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                            <p className="text-gray-400">Select a linked card to view available points</p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}