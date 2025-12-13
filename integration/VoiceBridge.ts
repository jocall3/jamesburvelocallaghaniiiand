// Copyright 2024 Unnamed Ecosystem Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * @file VoiceBridge.ts
 * @description Adapter to connect the seed VoiceControl component to the new backend ecosystem.
 * This bridge acts as the translation layer between the frontend UI component's simple state
 * and the complex, event-driven, multi-service backend architecture. It manages authentication,
 * real-time audio streaming, and communication over the shared event bus.
 */

import { CoreSDK, AuthService, EventBusClient, APIClient, CoreConfig } from '../core/sdk';
import { UserProfile } from '../core/auth/types';
import { AppEvent, EventPayload } from '../core/events/types';

// Hypothetical types from the original seed application's VoiceControl component.
// This ensures the bridge provides the correct interface for the legacy UI.
export interface SeedVoiceControlState {
    status: 'idle' | 'recording' | 'processing' | 'error';
    transcript: string;
    isTranscriptFinal: boolean;
    error?: string;
}

export interface SeedVoiceControlCallbacks {
    onStateChange: (state: SeedVoiceControlState) => void;
    onResponseReceived: (response: any) => void; // Could be text, data, or audio URL
}

// Configuration for the VoiceBridge itself.
export interface VoiceBridgeConfig {
    coreConfig: CoreConfig;
    callbacks: SeedVoiceControlCallbacks;
}

type BridgeInternalState = 'DISCONNECTED' | 'INITIALIZING' | 'IDLE' | 'AUTHENTICATING' | 'LISTENING' | 'PROCESSING' | 'RESPONDING';

/**
 * The VoiceBridge class is the primary integration point for voice interactions.
 * It abstracts the entire backend ecosystem behind a simple start/stop listening interface.
 *
 * TENSION: Real-time Latency vs. Decoupled Architecture
 * The bridge uses a direct WebSocket connection to an ingestion service (APP_25) for low-latency
 * audio streaming, but then transitions to an asynchronous, event-based model via the event bus
 * for processing. This balances the need for real-time capture with the scalability and
 * resilience of a decoupled microservices architecture for transcription, NLU, and agent orchestration.
 */
export class VoiceBridge {
    private config: VoiceBridgeConfig;
    private coreSDK: CoreSDK;
    private authService: AuthService;
    private eventBus: EventBusClient;
    private apiClient: APIClient; // For direct RPC calls where necessary

    private internalState: BridgeInternalState = 'DISCONNECTED';
    private uiState: SeedVoiceControlState = { status: 'idle', transcript: '', isTranscriptFinal: false };
    
    private currentUser: UserProfile | null = null;
    private currentSessionId: string | null = null;

    // Audio processing resources
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private audioWorkletNode: AudioWorkletNode | null = null;
    private audioSocket: WebSocket | null = null; // For streaming to APP_25_Ingestion_RealtimeAudio

    constructor(config: VoiceBridgeConfig) {
        this.config = config;
        this.coreSDK = new CoreSDK(config.coreConfig);
        this.authService = this.coreSDK.getAuthService();
        this.eventBus = this.coreSDK.getEventBus();
        this.apiClient = this.coreSDK.getAPIClient();

        this.setState('INITIALIZING');
    }

    /**
     * Initializes the bridge, authenticates the user, and connects to the event bus.
     * This must be called before any other methods.
     */
    public async initialize(): Promise<void> {
        try {
            this.setState('AUTHENTICATING');
            await this.authService.initialize();
            this.currentUser = this.authService.getCurrentUser();

            if (!this.currentUser) {
                // In a real app, this might trigger a login flow.
                // For this system, we'll assume guest access or throw.
                throw new Error("Authentication failed or user not found.");
            }

            await this.eventBus.connect();
            this.subscribeToSessionEvents();
            this.setState('IDLE');
        } catch (error) {
            this.handleError(error as Error, 'Initialization failed');
            this.setState('DISCONNECTED');
        }
    }

