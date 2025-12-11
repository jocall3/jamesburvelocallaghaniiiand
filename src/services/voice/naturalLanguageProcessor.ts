export enum IntentType {
  GET_BALANCE = 'GET_BALANCE',
  GET_TRANSACTIONS = 'GET_TRANSACTIONS',
  TRANSFER_FUNDS = 'TRANSFER_FUNDS',
  PAY_BILL = 'PAY_BILL',
  GET_PROFILE = 'GET_PROFILE',
  LIST_PRODUCTS = 'LIST_PRODUCTS',
  LINK_REWARDS = 'LINK_REWARDS',
  UNKNOWN = 'UNKNOWN',
}

export enum EntityType {
  AMOUNT = 'AMOUNT',
  ACCOUNT = 'ACCOUNT',
  DATE = 'DATE',
  MERCHANT = 'MERCHANT',
  PROFILE_FIELD = 'PROFILE_FIELD',
  CURRENCY = 'CURRENCY',
}

export interface NLPContext {
  role?: 'SOURCE' | 'DESTINATION' | 'TARGET';
  index: number;
}

export interface Entity {
  type: EntityType;
  value: string;
  rawValue: string;
  confidence: number;
  context?: NLPContext;
}

export interface ParsedCommand {
  intent: IntentType;
  entities: Entity[];
  confidence: number;
  originalText: string;
}

/**
 * NaturalLanguageProcessor
 * 
 * An enhanced service to parse natural language voice commands into structured 
 * intents and entities. Supports multi-intent parsing (e.g., "Check balance AND pay bill").
 * 
 * Optimized for financial domain commands related to:
 * - Account Balances & Transactions
 * - Fund Transfers & Bill Pay
 * - Customer Profiles (Address, Email, Phone)
 * - Product Listings
 * - Reward Linkage
 */
export class NaturalLanguageProcessor {
  
  private readonly conjunctions = /\s+(?:and|then|after that|plus|also)\s+|[\.;]\s+/gi;
  
  private readonly patterns = {
    amount: /(\$|USD\s)?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?(\s?(dollars?|bucks|usd))?/gi,
    account: /\b(checking|savings|credit\s?card|visa|mastercard|rewards(?:\s?card)?|account)\b/gi,
    profile: /\b(email|address|phone|mobile|name|profile|details)\b/gi,
    rewards: /\b(link|enroll|shop\s?with\s?points|rewards?)\b/gi,
    merchant: /\b(starbucks|amazon|walmart|target|uber|netflix|utility|electric|water)\b/gi, // Common examples for demo
  };

  /**
   * Processes raw text input and returns a list of identified commands.
   * @param text The raw string from voice-to-text input.
   */
  public process(text: string): ParsedCommand[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // 1. Preprocess: normalize text
    const normalizedText = this.normalizeText(text);

    // 2. Split into sub-commands based on conjunctions
    const segments = normalizedText.split(this.conjunctions);

    // 3. Analyze each segment
    return segments
      .map(segment => segment.trim())
      .filter(segment => segment.length > 0)
      .map(segment => this.analyzeSegment(segment));
  }

  private normalizeText(text: string): string {
    return text.trim(); 
    // Further normalization (spelling correction, lowercasing) happens during analysis
  }

  private analyzeSegment(text: string): ParsedCommand {
    const lowerText = text.toLowerCase();
    const entities: Entity[] = [];

    // Extract Entities
    this.extractAmounts(text, entities);
    this.extractAccounts(text, lowerText, entities);
    this.extractProfileFields(text, lowerText, entities);
    this.extractMerchants(text, lowerText, entities);

    // Determine Intent based on keywords and extracted entities
    const { intent, confidence } = this.determineIntent(lowerText, entities);

    return {
      intent,
      entities,
      confidence,
      originalText: text,
    };
  }

  // --- Extraction Strategies ---

