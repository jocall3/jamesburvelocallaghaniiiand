import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { Readable } from 'stream';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';
import { z } from 'zod';
import { Logger } from 'pino';

/**
 * -----------------------------------------------------------------------------
 * SHARED ECOSYSTEM PRIMITIVES (Simulated Imports)
 * In a real deployment, these would come from @ecosystem/core-sdk
 * -----------------------------------------------------------------------------
 */

// --- Shared Types ---
type UUID = string;
type ISODate = string;

enum EventType {
  INGESTION_STARTED = 'INGESTION_STARTED',
  INGESTION_COMPLETED = 'INGESTION_COMPLETED',
  INGESTION_FAILED = 'INGESTION_FAILED',
  CHUNK_PRODUCED = 'CHUNK_PRODUCED',
}

interface EcosystemEvent {
  id: UUID;
  type: EventType;
  source: string;
  payload: Record<string, any>;
  timestamp: ISODate;
  traceId: string;
}

interface AuthContext {
  userId: string;
  orgId: string;
  permissions: string[];
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
}

// --- Shared Event Bus Stub ---
class EventBus {
  private static instance: EventBus;
  private emitter = new EventEmitter();

  public static getInstance(): EventBus {
    if (!EventBus.instance) EventBus.instance = new EventBus();
    return EventBus.instance;
  }

  public async publish(event: EcosystemEvent): Promise<void> {
    // In production: Push to Kafka / RabbitMQ / NATS
    console.log(`[EventBus] Published: ${event.type} from ${event.source}`);
    this.emitter.emit(event.type, event);
  }
}

// --- Shared Config Manager ---
const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3022),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(500),
  TEMP_DIR: z.string().default('/tmp/ingestion'),
  // Vendor Keys
  OPENAI_API_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  ASSEMBLYAI_API_KEY: z.string().optional(),
  // Feature Flags
  ENABLE_OCR: z.coerce.boolean().default(true),
  ENABLE_VIDEO_ANALYSIS: z.coerce.boolean().default(true),
  ENABLE_AUDIO_TRANSCRIPTION: z.coerce.boolean().default(true),
});

type Config = z.infer<typeof ConfigSchema>;
const config: Config = ConfigSchema.parse(process.env);

/**
 * -----------------------------------------------------------------------------
 * APP DOMAIN: MULTIMODAL INGESTION
 * -----------------------------------------------------------------------------
 */

// --- Domain Types ---

enum MediaType {
  PDF = 'application/pdf',
  AUDIO_MP3 = 'audio/mpeg',
  AUDIO_WAV = 'audio/wav',
  VIDEO_MP4 = 'video/mp4',
  TEXT_PLAIN = 'text/plain',
}

interface IngestionJob {
  id: UUID;
  orgId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  mediaType: MediaType;
  originalFilename: string;
  filePath: string;
  metadata: Record<string, any>;
  createdAt: ISODate;
  completedAt?: ISODate;
  error?: string;
  costEstimateUSD: number;
}

interface ProcessedChunk {
  jobId: UUID;
  chunkIndex: number;
  content: string;
  embedding?: number[];
  modality: 'text' | 'audio_transcript' | 'image_description';
  startTime?: number; // For audio/video
  endTime?: number;   // For audio/video
  pageNumber?: number; // For PDF
}

// --- Services ---

/**
 * Abstract Base Class for Media Processors
 */
abstract class MediaProcessor {
  abstract supportedTypes: MediaType[];
  
  abstract process(job: IngestionJob): Promise<ProcessedChunk[]>;

  protected calculateCost(tokens: number, modelRate: number): number {
    return (tokens / 1000) * modelRate;
  }
}

/**
 * PDF Processor: Handles OCR and Text Extraction
 * Integrates: AWS Textract (simulated) or Tesseract fallback
 */
class PdfProcessor extends MediaProcessor {
  supportedTypes = [MediaType.PDF];

