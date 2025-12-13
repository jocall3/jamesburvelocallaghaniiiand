import { BookContentLoader } from '../utils/bookContentLoader'; // Assuming bookContentLoader is in a utils directory

interface Page {
  id: string;
  content: string;
}

interface Chapter {
  id: string;
  title: string;
  pages: Page[];
}

interface Book {
  id: string;
  title: string;
  chapters: Chapter[];
}

export class BookService {
  private bookContentLoader: BookContentLoader;

  constructor() {
    this.bookContentLoader = new BookContentLoader();
  }

  /**
   * Fetches all books available.
   * In a real-world scenario, this might fetch a list of book IDs or metadata.
   * For this example, we'll assume it fetches a single book for simplicity.
   * @returns A Promise resolving to an array of Book objects.
   */
  async getAllBooks(): Promise<Book[]> {
    // In a real application, this would likely involve an API call to fetch book metadata.
    // For this example, we'll simulate fetching a single book's content.
    try {
      const book = await this.getBookById('sample-book-id'); // Placeholder ID
      return [book];
    } catch (error) {
      console.error('Error fetching all books:', error);
      throw error; // Re-throw to allow calling components to handle errors
    }
  }

  /**
   * Fetches a specific book by its ID.
   * @param bookId The ID of the book to fetch.
   * @returns A Promise resolving to a Book object.
   */
  async getBookById(bookId: string): Promise<Book> {
    // This method abstracts the data fetching logic.
    // It could call an API endpoint like `/api/books/${bookId}`
    // or use a local data source like the BookContentLoader.
    try {
      // For demonstration, we'll use the BookContentLoader.
      // In a production app, this might be an HTTP request.
      const bookData = await this.bookContentLoader.loadBook(bookId);
      return bookData;
    } catch (error) {
      console.error(`Error fetching book with ID ${bookId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches a specific chapter of a book.
   * @param bookId The ID of the book.
   * @param chapterId The ID of the chapter.
   * @returns A Promise resolving to a Chapter object.
   */
  async getChapter(bookId: string, chapterId: string): Promise<Chapter> {
    try {
      const book = await this.getBookById(bookId);
      const chapter = book.chapters.find(ch => ch.id === chapterId);
      if (!chapter) {
        throw new Error(`Chapter with ID ${chapterId} not found in book ${bookId}`);
      }
      return chapter;
    } catch (error) {
      console.error(`Error fetching chapter ${chapterId} for book ${bookId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches a specific page within a chapter of a book.
   * @param bookId The ID of the book.
   * @param chapterId The ID of the chapter.
   * @param pageId The ID of the page.
   * @returns A Promise resolving to a Page object.
   */
  async getPage(bookId: string, chapterId: string, pageId: string): Promise<Page> {
    try {
      const chapter = await this.getChapter(bookId, chapterId);
      const page = chapter.pages.find(pg => pg.id === pageId);
      if (!page) {
        throw new Error(`Page with ID ${pageId} not found in chapter ${chapterId} of book ${bookId}`);
      }
      return page;
    } catch (error) {
      console.error(`Error fetching page ${pageId} for chapter ${chapterId} in book ${bookId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches the next page in a chapter.
   * @param bookId The ID of the book.
   * @param chapterId The ID of the chapter.
   * @param currentPageId The ID of the current page.
   * @returns A Promise resolving to the next Page object, or null if it's the last page.
   */
  async getNextPage(bookId: string, chapterId: string, currentPageId: string): Promise<Page | null> {
    try {
      const chapter = await this.getChapter(bookId, chapterId);
      const currentPageIndex = chapter.pages.findIndex(page => page.id === currentPageId);

      if (currentPageIndex === -1) {
        throw new Error(`Current page with ID ${currentPageId} not found in chapter ${chapterId}`);
      }

      if (currentPageIndex < chapter.pages.length - 1) {
        return chapter.pages[currentPageIndex + 1];
      } else {
        return null; // No next page
      }
    } catch (error) {
      console.error(`Error fetching next page after ${currentPageId} in chapter ${chapterId} of book ${bookId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches the previous page in a chapter.
   * @param bookId The ID of the book.
   * @param chapterId The ID of the chapter.
   * @param currentPageId The ID of the current page.
   * @returns A Promise resolving to the previous Page object, or null if it's the first page.
   */
  async getPreviousPage(bookId: string, chapterId: string, currentPageId: string): Promise<Page | null> {
    try {
      const chapter = await this.getChapter(bookId, chapterId);
      const currentPageIndex = chapter.pages.findIndex(page => page.id === currentPageId);

      if (currentPageIndex === -1) {
        throw new Error(`Current page with ID ${currentPageId} not found in chapter ${chapterId}`);
      }

      if (currentPageIndex > 0) {
        return chapter.pages[currentPageIndex - 1];
      } else {
        return null; // No previous page
      }
    } catch (error) {
      console.error(`Error fetching previous page before ${currentPageId} in chapter ${chapterId} of book ${bookId}:`, error);
      throw error;
    }
  }
}