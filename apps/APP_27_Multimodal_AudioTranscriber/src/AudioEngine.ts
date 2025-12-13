/*
 * Copyright 2024 Aetheris, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import {
    Logger,
    EventBus,
    AetherisError,
    ErrorCodes,
    ConfigManager,
    AuthContext,
    ServiceHealth,
    HealthStatus
} from '@aetheris/core';

import {
    ITranscriptionProvider,
    ProviderCapabilities,
    ProviderMetadata
} from './providers/ITranscriptionProvider';
import {
    AudioEngineConfig,
    TranscriptionRequest,
    TranscriptionResult,
    TranscriptionJob,
    TranscriptionJobStatus,
    AudioSource,
    TranscriptionCost,
    ProviderSelectionCriteria,
    EngineMetrics,
    DEFAULT_ENGINE_CONFIG
} from './types';
import { AudioUtils } from './utils/AudioUtils';

/**
 * Core audio processing engine for APP_27. This class orchestrates the transcription
 * and diarization process by selecting the optimal provider based on user-defined
 * criteria, managing the job lifecycle, and normalizing outputs.
 *
 * The core architectural tension is Speed vs. Accuracy/Cost. The provider
 * selection logic is designed to explicitly navigate this trade-off.
 */
export class AudioEngine {
    private readonly logger: Logger;
    private readonly eventBus: EventBus;
    private readonly config: AudioEngineConfig;
    private readonly providers: Map<string, ITranscriptionProvider> = new Map();
    private metrics: EngineMetrics;

    constructor(configManager: ConfigManager, eventBus: EventBus) {
        this.logger = new Logger('AudioEngine');
        this.eventBus = eventBus;
        this.config = {
            ...DEFAULT_ENGINE_CONFIG,
            ...configManager.get<AudioEngineConfig>('app_27_audio_engine')
        };

        this.metrics = this.initializeMetrics();
        this.logger.info('AudioEngine initialized.');
    }

    /**
     * Registers a transcription provider with the engine.
     * @param provider An instance of a class implementing ITranscriptionProvider.
     */
    public registerProvider(provider: ITranscriptionProvider): void {
        const metadata = provider.getMetadata();
        if (this.providers.has(metadata.id)) {
            this.logger.warn(`Provider with ID '${metadata.id}' is already registered. Overwriting.`);
        }
        this.providers.set(metadata.id, provider);
        this.logger.info(`Registered provider: ${metadata.name} (ID: ${metadata.id})`);
    }

    /**
     * The main entry point for transcribing an audio source.
     * @param request The transcription request details.
     * @param authContext The authentication context of the caller.
     * @returns A promise that resolves to the transcription result.
     */
    public async transcribe(request: TranscriptionRequest, authContext: AuthContext): Promise<TranscriptionResult> {
        const jobId = `job-${uuidv4()}`;
        const job: TranscriptionJob = {
            id: jobId,
            status: TranscriptionJobStatus.PENDING,
            createdAt: new Date(),
            authContext,
            request,
            steps: [],
        };

        try {
            this.emitJobStatus(job, TranscriptionJobStatus.VALIDATING);
            this.validateRequest(request);

            this.emitJobStatus(job, TranscriptionJobStatus.SELECTING_PROVIDER);
            const selectedProvider = this.selectProvider(request.criteria);
            job.providerId = selectedProvider.getMetadata().id;
            this.logger.info(`[${jobId}] Selected provider: ${job.providerId}`);

            this.emitJobStatus(job, TranscriptionJobStatus.PREPROCESSING);
            const { processedSource, durationSeconds } = await this.preprocessAudio(jobId, request.audio);
            job.request.audio = processedSource; // Update job with processed source
            job.audioDurationSeconds = durationSeconds;

            this.emitJobStatus(job, TranscriptionJobStatus.TRANSCRIBING);
            const startTime = Date.now();

            const providerResult = await selectedProvider.transcribe({
                ...request,
                audio: processedSource,
            });

            const processingTimeMs = Date.now() - startTime;

            this.emitJobStatus(job, TranscriptionJobStatus.POSTPROCESSING);
            const finalResult = this.normalizeResult(providerResult, job, processingTimeMs);

            this.emitJobStatus(job, TranscriptionJobStatus.COMPLETED, finalResult);
            this.updateMetrics(job, finalResult, 'success');

            return finalResult;
        } catch (error) {
            const aetherisError = this.handleError(error, job);
            this.emitJobStatus(job, TranscriptionJobStatus.FAILED, undefined, aetherisError);
            this.updateMetrics(job, undefined, 'failure');
            throw aetherisError;
        }
    }