  async process(job: IngestionJob): Promise<ProcessedChunk[]> {
    console.log(`[PdfProcessor] Processing ${job.id}`);
    
    // Simulation of OCR Latency
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real implementation, we would use pdf-parse or AWS Textract SDK here.
    // For this rigorous simulation, we generate synthetic structured data representing OCR output.
    
    const chunks: ProcessedChunk[] = [];
    const pageCount = Math.floor(Math.random() * 10) + 1;

    for (let i = 1; i <= pageCount; i++) {
      chunks.push({
        jobId: job.id,
        chunkIndex: i - 1,
        content: `[Page ${i}] Extracted content from ${job.originalFilename}. This represents dense technical documentation or legal contracts found in the PDF.`,
        modality: 'text',
        pageNumber: i,
      });
    }

    return chunks;
  }
}

/**
 * Audio Processor: Handles Transcription
 * Integrates: OpenAI Whisper or AssemblyAI
 */
class AudioProcessor extends MediaProcessor {
  supportedTypes = [MediaType.AUDIO_MP3, MediaType.AUDIO_WAV];

  async process(job: IngestionJob): Promise<ProcessedChunk[]> {
    console.log(`[AudioProcessor] Transcribing ${job.id}`);

    // Check for vendor keys to determine routing
    const provider = config.OPENAI_API_KEY ? 'OpenAI' : (config.ASSEMBLYAI_API_KEY ? 'AssemblyAI' : 'Mock');
    
    // Simulate Transcription
    await new Promise(resolve => setTimeout(resolve, 1500));

    const durationSeconds = 120; // Mock duration
    const chunks: ProcessedChunk[] = [];

    // Simulate segments
    for (let t = 0; t < durationSeconds; t += 30) {
      chunks.push({
        jobId: job.id,
        chunkIndex: t / 30,
        content: `[${provider} Transcript ${t}s-${t+30}s] Discussion about system architecture and entropy in distributed systems.`,
        modality: 'audio_transcript',
        startTime: t,
        endTime: t + 30
      });
    }

    return chunks;
  }
}

/**
 * Video Processor: Handles Frame Extraction + Audio
 * Integrates: ffmpeg (via child_process) + Vision Models
 */
class VideoProcessor extends MediaProcessor {
  supportedTypes = [MediaType.VIDEO_MP4];

  async process(job: IngestionJob): Promise<ProcessedChunk[]> {
    console.log(`[VideoProcessor] Analyzing ${job.id}`);

    // 1. Extract Audio -> Send to AudioProcessor (Composition)
    // 2. Extract Keyframes -> Send to Vision Model (e.g., GPT-4o or Google Gemini)
    
    const chunks: ProcessedChunk[] = [];

    // Mock Video Analysis
    chunks.push({
      jobId: job.id,
      chunkIndex: 0,
      content: "Scene description: A presenter stands in front of a whiteboard explaining a UML diagram.",
      modality: 'image_description',
      startTime: 0,
      endTime: 10
    });

    chunks.push({
      jobId: job.id,
      chunkIndex: 1,
      content: "Transcript: 'As you can see here, the latency spikes when the queue depth exceeds 1000.'",
      modality: 'audio_transcript',
      startTime: 0,
      endTime: 10
    });

    return chunks;
  }
}

/**
 * Chunking Service: Semantic splitting of text
 */
class ChunkingService {
  // Recursive character splitter logic
  public splitText(text: string, chunkSize: number = 1000, overlap: number = 100): string[] {
    if (text.length <= chunkSize) return [text];
    
    const mid = Math.floor(text.length / 2);
    const left = text.slice(0, mid);
    const right = text.slice(mid);
    
    return [left, right]; // Simplified for brevity, real impl would respect sentence boundaries
  }
}

/**
 * Ingestion Manager: Orchestrator
 */
class IngestionManager {
  private processors: Map<MediaType, MediaProcessor> = new Map();
  private jobs: Map<UUID, IngestionJob> = new Map();
  private eventBus = EventBus.getInstance();

  constructor() {
    this.registerProcessor(new PdfProcessor());
    this.registerProcessor(new AudioProcessor());
    this.registerProcessor(new VideoProcessor());
  }

