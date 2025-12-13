/*
 * Copyright (c) 2024. The Autonomous Software Architect Ecosystem Project.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is

 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { CoreSDK, Logger, ConfigService, CodedError } from '@ecosystem/core-sdk';
import { IAIModelProvider, IAIModelProviderFactory } from '@ecosystem/integration-abstractions';
import { ITokenizer } from './tokenizers/ITokenizer';

// --- Type Definitions ---

export interface Message {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string | null;
    name?: string;
    tool_calls?: any[];
    tool_call_id?: string;
}

export interface CompressionResult {
    compressedMessages: Message[];
    originalTokenCount: number;
    compressedTokenCount: number;
    tokensSaved: number;
    strategy: string;
    cost: number; // Cost of the compression operation itself (e.g., summarization API calls)
    details: Record<string, any>;
}

export interface CompressionStrategy {
    compress(messages: Message[], currentTokenCount: number, targetTokenLimit: number): Promise<CompressionResult>;
}

export interface BaseStrategyConfig {
    // A buffer to leave for the model's response. Defaults to a reasonable value.
    responseTokenBuffer?: number;
    // Preserve system messages at all costs. Defaults to true.
    preserveSystemMessages?: boolean;
}

export interface PruningStrategyConfig extends BaseStrategyConfig {
    strategy: 'prune-oldest' | 'prune-middle';
    // Keep the first N and last M messages, pruning from the middle.
    keepFirstN?: number;
    keepLastM?: number;
}

export interface SummarizationStrategyConfig extends BaseStrategyConfig {
    strategy: 'summarize-chunks';
    summarizationModelProvider: string; // e.g., 'openai'
    summarizationModelId: string; // e.g., 'gpt-3.5-turbo'
    chunkTokenSize: number;
    summaryPromptTemplate?: string;
}

export interface HybridStrategyConfig extends BaseStrategyConfig {
    strategy: 'hybrid-smart';
    pruningConfig: Omit<PruningStrategyConfig, 'strategy' | 'responseTokenBuffer' | 'preserveSystemMessages'>;
    summarizationConfig: Omit<SummarizationStrategyConfig, 'strategy' | 'responseTokenBuffer' | 'preserveSystemMessages'>;
    // The token overage threshold at which to switch from pruning to summarization
    summarizationTriggerThreshold: number;
}

export type CompressionStrategyConfig = PruningStrategyConfig | SummarizationStrategyConfig | HybridStrategyConfig;


// --- Abstract Base Strategy ---

abstract class BaseCompressionStrategy implements CompressionStrategy {
    protected readonly logger: Logger;
    protected readonly tokenizer: ITokenizer;
    protected readonly config: BaseStrategyConfig;

    constructor(tokenizer: ITokenizer, config: BaseStrategyConfig, logger: Logger) {
        this.tokenizer = tokenizer;
        this.config = {
            responseTokenBuffer: 1024,
            preserveSystemMessages: true,
            ...config
        };
        this.logger = logger;
    }

    abstract compress(messages: Message[], currentTokenCount: number, targetTokenLimit: number): Promise<CompressionResult>;

    protected getSystemMessages(messages: Message[]): Message[] {
        return this.config.preserveSystemMessages ? messages.filter(m => m.role === 'system') : [];
    }

    protected getNonSystemMessages(messages: Message[]): Message[] {
        return this.config.preserveSystemMessages ? messages.filter(m => m.role !== 'system') : messages;
    }
}


// --- Concrete Strategy Implementations ---

/**
 * PruningStrategy: Reduces context by removing messages.
 * This strategy embodies the tension between cost (very low) and information fidelity (high potential for loss).
 * It's fast and cheap but can abruptly remove critical context.
 */
class PruningStrategy extends BaseCompressionStrategy {
    private readonly pruningConfig: PruningStrategyConfig;

    constructor(tokenizer: ITokenizer, config: PruningStrategyConfig, logger: Logger) {
        super(tokenizer, config, logger);
        this.pruningConfig = config;
    }

