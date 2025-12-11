```tsx
import React, { useState, useRef } from 'react';
import { Box, Typography, Button, TextField, CircularProgress, Alert, Snackbar } from '@mui/material';
import axios from 'axios';

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
```