  private registerProcessor(processor: MediaProcessor) {
    processor.supportedTypes.forEach(type => {
      this.processors.set(type, processor);
    });
  }

  public async createJob(
    file: { filename: string; mimetype: string; path: string },
    auth: AuthContext
  ): Promise<IngestionJob> {
    const jobId = crypto.randomUUID();
    const mediaType = file.mimetype as MediaType;

    if (!Object.values(MediaType).includes(mediaType)) {
      throw new Error(`Unsupported media type: ${mediaType}`);
    }

    const job: IngestionJob = {
      id: jobId,
      orgId: auth.orgId,
      status: 'PENDING',
      mediaType,
      originalFilename: file.filename,
      filePath: file.path,
      metadata: {},
      createdAt: new Date().toISOString(),
      costEstimateUSD: 0,
    };

    this.jobs.set(jobId, job);

    // Async processing
    this.processJob(job).catch(err => {
      console.error(`[IngestionManager] Job ${jobId} failed unrecoverably`, err);
    });

    await this.eventBus.publish({
      id: crypto.randomUUID(),
      type: EventType.INGESTION_STARTED,
      source: 'APP_22_Data_MultimodalIngestion',
      payload: { jobId, orgId: auth.orgId, mediaType },
      timestamp: new Date().toISOString(),
      traceId: crypto.randomUUID()
    });

    return job;
  }

  private async processJob(job: IngestionJob) {
    try {
      job.status = 'PROCESSING';
      const processor = this.processors.get(job.mediaType);
      
      if (!processor) {
        throw new Error(`No processor found for ${job.mediaType}`);
      }

      const chunks = await processor.process(job);

      // In a real system, we would now send these chunks to APP_23_Vector_Embeddings
      // Here we just log and finish
      
      job.status = 'COMPLETED';
      job.completedAt = new Date().toISOString();
      
      // Emit chunks
      for (const chunk of chunks) {
        await this.eventBus.publish({
          id: crypto.randomUUID(),
          type: EventType.CHUNK_PRODUCED,
          source: 'APP_22_Data_MultimodalIngestion',
          payload: { ...chunk, orgId: job.orgId },
          timestamp: new Date().toISOString(),
          traceId: crypto.randomUUID()
        });
      }

      await this.eventBus.publish({
        id: crypto.randomUUID(),
        type: EventType.INGESTION_COMPLETED,
        source: 'APP_22_Data_MultimodalIngestion',
        payload: { jobId: job.id, chunkCount: chunks.length },
        timestamp: new Date().toISOString(),
        traceId: crypto.randomUUID()
      });

    } catch (error: any) {
      job.status = 'FAILED';
      job.error = error.message;
      
      await this.eventBus.publish({
        id: crypto.randomUUID(),
        type: EventType.INGESTION_FAILED,
        source: 'APP_22_Data_MultimodalIngestion',
        payload: { jobId: job.id, error: error.message },
        timestamp: new Date().toISOString(),
        traceId: crypto.randomUUID()
      });
    }
  }

  public getJob(id: UUID): IngestionJob | undefined {
    return this.jobs.get(id);
  }
}

/**
 * -----------------------------------------------------------------------------
 * HTTP SERVER & API
 * -----------------------------------------------------------------------------
 */

const app: FastifyInstance = Fastify({
  logger: true,
  bodyLimit: config.MAX_FILE_SIZE_MB * 1024 * 1024,
});

app.register(fastifyMultipart);
app.register(fastifyCors);

const ingestionManager = new IngestionManager();

// --- Middleware Stub ---
const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    // For demo purposes, we allow a bypass if in dev, else 401
    if (config.NODE_ENV === 'development') {
      (request as any).user = { userId: 'dev-user', orgId: 'dev-org', permissions: ['*'], tier: 'ENTERPRISE' };
      return;
    }
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }
  // Mock JWT verification
  (request as any).user = { userId: 'user-123', orgId: 'org-456', permissions: ['read', 'write'], tier: 'PRO' };
};