    async compress(messages: Message[], currentTokenCount: number, targetTokenLimit: number): Promise<CompressionResult> {
        this.logger.info({
            msg: 'Starting pruning strategy',
            mode: this.pruningConfig.strategy,
            currentTokenCount,
            targetTokenLimit
        });

        const systemMessages = this.getSystemMessages(messages);
        const conversationMessages = this.getNonSystemMessages(messages);

        let compressedMessages = [...conversationMessages];
        let compressedTokenCount = await this.tokenizer.countTokensForMessages(compressedMessages);
        const systemTokenCount = await this.tokenizer.countTokensForMessages(systemMessages);
        const finalTarget = targetTokenLimit - systemTokenCount;

        let messagesPruned = 0;

        while (compressedTokenCount > finalTarget && compressedMessages.length > 0) {
            if (this.pruningConfig.strategy === 'prune-middle' && this.pruningConfig.keepFirstN && this.pruningConfig.keepLastM) {
                const firstN = this.pruningConfig.keepFirstN;
                const lastM = this.pruningConfig.keepLastM;
                if (compressedMessages.length > firstN + lastM) {
                    compressedMessages.splice(firstN, 1); // Prune from after the first N
                } else {
                    // Fallback to oldest if we can't respect the middle-out rule
                    compressedMessages.shift();
                }
            } else { // Default to 'prune-oldest'
                compressedMessages.shift();
            }
            messagesPruned++;
            compressedTokenCount = await this.tokenizer.countTokensForMessages(compressedMessages);
        }

        const finalMessages = [...systemMessages, ...compressedMessages];
        const finalTokenCount = await this.tokenizer.countTokensForMessages(finalMessages);

        return {
            compressedMessages: finalMessages,
            originalTokenCount: currentTokenCount,
            compressedTokenCount: finalTokenCount,
            tokensSaved: currentTokenCount - finalTokenCount,
            strategy: this.pruningConfig.strategy,
            cost: 0, // Pruning has no direct monetary cost
            details: { messagesPruned },
        };
    }
}

/**
 * SummarizationStrategy: Reduces context by using an LLM to summarize chunks of the conversation.
 * This strategy embodies the tension between quality (high information retention) and cost/latency (high).
 * It's expensive and slow but preserves the semantic meaning of the history.
 */
class SummarizationStrategy extends BaseCompressionStrategy {
    private readonly summarizationConfig: SummarizationStrategyConfig;
    private readonly summarizationProvider: IAIModelProvider;

    constructor(tokenizer: ITokenizer, config: SummarizationStrategyConfig, logger: Logger, providerFactory: IAIModelProviderFactory) {
        super(tokenizer, config, logger);
        this.summarizationConfig = config;
        this.summarizationProvider = providerFactory.create(config.summarizationModelProvider);
    }

    async compress(messages: Message[], currentTokenCount: number, targetTokenLimit: number): Promise<CompressionResult> {
        this.logger.info({
            msg: 'Starting summarization strategy',
            model: this.summarizationConfig.summarizationModelId,
            currentTokenCount,
            targetTokenLimit
        });

        const systemMessages = this.getSystemMessages(messages);
        const conversationMessages = this.getNonSystemMessages(messages);
        const systemTokenCount = await this.tokenizer.countTokensForMessages(systemMessages);
        const finalTarget = targetTokenLimit - systemTokenCount;

        let cost = 0;
        let chunksSummarized = 0;
        let compressedMessages = [...conversationMessages];
        let currentCompressedTokenCount = await this.tokenizer.countTokensForMessages(compressedMessages);

        if (currentCompressedTokenCount <= finalTarget) {
            return {
                compressedMessages: messages,
                originalTokenCount: currentTokenCount,
                compressedTokenCount: currentTokenCount,
                tokensSaved: 0,
                strategy: this.summarizationConfig.strategy,
                cost: 0,
                details: { message: "No compression needed." }
            };
        }

        // We work backwards from the start of the conversation
        const messagesToCompress: Message[] = [];
        let tempTokenCount = currentCompressedTokenCount;
        
        // Identify which messages need to be compressed
        while(tempTokenCount > finalTarget && compressedMessages.length > 0) {
            const message = compressedMessages.shift()!;
            messagesToCompress.push(message);
            tempTokenCount = await this.tokenizer.countTokensForMessages(compressedMessages);
        }

        // Chunk and summarize
        const summaries: string[] = [];
        let currentChunk: Message[] = [];
        let currentChunkTokens = 0;

        for (const message of messagesToCompress) {
            const messageTokens = await this.tokenizer.countTokensForMessages([message]);
            if (currentChunkTokens + messageTokens > this.summarizationConfig.chunkTokenSize) {
                summaries.push(await this.summarizeChunk(currentChunk));
                chunksSummarized++;
                currentChunk = [message];
                currentChunkTokens = messageTokens;
            } else {
                currentChunk.push(message);
                currentChunkTokens += messageTokens;
            }
        }
        if (currentChunk.length > 0) {
            summaries.push(await this.summarizeChunk(currentChunk));
            chunksSummarized++;
        }

        const summaryMessage: Message = {
            role: 'system',
            content: `[Context Summary] The conversation up to this point included the following key points:\n- ${summaries.join('\n- ')}`
        };

        const finalMessages = [...systemMessages, summaryMessage, ...compressedMessages];
        const finalTokenCount = await this.tokenizer.countTokensForMessages(finalMessages);

        return {
            compressedMessages: finalMessages,
            originalTokenCount: currentTokenCount,
            compressedTokenCount: finalTokenCount,
            tokensSaved: currentTokenCount - finalTokenCount,
            strategy: this.summarizationConfig.strategy,
            cost, // TODO: Calculate cost based on summarization provider's response
            details: { chunksSummarized },
        };
    }

