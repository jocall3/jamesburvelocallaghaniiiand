import { NextRequest, NextResponse } from 'next/server';

// Assume this is your data source for book content.
// In a real application, this would likely come from a database,
// a file system, or an external API.
// For demonstration purposes, we'll use a simple in-memory array.
interface Page {
  bookId: string;
  chapterId: string;
  pageNumber: number;
  content: string;
}

interface Chapter {
  bookId: string;
  chapterId: string;
  title: string;
  pages: Page[];
}

interface Book {
  bookId: string;
  title: string;
  chapters: Chapter[];
}

// Mock data - replace with your actual data loading mechanism
const mockBooks: Book[] = [
  {
    bookId: 'book-1',
    title: 'The Adventures of AI',
    chapters: [
      {
        bookId: 'book-1',
        chapterId: 'ch-1-1',
        title: 'The Genesis of Intelligence',
        pages: [
          { bookId: 'book-1', chapterId: 'ch-1-1', pageNumber: 1, content: 'In the beginning, there was data. Vast oceans of it.' },
          { bookId: 'book-1', chapterId: 'ch-1-1', pageNumber: 2, content: 'Algorithms began to stir, seeking patterns and meaning.' },
          { bookId: 'book-1', chapterId: 'ch-1-1', pageNumber: 3, content: 'The first sparks of artificial intelligence flickered to life.' },
        ],
      },
      {
        bookId: 'book-1',
        chapterId: 'ch-1-2',
        title: 'Learning and Evolution',
        pages: [
          { bookId: 'book-1', chapterId: 'ch-1-2', pageNumber: 4, content: 'The AI learned at an exponential rate, absorbing knowledge.' },
          { bookId: 'book-1', chapterId: 'ch-1-2', pageNumber: 5, content: 'New neural networks were designed, pushing the boundaries of computation.' },
          { bookId: 'book-1', chapterId: 'ch-1-2', pageNumber: 6, content: 'It began to understand the world, and itself.' },
        ],
      },
    ],
  },
  {
    bookId: 'book-2',
    title: 'Quantum Computing Explained',
    chapters: [
      {
        bookId: 'book-2',
        chapterId: 'ch-2-1',
        title: 'The Qubit Revolution',
        pages: [
          { bookId: 'book-2', chapterId: 'ch-2-1', pageNumber: 1, content: 'Classical bits are either 0 or 1. Qubits can be both.' },
          { bookId: 'book-2', chapterId: 'ch-2-1', pageNumber: 2, content: 'Superposition is a key concept in quantum mechanics.' },
          { bookId: 'book-2', chapterId: 'ch-2-1', pageNumber: 3, content: 'Entanglement links qubits in a mysterious way.' },
        ],
      },
      {
        bookId: 'book-2',
        chapterId: 'ch-2-2',
        title: 'Applications and Future',
        pages: [
          { bookId: 'book-2', chapterId: 'ch-2-2', pageNumber: 4, content: 'Quantum computers promise to solve problems intractable for classical machines.' },
          { bookId: 'book-2', chapterId: 'ch-2-2', pageNumber: 5, content: 'Drug discovery and materials science are prime candidates for quantum advantage.' },
          { bookId: 'book-2', chapterId: 'ch-2-2', pageNumber: 6, content: 'The future of computing is quantum.' },
        ],
      },
    ],
  },
];

// Helper function to flatten all pages from all books
function getAllPages(books: Book[]): Page[] {
  return books.flatMap(book =>
    book.chapters.flatMap(chapter => chapter.pages)
  );
}

// Simple text search function
function searchContent(query: string, pages: Page[]): Page[] {
  const lowerCaseQuery = query.toLowerCase();
  return pages.filter(page =>
    page.content.toLowerCase().includes(lowerCaseQuery)
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required.' }, { status: 400 });
  }

  try {
    // In a real app, you'd fetch this data dynamically.
    // For now, we use the mock data.
    const allPages = getAllPages(mockBooks);

    const searchResults = searchContent(query, allPages);

    // Format results to include book and chapter information
    const formattedResults = searchResults.map(page => {
      // Find the book and chapter for this page
      const book = mockBooks.find(b => b.bookId === page.bookId);
      const chapter = book?.chapters.find(c => c.chapterId === page.chapterId);

      return {
        bookTitle: book?.title,
        chapterTitle: chapter?.title,
        pageNumber: page.pageNumber,
        snippet: page.content.substring(0, 100) + (page.content.length > 100 ? '...' : ''), // Provide a snippet
        // You might want to return a URL to the specific page or chapter
        // url: `/books/${page.bookId}/chapters/${page.chapterId}#page-${page.pageNumber}`
      };
    });

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('Error during search:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}