// --- Routes ---

app.post('/ingest', { preHandler: authenticate }, async (request, reply) => {
  const data = await request.file();
  if (!data) {
    return reply.code(400).send({ error: 'No file uploaded' });
  }

  // Save to temp
  if (!fs.existsSync(config.TEMP_DIR)) fs.mkdirSync(config.TEMP_DIR, { recursive: true });
  const tempPath = path.join(config.TEMP_DIR, `${crypto.randomUUID()}_${data.filename}`);
  
  await new Promise((resolve, reject) => {
    const pump = data.file.pipe(fs.createWriteStream(tempPath));
    pump.on('finish', resolve);
    pump.on('error', reject);
  });

  const user = (request as any).user as AuthContext;
  
  try {
    const job = await ingestionManager.createJob({
      filename: data.filename,
      mimetype: data.mimetype,
      path: tempPath
    }, user);
    
    return reply.code(202).send(job);
  } catch (e: any) {
    return reply.code(400).send({ error: e.message });
  }
});

app.get('/jobs/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params as { id: string };
  const job = ingestionManager.getJob(id);
  if (!job) return reply.code(404).send({ error: 'Job not found' });
  return job;
});

// --- Self-Querying / Introspection Endpoints ---

app.get('/introspect', async () => {
  return {
    app_id: 'APP_22_Data_MultimodalIngestion',
    status: 'HEALTHY',
    uptime: process.uptime(),
    config: {
      ocr_enabled: config.ENABLE_OCR,
      video_enabled: config.ENABLE_VIDEO_ANALYSIS,
      max_file_size: config.MAX_FILE_SIZE_MB
    },
    metrics: {
      active_jobs: 0, // In real app, query manager
      processed_count: 0
    }
  };
});

app.get('/assumptions', async () => {
  return {
    assumptions: [
      "Files are temporarily stored on local disk before processing.",
      "Downstream vector database is available via EventBus.",
      "OCR accuracy depends on input quality; no guarantees for handwritten text.",
      "Video processing extracts 1 frame per 10 seconds for cost optimization."
    ]
  };
});

app.get('/failure-modes', async () => {
  return {
    modes: [
      { code: 'FILE_TOO_LARGE', mitigation: 'Client-side chunking or S3 presigned URLs.' },
      { code: 'OCR_TIMEOUT', mitigation: 'Async processing queue with exponential backoff.' },
      { code: 'UNSUPPORTED_CODEC', mitigation: 'FFmpeg transcoding fallback.' },
      { code: 'API_RATE_LIMIT', mitigation: 'Circuit breaker pattern on vendor APIs.' }
    ]
  };
});

app.get('/update-triggers', async () => {
  return {
    triggers: [
      "New ffmpeg version available",
      "OpenAI Whisper model deprecation",
      "Schema change in EventType.CHUNK_PRODUCED"
    ]
  };
});

// --- Agent Metadata ---

const agentMetadata = {
  purpose: "Ingest raw multimodal files (PDF, Audio, Video), normalize them, and emit semantic chunks for vectorization.",
  dependencies: [
    "ffmpeg (system)",
    "OpenAI API (optional)",
    "AWS Textract (optional)",
    "EventBus (system)"
  ],
  invalidation_conditions: [
    "Disk full",
    "Invalid API credentials"
  ],
  adjacent_apps: [
    "APP_23_Vector_Embeddings",
    "APP_21_Data_Connectors",
    "APP_30_Storage_BlobStore"
  ]
};

app.get('/agent-metadata', async () => {
  return agentMetadata;
});

/**
 * -----------------------------------------------------------------------------
 * BOOTSTRAP
 * -----------------------------------------------------------------------------
 */

const start = async () => {
  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    console.log(`[APP_22] Multimodal Ingestion Service running on port ${config.PORT}`);
    
    // Print Agent Metadata for System Scanner
    console.log('__AGENT_METADATA__');
    console.log(JSON.stringify(agentMetadata, null, 2));
    console.log('__END_AGENT_METADATA__');

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

export { app, IngestionManager };