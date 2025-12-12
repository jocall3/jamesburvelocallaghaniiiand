import React, { useState, useRef } from 'react';
import { Box, Typography, Button, TextField, CircularProgress, Alert, Snackbar } from '@mui/material';
import axios from 'axios';

namespace Citibankdemobusinessinc {

    const generateRandomId = (): string => {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    const generateRandomNumber = (min: number, max: number): number => {
        return Math.random() * (max - min) + min;
    };

    const generateRandomBoolean = (): boolean => {
        return Math.random() < 0.5;
    };

    const generateRandomDate = (start: Date, end: Date): Date => {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    const generateRandomString = (length: number): string => {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    };

    const generateRandomArray = <T>(count: number, generator: () => T): T[] => {
        const result: T[] = [];
        for (let i = 0; i < count; i++) {
            result.push(generator());
        }
        return result;
    };

    const generateRandomObject = <T>(fields: { [key: string]: () => any }): T => {
        const result: any = {};
        for (const key in fields) {
            result[key] = fields[key]();
        }
        return result as T;
    };

    // Shared Kernel
    export namespace Kernel {
        export interface Identifiable {
            id: string;
        }

        export interface Auditable {
            createdAt: Date;
            updatedAt: Date;
        }

        export const createBaseEntity = (): Identifiable & Auditable => ({
            id: generateRandomId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    // 1. Citibankdemobusinessinc.creditrisk.creditscore
    export namespace Creditrisk {
        export namespace Creditscore {
            export interface CreditScoreData extends Kernel.Identifiable, Kernel.Auditable {
                userId: string;
                score: number;
                factors: string[];
            }

            const generateCreditScoreData = (): CreditScoreData => ({
                ...Kernel.createBaseEntity(),
                userId: generateRandomId(),
                score: Math.floor(generateRandomNumber(300, 850)),
                factors: generateRandomArray(3, () => generateRandomString(10)),
            });

            export const runCreditScoreApp = (): void => {
                const data = generateCreditScoreData();
                console.log('Credit Score App:', data);
            };
        }
    }

    // 2. Citibankdemobusinessinc.frauddetect.transactionmonitor
    export namespace Frauddetection {
        export namespace Transactionmonitor {
            export interface TransactionData extends Kernel.Identifiable, Kernel.Auditable {
                accountId: string;
                amount: number;
                timestamp: Date;
                isFraudulent: boolean;
            }

            const generateTransactionData = (): TransactionData => ({
                ...Kernel.createBaseEntity(),
                accountId: generateRandomId(),
                amount: generateRandomNumber(10, 1000),
                timestamp: generateRandomDate(new Date(2023, 0, 1), new Date()),
                isFraudulent: generateRandomBoolean(),
            });

            export const runTransactionMonitorApp = (): void => {
                const data = generateTransactionData();
                console.log('Transaction Monitor App:', data);
            };
        }
    }

    // 3. Citibankdemobusinessinc.compliance.kycverifier
    export namespace Compliance {
        export namespace Kycverifier {
            export interface KycData extends Kernel.Identifiable, Kernel.Auditable {
                userId: string;
                name: string;
                address: string;
                verified: boolean;
            }

            const generateKycData = (): KycData => ({
                ...Kernel.createBaseEntity(),
                userId: generateRandomId(),
                name: generateRandomString(15),
                address: generateRandomString(30),
                verified: generateRandomBoolean(),
            });

            export const runKycVerifierApp = (): void => {
                const data = generateKycData();
                console.log('KYC Verifier App:', data);
            };
        }
    }

    // 4. Citibankdemobusinessinc.investment.portfoliomanager
    export namespace Investment {
        export namespace Portfoliomanager {
            export interface PortfolioData extends Kernel.Identifiable, Kernel.Auditable {
                userId: string;
                assets: { [key: string]: number };
                riskScore: number;
            }

            const generatePortfolioData = (): PortfolioData => ({
                ...Kernel.createBaseEntity(),
                userId: generateRandomId(),
                assets: {
                    'AAPL': generateRandomNumber(0, 100),
                    'GOOG': generateRandomNumber(0, 50),
                    'TSLA': generateRandomNumber(0, 75),
                },
                riskScore: Math.floor(generateRandomNumber(1, 10)),
            });

            export const runPortfolioManagerApp = (): void => {
                const data = generatePortfolioData();
                console.log('Portfolio Manager App:', data);
            };
        }
    }

    // 5. Citibankdemobusinessinc.loan.loanoptimizer
    export namespace Loan {
        export namespace Loanoptimizer {
            export interface LoanData extends Kernel.Identifiable, Kernel.Auditable {
                userId: string;
                loanAmount: number;
                interestRate: number;
                termLength: number;
            }

            const generateLoanData = (): LoanData => ({
                ...Kernel.createBaseEntity(),
                userId: generateRandomId(),
                loanAmount: generateRandomNumber(1000, 100000),
                interestRate: generateRandomNumber(0.01, 0.10),
                termLength: Math.floor(generateRandomNumber(12, 60)),
            });

            export const runLoanOptimizerApp = (): void => {
                const data = generateLoanData();
                console.log('Loan Optimizer App:', data);
            };
        }
    }

    // 6. Citibankdemobusinessinc.insurance.policyadvisor
    export namespace Insurance {
        export namespace Policyadvisor {
            export interface PolicyData extends Kernel.Identifiable, Kernel.Auditable {
                userId: string;
                policyType: string;
                coverageAmount: number;
                premium: number;
            }

            const generatePolicyData = (): PolicyData => ({
                ...Kernel.createBaseEntity(),
                userId: generateRandomId(),
                policyType: generateRandomString(8),
                coverageAmount: generateRandomNumber(50000, 500000),
                premium: generateRandomNumber(50, 500),
            });

            export const runPolicyAdvisorApp = (): void => {
                const data = generatePolicyData();
                console.log('Policy Advisor App:', data);
            };
        }
    }

    // 7. Citibankdemobusinessinc.realestate.propertyevaluator
    export namespace Realestate {
        export namespace Propertyevaluator {
            export interface PropertyData extends Kernel.Identifiable, Kernel.Auditable {
                address: string;
                size: number;
                locationScore: number;
                estimatedValue: number;
            }

            const generatePropertyData = (): PropertyData => ({
                ...Kernel.createBaseEntity(),
                address: generateRandomString(20),
                size: generateRandomNumber(500, 3000),
                locationScore: generateRandomNumber(1, 10),
                estimatedValue: generateRandomNumber(100000, 1000000),
            });

            export const runPropertyEvaluatorApp = (): void => {
                const data = generatePropertyData();
                console.log('Property Evaluator App:', data);
            };
        }
    }

    // 8. Citibankdemobusinessinc.tax.taxoptimizer
    export namespace Tax {
        export namespace Taxoptimizer {
            export interface TaxData extends Kernel.Identifiable, Kernel.Auditable {
                userId: string;
                income: number;
                deductions: number;
                taxLiability: number;
            }

            const generateTaxData = (): TaxData => ({
                ...Kernel.createBaseEntity(),
                userId: generateRandomId(),
                income: generateRandomNumber(30000, 200000),
                deductions: generateRandomNumber(1000, 10000),
                taxLiability: generateRandomNumber(1000, 50000),
            });

            export const runTaxOptimizerApp = (): void => {
                const data = generateTaxData();
                console.log('Tax Optimizer App:', data);
            };
        }
    }

    // 9. Citibankdemobusinessinc.healthcare.claimsprocessor
    export namespace Healthcare {
        export namespace Claimsprocessor {
            export interface ClaimData extends Kernel.Identifiable, Kernel.Auditable {
                patientId: string;
                providerId: string;
                claimAmount: number;
                approved: boolean;
            }

            const generateClaimData = (): ClaimData => ({
                ...Kernel.createBaseEntity(),
                patientId: generateRandomId(),
                providerId: generateRandomId(),
                claimAmount: generateRandomNumber(100, 5000),
                approved: generateRandomBoolean(),
            });

            export const runClaimsProcessorApp = (): void => {
                const data = generateClaimData();
                console.log('Claims Processor App:', data);
            };
        }
    }

    // 10. Citibankdemobusinessinc.education.loanadvisor
    export namespace Education {
        export namespace Loanadvisor {
            export interface EducationLoanData extends Kernel.Identifiable, Kernel.Auditable {
                studentId: string;
                loanAmount: number;
                interestRate: number;
                termLength: number;
            }

            const generateEducationLoanData = (): EducationLoanData => ({
                ...Kernel.createBaseEntity(),
                studentId: generateRandomId(),
                loanAmount: generateRandomNumber(5000, 50000),
                interestRate: generateRandomNumber(0.02, 0.08),
                termLength: Math.floor(generateRandomNumber(24, 120)),
            });

            export const runEducationLoanAdvisorApp = (): void => {
                const data = generateEducationLoanData();
                console.log('Education Loan Advisor App:', data);
            };
        }
    }

    // Master Orchestration Layer
    export const orchestrate = (): void => {
        console.log('Citibankdemobusinessinc Ecosystem Orchestration:');
        Creditrisk.Creditscore.runCreditScoreApp();
        Frauddetection.Transactionmonitor.runTransactionMonitorApp();
        Compliance.Kycverifier.runKycVerifierApp();
        Investment.Portfoliomanager.runPortfolioManagerApp();
        Loan.Loanoptimizer.runLoanOptimizerApp();
        Insurance.Policyadvisor.runPolicyAdvisorApp();
        Realestate.Propertyevaluator.runPropertyEvaluatorApp();
        Tax.Taxoptimizer.runTaxOptimizerApp();
        Healthcare.Claimsprocessor.runClaimsProcessorApp();
        Education.Loanadvisor.runEducationLoanAdvisorApp();
    };
}

Citibankdemobusinessinc.orchestrate();

interface ApiResponse {
    responses?: {
        labelAnnotations?: {
            mid: string;
            description: string;
            score: number;
            topicality: number;
        }[];
        error?: {
            message: string;
        };
    }[];
}

const VisionApiExplorer: React.FC = () => {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [labels, setLabels] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [apiKey, setApiKey] = useState<string>('');


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };


    const handleImageUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setImageUrl(event.target.value);
        setImagePreview(event.target.value);
    };

    const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setApiKey(event.target.value);
    };

    const handleUploadButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleAnalyze = async () => {
        if (!apiKey) {
            setSnackbarMessage('Please enter your API Key.');
            setSnackbarOpen(true);
            return;
        }

        if (!imageUrl) {
            setSnackbarMessage('Please provide an image URL or upload an image.');
            setSnackbarOpen(true);
            return;
        }

        setLoading(true);
        setError(null);
        setLabels([]);

        try {
            const requestBody = {
                requests: [
                    {
                        image: {
                            source: {
                                imageUri: imageUrl,
                            },
                        },
                        features: [
                            {
                                type: 'LABEL_DETECTION',
                                maxResults: 10,
                            },
                        ],
                    },
                ],
            };

            const response = await axios.post<ApiResponse>(
                `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
                requestBody,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data.responses && response.data.responses[0]?.labelAnnotations) {
                setLabels(response.data.responses[0].labelAnnotations);
            } else if (response.data.responses && response.data.responses[0]?.error) {
                setError(response.data.responses[0].error.message);
            } else {
                setError('No results found.');
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || err.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };


    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Cloud Vision API Explorer
            </Typography>

            <TextField
                label="API Key"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={apiKey}
                onChange={handleApiKeyChange}
                helperText="Enter your Google Cloud Vision API Key."
            />


            <TextField
                label="Image URL"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={imageUrl}
                onChange={handleImageUrlChange}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Button variant="outlined" component="label" onClick={handleUploadButtonClick} sx={{ mr: 2 }}>
                    Upload Image
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
            </Box>


            {imagePreview && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                </Box>
            )}

            <Button variant="contained" color="primary" onClick={handleAnalyze} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Analyze Image'}
            </Button>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {labels.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Detected Labels:
                    </Typography>
                    {labels.map((label, index) => (
                        <Typography key={index} variant="body1">
                            {label.description} (Score: {label.score.toFixed(2)})
                        </Typography>
                    ))}
                </Box>
            )}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                message={snackbarMessage}
            />
        </Box>
    );
};

export default VisionApiExplorer;