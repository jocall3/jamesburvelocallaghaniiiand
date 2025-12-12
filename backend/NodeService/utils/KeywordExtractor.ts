import natural from 'natural';

export class KeywordExtractor {
  private tokenizer: natural.WordTokenizer;
  private stopwords: Set<string>;

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stopwords = new Set([
      'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
      'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
      'can', 'did', 'do', 'does', 'doing', 'don', 'down', 'during',
      'each',
      'few', 'for', 'from', 'further',
      'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
      'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
      'just',
      'me', 'more', 'most', 'my', 'myself',
      'no', 'nor', 'not', 'now',
      'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
      's', 'same', 'she', 'should', 'so', 'some', 'such',
      't', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
      'this', 'those', 'through', 'to', 'too',
      'under', 'until', 'up',
      'very',
      'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with',
      'you', 'your', 'yours', 'yourself', 'yourselves',
      // Add common blockchain/transaction related stopwords
      'transaction', 'tx', 'hash', 'address', 'contract', 'token', 'tokens', 'transfer', 'event', 'blockchain'
    ]);
  }

  public extractKeywords(text: string, topN: number = 5): string[] {
    if (!text) {
      return [];
    }

    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    const filteredTokens = tokens.filter(token => !this.stopwords.has(token) && token.length > 2 && /^[a-z]+$/.test(token)); // Remove short, numeric, or mixed tokens
    const frequencyMap: { [key: string]: number } = {};

    for (const token of filteredTokens) {
      frequencyMap[token] = (frequencyMap[token] || 0) + 1;
    }

    const sortedKeywords = Object.entries(frequencyMap)
      .sort(([, freqA], [, freqB]) => freqB - freqA)
      .map(([keyword]) => keyword)
      .slice(0, topN);

    return sortedKeywords;
  }

  public generateSearchQuery(keywords: string[]): string {
      return keywords.join(' ');
  }
}