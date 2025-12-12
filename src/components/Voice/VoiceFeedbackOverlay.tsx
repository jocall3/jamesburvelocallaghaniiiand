import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Unified Configuration Layer
const config = {
    brandName: 'Citibankdemobusinessinc',
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    accentColor: '#28a745',
    fontSizeBase: '1rem',
    borderRadiusBase: '0.5rem',
    defaultLocale: 'en-US',
    apiBaseUrl: '/api',
    environment: process.env.NODE_ENV || 'development',
};

// Shared Identity Layer
const generateUserId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
const currentUserId = generateUserId();

// Internal Event Bus
class EventBus {
    private listeners: { [key: string]: Function[] } = {};

    subscribe(event: string, callback: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    unsubscribe(event: string, callback: Function) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    publish(event: string, data?: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

const eventBus = new EventBus();

// Utility Functions
const generateRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateRandomString = (length: number) => Math.random().toString(36).substring(2, 2 + length);

// Common Security Primitives
const encryptData = (data: string) => btoa(data);
const decryptData = (encryptedData: string) => atob(encryptedData);

// --- Citibankdemobusinessinc.voice ---
namespace Citibankdemobusinessinc.voice {
    // Mission: To revolutionize voice-activated banking and financial services, making them universally accessible and secure.
    // Monetization: Premium voice-activated financial advisory services, transaction fees, and data analytics.
    // IP Moat: Proprietary voice recognition and AI algorithms tailored for financial contexts.

    // Data Generator
    const generateVoiceCommand = () => {
        const commands = ['check balance', 'transfer funds', 'pay bill', 'investment advice'];
        return commands[generateRandomNumber(0, commands.length - 1)];
    };

    // Regulatory Alignment
    const checkVoiceCommandCompliance = (command: string) => {
        // Simulate regulatory checks
        return command.includes('transfer') ? { isCompliant: false, reason: 'Transfer commands require additional verification.' } : { isCompliant: true, reason: null };
    };

    // Risk Detection
    const detectVoiceCommandRisk = (command: string) => {
        // Simulate risk detection
        return command.includes('investment advice') ? { riskLevel: 'high', description: 'Investment advice carries inherent market risks.' } : { riskLevel: 'low', description: 'No significant risk detected.' };
    };

    // Voice Feedback Overlay Component
    export interface VoiceFeedbackOverlayProps {
        isOpen: boolean;
        isListening: boolean;
        transcript: string;
        volume?: number;
        onClose: () => void;
        onStop: () => void;
    }

    const VisualizerCircle: React.FC<{ isListening: boolean; volume: number }> = ({ isListening, volume }) => {
        const scale = isListening ? 1 + (Math.min(Math.max(volume, 0), 100) / 150) : 1;

        return (
            <div style={{
                ...styles.micCircle,
                backgroundColor: isListening ? '#ef4444' : '#9ca3af',
                transform: `scale(${scale})`,
                animation: isListening ? 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite' : 'none',
                boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.5)' : 'none'
            }}>
                <svg
                    viewBox="0 0 24 24"
                    width="32"
                    height="32"
                    fill="white"
                    style={{ display: 'block' }}
                >
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
            </div>
        );
    };

    const styles: Record<string, React.CSSProperties> = {
        overlayContainer: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        },
        backdrop: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
        },
        contentCard: {
            position: 'relative',
            width: '90%',
            maxWidth: '400px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10001,
            transition: 'transform 0.3s ease-out',
        },
        header: {
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
        },
        title: {
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
        },
        closeIconBtn: {
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            lineHeight: 1,
            cursor: 'pointer',
            color: '#9ca3af',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        visualizerArea: {
            height: '120px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
        },
        micCircle: {
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.1s ease-out, background-color 0.3s ease',
        },
        statusText: {
            fontSize: '1rem',
            color: '#4b5563',
            marginBottom: '16px',
            fontWeight: 500,
        },
        transcriptBox: {
            width: '100%',
            minHeight: '80px',
            maxHeight: '150px',
            overflowY: 'auto',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            boxSizing: 'border-box',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        transcriptText: {
            margin: 0,
            color: '#1f2937',
            fontSize: '1.1rem',
            lineHeight: 1.5,
            wordBreak: 'break-word',
        },
        footer: {
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
        },
        stopBtn: {
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '12px 32px',
            borderRadius: '9999px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)',
            transition: 'background-color 0.2s',
        },
        closeBtn: {
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 32px',
            borderRadius: '9999px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
            transition: 'background-color 0.2s',
        }
    };

    export const VoiceFeedbackOverlay: React.FC<VoiceFeedbackOverlayProps> = ({
        isOpen,
        isListening,
        transcript,
        volume = 0,
        onClose,
        onStop,
    }) => {
        const [mounted, setMounted] = useState(false);

        useEffect(() => {
            setMounted(true);
            return () => setMounted(false);
        }, []);

        if (!isOpen || !mounted) return null;

        const content = (
            <div style={styles.overlayContainer}>
                <div style={styles.backdrop} onClick={onClose} aria-hidden="true" />
                <div style={styles.contentCard} role="dialog" aria-modal="true" aria-labelledby="voice-overlay-title">
                    <div style={styles.header}>
                        <h3 id="voice-overlay-title" style={styles.title}>Voice Command</h3>
                        <button
                            style={styles.closeIconBtn}
                            onClick={onClose}
                            aria-label="Close overlay"
                        >
                            &times;
                        </button>
                    </div>

                    <div style={styles.visualizerArea}>
                        <VisualizerCircle isListening={isListening} volume={volume} />
                    </div>

                    <div style={styles.statusText}>
                        {isListening ? 'Listening...' : 'Processing...'}
                    </div>

                    <div style={styles.transcriptBox}>
                        <p style={styles.transcriptText}>
                            {transcript || 'Say something...'}
                        </p>
                    </div>

                    <div style={styles.footer}>
                        {isListening ? (
                            <button style={styles.stopBtn} onClick={onStop}>
                                Stop Listening
                            </button>
                        ) : (
                            <button style={styles.closeBtn} onClick={onClose}>
                                Done
                            </button>
                        )}
                    </div>
                </div>
                <style>{`
                    @keyframes pulse-ring {
                        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                        70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
                        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                    }
                `}</style>
            </div>
        );

        return createPortal(content, document.body);
    };

    // Example Usage (Integration with other branches)
    eventBus.subscribe('transactionInitiated', (transactionDetails: any) => {
        console.log(`Voice: Transaction initiated for user ${currentUserId} with details:`, transactionDetails);
    });
}

export default Citibankdemobusinessinc.voice.VoiceFeedbackOverlay;