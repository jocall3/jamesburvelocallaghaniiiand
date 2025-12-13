/**
 * src/types/book.ts
 *
 * TypeScript interfaces for the book's data structure, including `A1_Chapter` and `A4_Page`,
 * extracted and centralized for better type management.
 */

/**
 * Represents a single page within a chapter of the book.
 * Pages are the fundamental units of content.
 */
export interface A4_Page {
  /**
   * A unique identifier for the page, often derived from its file path or a sequential ID.
   * Example: "chapter1-page1", "introduction-p1"
   */
  id: string;
  /**
   * The title of the page, if applicable. Not all pages might have a distinct title.
   */
  title?: string;
  /**
   * The sequential number of the page within its chapter.
   */
  pageNumber: number;
  /**
   * The actual content of the page, typically in Markdown or plain text format.
   */
  content: string;
  /**
   * Optional metadata for the page, such as creation date, author, tags, etc.
   */
  metadata?: Record<string, any>;
  /**
   * The relative path to the source file for this page, if it's loaded from a file.
   * Example: "src/book/chapter1/page1.md"
   */
  filePath?: string;
}

/**
 * Represents a chapter in the book, which is a collection of pages.
 */
export interface A1_Chapter {
  /**
   * A unique identifier for the chapter.
   * Example: "chapter1", "introduction"
   */
  id: string;
  /**
   * The title of the chapter.
   */
  title: string;
  /**
   * The sequential number of the chapter within the book.
   */
  chapterNumber: number;
  /**
   * An array of pages belonging to this chapter, ordered sequentially.
   */
  pages: A4_Page[];
  /**
   * Optional metadata for the chapter, such as author, publication date, etc.
   */
  metadata?: Record<string, any>;
}

/**
 * Represents the entire book structure, composed of multiple chapters.
 */
export interface Book {
  /**
   * The title of the book.
   */
  title: string;
  /**
   * The author(s) of the book.
   */
  author?: string | string[];
  /**
   * A brief description or synopsis of the book.
   */
  description?: string;
  /**
   * An array of chapters, ordered sequentially.
   */
  chapters: A1_Chapter[];
  /**
   * Optional global metadata for the book.
   */
  metadata?: Record<string, any>;
}