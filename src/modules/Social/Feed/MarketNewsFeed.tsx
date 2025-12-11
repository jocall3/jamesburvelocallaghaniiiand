```typescript
import React, { useState, useEffect } from 'react';
import { Feed } from 'rss-to-json';

interface NewsItem {
    title: string;
    link: string;
    description?: string;
    date: Date;
}

const MarketNewsFeed: React.FC = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const feedUrls = [
        'https://www.marketwatch.com/rss/topstories',
        'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC',
        // Add more feed URLs here
    ];

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            setError(null);

            try {
                const allNews: NewsItem[] = [];

                for (const url of feedUrls) {
                    const feed = await Feed.load(url);

                    if (feed && feed.items) {
                        const items: NewsItem[] = feed.items.map(item => ({
                            title: item.title || 'Untitled',
                            link: item.link || '',
                            description: item.description,
                            date: item.published ? new Date(item.published) : new Date(),
                        }));
                        allNews.push(...items);
                    }
                }
                
                // Sort news by date, newest first
                allNews.sort((a, b) => b.date.getTime() - a.date.getTime());
                setNews(allNews);
            } catch (err: any) {
                console.error("Failed to fetch news:", err);
                setError("Failed to load market news. Please check your internet connection and feed URLs.");
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    if (loading) {
        return <div>Loading Market News...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <h2>Market News</h2>
            {news.length > 0 ? (
                <ul>
                    {news.map((item, index) => (
                        <li key={index}>
                            <a href={item.link} target="_blank" rel="noopener noreferrer">
                                {item.title}
                            </a>
                            {item.description && <p>{item.description.substring(0,100)}...</p>}
                            <small>{item.date.toLocaleDateString()}</small>
                        </li>
                    ))}
                </ul>
            ) : (
                <div>No news available.</div>
            )}
        </div>
    );
};

export default MarketNewsFeed;
```