    /**
     * Selects the best provider based on the given criteria.
     * This is the heart of the cost/speed/accuracy trade-off logic.
     * @param criteria The selection criteria.
     * @returns The selected transcription provider.
     */
    private selectProvider(criteria: ProviderSelectionCriteria): ITranscriptionProvider {
        const candidates = Array.from(this.providers.values());

        if (candidates.length === 0) {
            throw new AetherisError(ErrorCodes.SERVICE_UNAVAILABLE, 'No transcription providers are registered.');
        }

        // 1. Filter by required features
        let filtered = candidates.filter(p => {
            const caps = p.getCapabilities();
            if (criteria.requiredFeatures?.diarization && !caps.supportsDiarization) return false;
            if (criteria.requiredFeatures?.speakerLabels && !caps.supportsSpeakerLabels) return false;
            if (criteria.requiredFeatures?.wordTimestamps && !caps.supportsWordTimestamps) return false;
            if (criteria.language && !caps.supportedLanguages.includes(criteria.language) && !caps.supportedLanguages.includes('*')) return false;
            return true;
        });

        if (filtered.length === 0) {
            throw new AetherisError(ErrorCodes.INVALID_ARGUMENT, 'No provider supports the requested feature set.');
        }

        // 2. Sort by priority
        filtered.sort((a, b) => {
            const metaA = a.getMetadata();
            const metaB = b.getMetadata();
            switch (criteria.priority) {
                case 'cost':
                    return metaA.costTier - metaB.costTier;
                case 'speed':
                    return metaA.speedTier - metaB.speedTier;
                case 'accuracy':
                    return metaB.accuracyTier - metaA.accuracyTier; // Higher is better
                default: // 'best_effort' or undefined
                    // A balanced score: accuracy is most important, then cost, then speed.
                    const scoreA = metaA.accuracyTier * 3 - metaA.costTier * 2 - metaA.speedTier;
                    const scoreB = metaB.accuracyTier * 3 - metaB.costTier * 2 - metaB.speedTier;
                    return scoreB - scoreA;
            }
        });

        // 3. Return the best candidate
        return filtered[0];
    }

    /**
     * Preprocesses audio: validates, gets metadata, and potentially transcodes.
     * @param jobId The job ID for logging.
     * @param audioSource The audio source to process.
     * @returns An object with the processed audio source and its duration.
     */
    private async preprocessAudio(jobId: string, audioSource: AudioSource): Promise<{ processedSource: AudioSource; durationSeconds: number }> {
        this.logger.info(`[${jobId}] Starting audio preprocessing.`);
        // In a real implementation, this would involve more complex logic:
        // - Checking format and codec.
        // - Using a library like fluent-ffmpeg to transcode to a standard format (e.g., 16-bit PCM WAV @ 16kHz).
        // - Handling remote URIs by streaming them to a temporary local file.
        const durationSeconds = await AudioUtils.getAudioDuration(audioSource);

        if (durationSeconds > this.config.maxAudioDurationSeconds) {
            throw new AetherisError(ErrorCodes.INVALID_ARGUMENT, `Audio duration (${durationSeconds}s) exceeds maximum allowed (${this.config.maxAudioDurationSeconds}s).`);
        }

        this.logger.info(`[${jobId}] Audio duration: ${durationSeconds}s.`);
        // For this example, we assume the audio is already in a compatible format.
        return { processedSource: audioSource, durationSeconds };
    }

    /**
     * Normalizes the output from a provider into the standard TranscriptionResult format.
     * @param providerResult The result from the provider.
     * @param job The transcription job context.
     * @param processingTimeMs The time taken by the provider.
     * @returns The normalized transcription result.
     */
    private normalizeResult(providerResult: any, job: TranscriptionJob, processingTimeMs: number): TranscriptionResult {
        const cost = this.calculateCost(job);
        const result: TranscriptionResult = {
            jobId: job.id,
            transcript: providerResult.transcript,
            language: providerResult.language,
            confidence: providerResult.confidence,
            words: providerResult.words || [],
            diarization: providerResult.diarization || [],
            metadata: {
                providerId: job.providerId!,
                audioDurationSeconds: job.audioDurationSeconds!,
                processingTimeMs,
                createdAt: new Date(),
            },
            cost,
        };
        return result;
    }

    /**
     * Calculates the estimated cost of a transcription job.
     * @param job The job context.
     * @returns The calculated cost.
     */
    private calculateCost(job: TranscriptionJob): TranscriptionCost {
        const provider = this.providers.get(job.providerId!);
        if (!provider) {
            this.logger.error(`[${job.id}] Cannot calculate cost: provider ${job.providerId} not found.`);
            return { total: 0, currency: 'USD', details: [] };
        }
        return provider.calculateCost(job.audioDurationSeconds!, job.request);
    }