    /**
     * Starts capturing audio from the user's microphone and streaming it to the backend.
     */
    public async startListening(): Promise<void> {
        if (this.internalState !== 'IDLE') {
            console.warn(`[VoiceBridge] Cannot start listening from state: ${this.internalState}`);
            return;
        }

        this.currentSessionId = `vsession_${this.currentUser?.id}_${Date.now()}`;
        this.setState('LISTENING', { transcript: '', isTranscriptFinal: false });

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new AudioContext();
            
            // Load the audio worklet processor
            await this.audioContext.audioWorklet.addModule('/audio-processor.js'); // Assuming this file is served
            
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-stream-processor');
            
            this.setupAudioStreamingSocket();

            this.audioWorkletNode.port.onmessage = (event) => {
                if (this.audioSocket?.readyState === WebSocket.OPEN) {
                    this.audioSocket.send(event.data); // Send raw PCM data
                }
            };

            source.connect(this.audioWorkletNode);
            // We don't connect to destination, as we don't need to hear the input.

        } catch (error) {
            this.handleError(error as Error, 'Failed to start microphone');
            await this.stopListening(true); // Force stop and cleanup
        }
    }

    /**
     * Stops capturing audio and signals the backend that the user has finished speaking.
     * @param isErrorState - Indicates if we are stopping due to an error, to bypass state checks.
     */
    public async stopListening(isErrorState: boolean = false): Promise<void> {
        if (this.internalState !== 'LISTENING' && !isErrorState) {
            return;
        }

        this.setState('PROCESSING');

        // Gracefully close audio resources
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        if (this.audioWorkletNode) {
            this.audioWorkletNode.disconnect();
            this.audioWorkletNode = null;
        }
        if (this.audioContext) {
            await this.audioContext.close();
            this.audioContext = null;
        }

        // Signal end of stream to the backend via WebSocket
        if (this.audioSocket?.readyState === WebSocket.OPEN) {
            this.audioSocket.send(JSON.stringify({ type: 'EOS', sessionId: this.currentSessionId }));
        }
        // The WebSocket server (APP_25) is responsible for publishing the AUDIO_INGESTION_COMPLETED event
        // upon receiving the EOS message and finalizing the audio file.
        if (this.audioSocket) {
            this.audioSocket.close();
            this.audioSocket = null;
        }
    }

    /**
     * Disconnects the bridge from all backend services.
     */
    public async disconnect(): Promise<void> {
        if (this.internalState === 'LISTENING') {
            await this.stopListening(true);
        }
        await this.eventBus.disconnect();
        this.setState('DISCONNECTED');
    }

    private setState(newState: BridgeInternalState, uiUpdates: Partial<SeedVoiceControlState> = {}): void {
        this.internalState = newState;
        let newUiStatus: SeedVoiceControlState['status'] = 'idle';

        switch (newState) {
            case 'LISTENING':
                newUiStatus = 'recording';
                break;
            case 'PROCESSING':
            case 'RESPONDING':
                newUiStatus = 'processing';
                break;
            case 'IDLE':
                newUiStatus = 'idle';
                break;
            case 'DISCONNECTED':
            case 'INITIALIZING':
            case 'AUTHENTICATING':
                newUiStatus = 'idle'; // Or a 'disabled' state if the UI supports it
                break;
        }

        this.uiState = {
            ...this.uiState,
            status: newUiStatus,
            ...uiUpdates,
        };

        this.config.callbacks.onStateChange(this.uiState);
    }



    private setupAudioStreamingSocket(): void {
        const ingestionEndpoint = this.coreSDK.getServiceEndpoint('APP_25_Ingestion_RealtimeAudio');
        if (!ingestionEndpoint) {
            throw new Error("Realtime audio ingestion service endpoint not configured.");
        }

        const token = this.authService.getToken();
        this.audioSocket = new WebSocket(`${ingestionEndpoint}?token=${token}`);

        this.audioSocket.onopen = () => {
            console.log('[VoiceBridge] Audio socket connected.');
            // Send session initialization message
            this.audioSocket?.send(JSON.stringify({
                type: 'BOS', // Begin Of Stream
                sessionId: this.currentSessionId,
                sampleRate: this.audioContext?.sampleRate,
                userId: this.currentUser?.id,
                metadata: {
                    // TENSION: Privacy vs. Performance
                    // We could include rich metadata here for better routing/personalization,
                    // but we limit it to essentials to respect user privacy.
                    // This is configurable via policy in APP_37_Governance_AuditTrailEngine.
                    client: 'web-voicebridge',
                    timestamp: new Date().toISOString(),
                }
            }));
        };

        this.audioSocket.onclose = (event) => {
            console.log(`[VoiceBridge] Audio socket closed: ${event.code} ${event.reason}`);
            if (this.internalState === 'LISTENING') {
                // Unexpected closure
                this.handleError(new Error(`Audio socket closed unexpectedly: ${event.reason}`), 'Streaming Error');
                this.stopListening(true);
            }
        };

        this.audioSocket.onerror = (error) => {
            this.handleError(error as Error, 'Audio socket error');
            this.stopListening(true);
        };
    }

    private subscribeToSessionEvents(): void {
        if (!this.currentUser) return;

        const userTopic = `user.${this.currentUser.id}.responses`;
        this.eventBus.subscribe(userTopic, (event: AppEvent) => {
            // Ensure the event is for the current active session
            if (event.payload.sessionId !== this.currentSessionId) {
                return;
            }

            switch (event.eventType) {
                case 'VOICE_TRANSCRIPTION_IN_PROGRESS':
                    this.handleTranscriptionUpdate(event.payload);
                    break;
                case 'VOICE_TRANSCRIPTION_COMPLETED':
                    this.handleTranscriptionFinal(event.payload);
                    break;
                case 'AGENT_RESPONSE_GENERATED':
                    this.handleAgentResponse(event.payload);
                    break;
                case 'AGENT_RESPONSE_FAILED':
                    this.handleError(new Error(event.payload.error.message), 'Agent Processing Error');
                    this.setState('IDLE');
                    break;
            }
        });
    }

    private handleTranscriptionUpdate(payload: EventPayload<'VOICE_TRANSCRIPTION_IN_PROGRESS'>): void {
        this.setState('PROCESSING', {
            transcript: payload.transcript,
            isTranscriptFinal: false,
        });
    }

    private handleTranscriptionFinal(payload: EventPayload<'VOICE_TRANSCRIPTION_COMPLETED'>): void {
        this.setState('PROCESSING', {
            transcript: payload.transcript,
            isTranscriptFinal: true,
        });
        // At this point, the backend orchestration pipeline (e.g., APP_14_Agents_MultiModelOrchestrator)
        // has already been triggered by the transcription service. The bridge just waits for the final agent response.
    }

    private handleAgentResponse(payload: EventPayload<'AGENT_RESPONSE_GENERATED'>): void {
        this.setState('RESPONDING');
        this.config.callbacks.onResponseReceived(payload.response);
        // After delivering the response, return to idle state.
        // The UI component is responsible for any follow-up actions, like playing audio.
        this.setState('IDLE', { transcript: '', isTranscriptFinal: false });
    }

    private handleError(error: Error, context: string): void {
        console.error(`[VoiceBridge] ${context}:`, error);
        const errorMessage = `${context}: ${error.message}`;
        this.setState('IDLE', { status: 'error', error: errorMessage });
    }
}