  private extractAmounts(text: string, entities: Entity[]): void {
    const matches = text.matchAll(this.patterns.amount);
    for (const match of matches) {
      const rawValue = match[0];
      // Clean non-numeric characters for value
      const value = rawValue.replace(/[^0-9.]/g, '');
      if (value) {
        entities.push({
          type: EntityType.AMOUNT,
          value: value,
          rawValue: rawValue,
          confidence: 0.95,
          context: { index: match.index || 0 }
        });
      }
    }
  }

  private extractAccounts(original: string, lower: string, entities: Entity[]): void {
    const matches = original.matchAll(this.patterns.account);
    const fromIndex = lower.indexOf('from');
    const toIndex = lower.indexOf('to');

    for (const match of matches) {
      const index = match.index || 0;
      let role: 'SOURCE' | 'DESTINATION' | undefined;

      // Heuristic for Source vs Destination based on prepositions
      if (fromIndex !== -1 && index > fromIndex && (toIndex === -1 || index < toIndex)) {
        role = 'SOURCE';
      } else if (toIndex !== -1 && index > toIndex) {
        role = 'DESTINATION';
      }

      entities.push({
        type: EntityType.ACCOUNT,
        value: match[0].toLowerCase(),
        rawValue: match[0],
        confidence: 0.9,
        context: { role, index }
      });
    }
  }

  private extractProfileFields(original: string, lower: string, entities: Entity[]): void {
    const matches = original.matchAll(this.patterns.profile);
    for (const match of matches) {
      entities.push({
        type: EntityType.PROFILE_FIELD,
        value: match[0].toLowerCase(),
        rawValue: match[0],
        confidence: 0.95,
        context: { index: match.index || 0 }
      });
    }
  }

  private extractMerchants(original: string, lower: string, entities: Entity[]): void {
    // In a real system, this would query a merchant database or use Named Entity Recognition (NER)
    const matches = original.matchAll(this.patterns.merchant);
    for (const match of matches) {
      entities.push({
        type: EntityType.MERCHANT,
        value: match[0], // Keep casing for merchants potentially
        rawValue: match[0],
        confidence: 0.8,
        context: { role: 'TARGET', index: match.index || 0 }
      });
    }
  }

  // --- Intent Classification ---

  private determineIntent(text: string, entities: Entity[]): { intent: IntentType; confidence: number } {
    // 1. Reward Linkage (Specific Project Requirement)
    if (this.patterns.rewards.test(text)) {
      return { intent: IntentType.LINK_REWARDS, confidence: 0.95 };
    }

    // 2. Profile / Customer Details
    // "What is my address?", "Show me my email"
    const hasProfileEntity = entities.some(e => e.type === EntityType.PROFILE_FIELD);
    if (hasProfileEntity || /(my\sinfo|my\sprofile|who\sam\si)/.test(text)) {
      return { intent: IntentType.GET_PROFILE, confidence: 0.9 };
    }

    // 3. Products / Account Listing
    // "What accounts do I have?", "List my cards"
    if (/(list|show|what).*(products|cards|accounts)/.test(text) && !/(balance|transaction)/.test(text)) {
      return { intent: IntentType.LIST_PRODUCTS, confidence: 0.85 };
    }

    // 4. Transfers
    // "Transfer 50 from checking to savings"
    if (/(transfer|move|send|wire)/.test(text)) {
      return { intent: IntentType.TRANSFER_FUNDS, confidence: 0.9 };
    }

    // 5. Bill Pay
    // "Pay my bill", "Pay 50 to electric"
    if (/(pay|payment|bill)/.test(text)) {
      return { intent: IntentType.PAY_BILL, confidence: 0.9 };
    }

    // 6. Transactions
    // "Show history", "What did I spend", "Recent transactions"
    if (/(transaction|history|spent|purchases|charges|statement)/.test(text)) {
      return { intent: IntentType.GET_TRANSACTIONS, confidence: 0.9 };
    }

    // 7. Balance
    // "Check balance", "How much money"
    if (/(balance|how\s?much|funds)/.test(text)) {
      return { intent: IntentType.GET_BALANCE, confidence: 0.95 };
    }

    // Default
    return { intent: IntentType.UNKNOWN, confidence: 0.0 };
  }
}