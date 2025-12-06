
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface DocumentUploaderProps {
    documentableType: string; // e.g., 'payment_order', 'transaction'
    documentableId: string;
    onUploadSuccess?: (documentId: string) => void; // Callback on successful upload
    onError?: (errorMessage: string) => void; // Callback for handling errors
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ documentableType, documentableId, onUploadSuccess, onError }) => {
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setIsUploading(true);

        const file = acceptedFiles[0];
        const formData = new FormData();
        formData.append('file', file); // Assuming API expects 'file' field

        try {
            const response = await fetch(`/api/${documentableType}/${documentableId}/documents`, { // Adjust API endpoint as needed
                method: 'POST',
                body: formData,
                // Include authentication headers if required by your API
                headers: {
                    //'Content-Type': 'multipart/form-data', // Let browser handle Content-Type
                    //'Authorization': 'Bearer YOUR_API_TOKEN'
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (onUploadSuccess) {
                    onUploadSuccess(data.id); // Assuming the API response includes the document ID
                }
            } else {
                const errorData = await response.json(); //attempt to read JSON error
                const errorMessage = errorData?.errors?.message || `Upload failed with status: ${response.status}`;
                if (onError) {
                    onError(errorMessage);
                } else {
                    console.error('Upload failed:', errorMessage); //Fallback console log
                }
            }
        } catch (error: any) {
            const message = error.message || 'An unexpected error occurred during upload.';
             if (onError) {
                 onError(message);
             } else {
                console.error('Upload error:', message); //Fallback console log
             }
        } finally {
            setIsUploading(false);
        }

    }, [documentableType, documentableId, onUploadSuccess, onError]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

    return (
        <div {...getRootProps()} style={{
            border: '2px dashed #cccccc',
            borderRadius: '4px',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            opacity: isUploading ? 0.5 : 1,
            pointerEvents: isUploading ? 'none' : 'auto'
        }}>
            <input {...getInputProps()} />
            {isDragActive ? (
                <p>Drop the file here ...</p>
            ) : (
                <p>Drag 'n' drop a file here, or click to select file</p>
            )}
            {isUploading && <p>Uploading...</p>}
        </div>
    );
};

export default DocumentUploader;