    private async summarizeChunk(chunk: Message[]): Promise<string> {
        const prompt = this.summarizationConfig.summaryPromptTemplate ||
            `Summarize the following conversation excerpt concisely. Focus on key facts, decisions, and unanswered questions. Output a single paragraph.`;
        
        const conversationText = chunk.map(m => `${m.role}: ${m.content}`).join('\n');
        
        try {
            const response = await this.summarizationProvider.generate({
                model: this.summarizationConfig.summarizationModelId,
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: conversationText }
                ],
                max_tokens: 256,
                temperature: 0.2,
            });
            // TODO: Add cost calculation logic here based on response.usage
            return response.choices[0].message.content || "Summary could not be generated.";
        } catch (error) {
            this.logger.error({ msg: "Failed to summarize chunk", error });
            return "[Summary failed due to an error]";
        }
    }
}


// --- Main ContextCompressor Class ---

export interface ContextCompressorOptions {
    strategyConfig: CompressionStrategyConfig;
    tokenizer: ITokenizer;
    modelContextLimit: number;
    coreSDK: CoreSDK;
    aiProviderFactory: IAIModelProviderFactory;
}

/**
 * Manages the context window for large language models by intelligently
 * compressing conversation history to fit within token limits.
 * This class acts as the central orchestrator, selecting and executing
 * compression strategies based on user configuration.
 */
export class ContextCompressor {
    private readonly strategy: CompressionStrategy;
    private readonly tokenizer: ITokenizer;
    private readonly logger: Logger;
    private readonly config: ConfigService;
    private readonly modelContextLimit: number;
    private readonly responseTokenBuffer: number;

    // Extensibility hooks for custom pre/post processing
    public preCompressionHook?: (messages: Message[]) => Promise<Message[]>;
    public postCompressionHook?: (result: CompressionResult) => Promise<CompressionResult>;

    constructor(options: ContextCompressorOptions) {
        this.tokenizer = options.tokenizer;
        this.logger = options.coreSDK.getLogger('ContextCompressor');
        this.config = options.coreSDK.getConfigService();
        this.modelContextLimit = options.modelContextLimit;
        this.responseTokenBuffer = options.strategyConfig.responseTokenBuffer || 1024;

        this.strategy = this.createStrategy(options.strategyConfig, options.aiProviderFactory);

        this.logger.info({
            msg: 'ContextCompressor initialized',
            strategy: options.strategyConfig.strategy,
            modelContextLimit: this.modelContextLimit,
        });
    }

    private createStrategy(config: CompressionStrategyConfig, providerFactory: IAIModelProviderFactory): CompressionStrategy {
        switch (config.strategy) {
            case 'prune-oldest':
            case 'prune-middle':
                return new PruningStrategy(this.tokenizer, config as PruningStrategyConfig, this.logger);
            case 'summarize-chunks':
                return new SummarizationStrategy(this.tokenizer, config as SummarizationStrategyConfig, this.logger, providerFactory);
            case 'hybrid-smart':
                // The hybrid strategy is a future extension point, demonstrating architectural foresight.
                // It would dynamically choose between pruning and summarizing based on the context.
                this.logger.warn('HybridStrategy is not yet fully implemented. Falling back to prune-oldest.');
                return new PruningStrategy(this.tokenizer, { strategy: 'prune-oldest' }, this.logger);
            default:
                throw new CodedError(
                    'INVALID_CONFIG',
                    `Unsupported compression strategy: ${(config as any).strategy}`
                );
        }
    }

    /**
     * Compresses a list of messages to fit within a target token limit.
     * @param messages The full list of messages in the conversation.
     * @param customTargetTokenLimit An optional override for the model's context limit.
     * @returns A CompressionResult object with the compressed messages and metadata.
     */
    public async compress(messages: Message[], customTargetTokenLimit?: number): Promise<CompressionResult> {
        let processedMessages = messages;
        if (this.preCompressionHook) {
            processedMessages = await this.preCompressionHook(messages);
        }

        const currentTokenCount = await this.tokenizer.countTokensForMessages(processedMessages);
        const targetTokenLimit = (customTargetTokenLimit || this.modelContextLimit) - this.responseTokenBuffer;

        if (currentTokenCount <= targetTokenLimit) {
            this.logger.info('Context is within limits. No compression needed.');
            return {
                compressedMessages: processedMessages,
                originalTokenCount: currentTokenCount,
                compressedTokenCount: currentTokenCount,
                tokensSaved: 0,
                strategy: 'none',
                cost: 0,
                details: { message: 'No compression needed.' },
            };
        }

        this.logger.info({
            msg: 'Context exceeds token limit. Starting compression.',
            currentTokenCount,
            targetTokenLimit,
        });

        let result = await this.strategy.compress(processedMessages, currentTokenCount, targetTokenLimit);

        if (this.postCompressionHook) {
            result = await this.postCompressionHook(result);
        }

        this.logger.info({
            msg: 'Compression complete.',
            strategy: result.strategy,
            originalTokens: result.originalTokenCount,
            compressedTokens: result.compressedTokenCount,
            tokensSaved: result.tokensSaved,
            cost: result.cost,
        });

        return result;
    }
}