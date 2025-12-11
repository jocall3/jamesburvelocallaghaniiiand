```typescript
import { Injectable } from '@nestjs/common';

interface NewsItem {
  title: string;
  link: string;
  summary: string;
  source: string;
  publishedDate: Date;
}

@Injectable()
export class NewsAggregator {
  private aggregatedNews: NewsItem[] = [];
  private readonly titleSimilarityThreshold = 0.8; // Adjust as needed
  private readonly summarySimilarityThreshold = 0.9; // Adjust as needed

  async aggregateNews(newsItems: NewsItem[]): Promise<NewsItem[]> {
    for (const newItem of newsItems) {
      if (!this.isDuplicate(newItem)) {
        this.aggregatedNews.push(newItem);
      }
    }
    return this.aggregatedNews;
  }

  getAggregatedNews(): NewsItem[] {
    return this.aggregatedNews;
  }

  private isDuplicate(newItem: NewsItem): boolean {
    for (const existingItem of this.aggregatedNews) {
      // Simple title and summary similarity check (can be improved with NLP techniques)
      const titleSimilarity = this.stringSimilarity(newItem.title, existingItem.title);
      const summarySimilarity = this.stringSimilarity(newItem.summary, existingItem.summary);

      if (titleSimilarity > this.titleSimilarityThreshold && summarySimilarity > this.summarySimilarityThreshold) {
        return true; // Consider it a duplicate if both title and summary are similar enough
      }
    }
    return false;
  }

  // A simple string similarity function (e.g., using Sørensen–Dice coefficient)
  private stringSimilarity(str1: string, str2: string): number {
    if (str1 === null || str1 === undefined || str2 === null || str2 === undefined) {
      return 0;
    }

    const set1 = new Set(str1.toLowerCase().split(' '));
    const set2 = new Set(str2.toLowerCase().split(' '));

    const intersectionSize = new Set([...set1].filter(x => set2.has(x))).size;
    const unionSize = new Set([...set1, ...set2]).size;

    return intersectionSize / unionSize;
  }

  clearAggregatedNews(): void {
    this.aggregatedNews = [];
  }
}
```