    /**
     * Validates the incoming transcription request.
     * @param request The request to validate.
     */
    private validateRequest(request: TranscriptionRequest): void {
        if (!request.audio) {
            throw new AetherisError(ErrorCodes.INVALID_ARGUMENT, 'Audio source is required.');
        }
        if (!request.criteria || !request.criteria.priority) {
            this.logger.warn('Request is missing priority criteria, using default "best_effort".');
            request.criteria = { ...request.criteria, priority: 'best_effort' };
        }
    }

    /**
     * Emits a job status update event to the event bus.
     * @param job The job object.
     * @param status The new status.
     * @param result Optional result for completed jobs.
     * @param error Optional error for failed jobs.
     */
    private emitJobStatus(job: TranscriptionJob, status: TranscriptionJobStatus, result?: TranscriptionResult, error?: AetherisError): void {
        job.status = status;
        const step = { status, timestamp: new Date(), details: '' };
        if (error) {
            step.details = error.message;
        }
        job.steps.push(step);

        this.eventBus.publish('aetheris.app27.transcription.status', {
            jobId: job.id,
            status,
            timestamp: new Date(),
            authContext: job.authContext,
            result,
            error: error ? { code: error.code, message: error.message } : undefined,
        });
    }

    /**
     * Centralized error handling.
     * @param error The caught error.
     * @param job The job context.
     * @returns A standardized AetherisError.
     */
    private handleError(error: any, job: TranscriptionJob): AetherisError {
        if (error instanceof AetherisError) {
            this.logger.error(`[${job.id}] AetherisError occurred: ${error.message}`, { code: error.code });
            return error;
        }
        this.logger.error(`[${job.id}] An unexpected error occurred:`, error);
        return new AetherisError(ErrorCodes.INTERNAL_ERROR, 'An internal error occurred during transcription.', { originalError: error.message });
    }

    private initializeMetrics(): EngineMetrics {
        return {
            totalJobsProcessed: 0,
            successfulJobs: 0,
            failedJobs: 0,
            totalAudioSecondsProcessed: 0,
            totalCost: 0,
            providerUsage: {},
        };
    }

    private updateMetrics(job: TranscriptionJob, result: TranscriptionResult | undefined, status: 'success' | 'failure'): void {
        this.metrics.totalJobsProcessed++;
        if (status === 'success' && result) {
            this.metrics.successfulJobs++;
            this.metrics.totalAudioSecondsProcessed += result.metadata.audioDurationSeconds;
            this.metrics.totalCost += result.cost.total;
        } else {
            this.metrics.failedJobs++;
        }

        if (job.providerId) {
            if (!this.metrics.providerUsage[job.providerId]) {
                this.metrics.providerUsage[job.providerId] = { jobs: 0, seconds: 0 };
            }
            this.metrics.providerUsage[job.providerId].jobs++;
            if (job.audioDurationSeconds) {
                this.metrics.providerUsage[job.providerId].seconds += job.audioDurationSeconds;
            }
        }
    }

    // --- Self-Querying Agent Methods ---

    public introspect(): object {
        return {
            config: this.config,
            registeredProviders: Array.from(this.providers.keys()),
            providerDetails: Array.from(this.providers.values()).map(p => ({
                metadata: p.getMetadata(),
                capabilities: p.getCapabilities(),
            })),
            currentMetrics: this.metrics,
            health: this.getHealth(),
        };
    }

    public getAssumptions(): string[] {
        return [
            "Assumes input audio is in a format parsable by AudioUtils.",
            "Assumes provider API keys in configuration are valid and have sufficient quota.",
            "Assumes the event bus is available and operational for status updates.",
            "Assumes that provider-reported capabilities are accurate.",
            "Assumes cost models provided by adapters are a close approximation of actual billing."
        ];
    }

    public getFailureModes(): object {
        return {
            "PROVIDER_API_UNAVAILABLE": "A downstream transcription provider's API is down or unreachable.",
            "INVALID_API_KEY": "An API key for a provider is invalid or has been revoked.",
            "QUOTA_EXCEEDED": "A provider's rate limit or billing quota has been exceeded.",
            "UNSUPPORTED_AUDIO_FORMAT": "The input audio file is in a format that cannot be processed.",
            "DIARIZATION_FAILURE": "The selected provider fails to separate speakers correctly, resulting in an inaccurate transcript.",
            "LANGUAGE_DETECTION_ERROR": "The automatic language detection identifies the wrong language, leading to poor transcription quality.",
            "CONFIG_LOAD_FAILURE": "The service fails to start if the core configuration cannot be loaded."
        };
    }

    public getHealth(): ServiceHealth {
        const providerStatuses = Array.from(this.providers.values()).map(p => p.getHealth());
        const overallStatus = providerStatuses.every(s => s.status === HealthStatus.OK)
            ? HealthStatus.OK
            : HealthStatus.DEGRADED;

        return {
            service: 'APP_27_AudioEngine',
            status: overallStatus,
            timestamp: new Date().toISOString(),
            dependencies: providerStatuses,
        };
    }
}