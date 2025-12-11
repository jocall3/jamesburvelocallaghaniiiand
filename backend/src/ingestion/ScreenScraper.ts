```typescript
import puppeteer, { Browser, Page } from 'puppeteer';
import { load } from 'cheerio';

export class ScreenScraper {

    private browser: Browser | null = null;

    async initialize(): Promise<void> {
        this.browser = await puppeteer.launch({
            headless: "new", // or 'new' for a modern experience
            // Add any other necessary launch options here, such as:
            // executablePath: '/path/to/chrome',
            // args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    async scrapeWebsite(url: string, selector?: string): Promise<string | null> {
        if (!this.browser) {
            throw new Error('ScreenScraper not initialized. Call initialize() first.');
        }

        let page: Page | null = null;

        try {
            page = await this.browser.newPage();
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            if (selector) {
                await page.waitForSelector(selector, { timeout: 30000 });
            }
            
            // Handle potential iframe scraping
            let content = await page.content();
            const $ = load(content);

            if ($('iframe').length > 0) {
                // Iterate through iframes and attempt to scrape content
                const iframeContents: string[] = [];
                for (const iframe of $('iframe').toArray()) {
                    const iframeSrc = $(iframe).attr('src');
                    if (iframeSrc) {
                        try {
                            const iframePage = await this.browser.newPage();
                            await iframePage.goto(iframeSrc, { waitUntil: 'domcontentloaded', timeout: 30000 });
                            iframeContents.push(await iframePage.content());
                            await iframePage.close();
                        } catch (iframeError) {
                            console.error(`Error scraping iframe ${iframeSrc}:`, iframeError);
                        }
                    }
                }

                // Combine iframe contents (you may need more sophisticated logic here)
                content = content + iframeContents.join('\n');


            }

            return content;


        } catch (error) {
            console.error(`Error scraping ${url}:`, error);
            return null;
        } finally {
            if (page) {
                try {
                    await page.close(); // Close the page in the finally block
                } catch (closeError) {
                    console.error("Error closing page:", closeError); // Handle page closing errors
                }
            }
        }
    }

    /**
     * Extract text content from a given HTML string using a specified CSS selector.
     * @param html The HTML string to parse.
     * @param selector The CSS selector used to target the desired element(s).
     * @returns A string containing the concatenated text content of the matched elements, or null if an error occurs.
     */
    extractText(html: string, selector: string): string | null {
        try {
            const $ = load(html);
            let text = '';
            $(selector).each((index, element) => {
                text += $(element).text().trim() + ' ';
            });
            return text.trim();
        } catch (error) {
            console.error("Error extracting text:", error);
            return null;
        }
    }

    /**
     * Extract data from a website by scraping its content and then extracting text
     * using a CSS selector.
     *
     * @param url The URL of the website to scrape.
     * @param selector The CSS selector to use for extracting text from the scraped HTML.
     * @returns A Promise that resolves with the extracted text as a string, or null if
     *          scraping or extraction fails.
     */
    async scrapeAndExtract(url: string, selector: string): Promise<string | null> {
        try {
            const htmlContent = await this.scrapeWebsite(url);
            if (!htmlContent) {
                console.warn(`Failed to scrape content from ${url}`);
                return null;
            }
            return this.extractText(htmlContent, selector);
        } catch (error) {
            console.error(`Error scraping and extracting from ${url}:`, error);
            return null;
        }
    }
}
```