import { NextResponse } from 'next/server';
import { mockBookData } from '@/data/mockBookData'; // Assuming mock data structure exists

// Define the structure for a single page (simplified for this example)
interface Page {
  id: number;
  content: string;
  pageNumber: number;
}

// Define the structure for a chapter
interface Chapter {
  id: number;
  title: string;
  pages: Page[];
}

/**
 * API route handler for fetching a specific chapter by its ID.
 *
 * @param request The incoming request object.
 * @param params Parameters from the URL, expected to contain 'chapterId'.
 * @returns A JSON response containing the chapter details or an error message.
 */
export async function GET(
  request: Request,
  { params }: { params: { chapterId: string } }
) {
  const chapterIdString = params.chapterId;

  // 1. Input Validation
  if (!chapterIdString) {
    return NextResponse.json(
      { error: 'Chapter ID is required in the URL path.' },
      { status: 400 }
    );
  }

  const chapterId = parseInt(chapterIdString, 10);

  if (isNaN(chapterId)) {
    return NextResponse.json(
      { error: 'Invalid Chapter ID format. Must be an integer.' },
      { status: 400 }
    );
  }

  // 2. Data Fetching (Simulated using mock data)
  const bookData: { chapters: Chapter[] } = mockBookData;

  const chapter = bookData.chapters.find(
    (chap) => chap.id === chapterId
  );

  // 3. Response Handling
  if (!chapter) {
    return NextResponse.json(
      { error: `Chapter with ID ${chapterId} not found.` },
      { status: 404 }
    );
  }

  // Structure the response data as required: title and list of pages
  const responseData = {
    id: chapter.id,
    title: chapter.title,
    pages: chapter.pages.map(page => ({
      id: page.id,
      pageNumber: page.pageNumber,
      // In a real application, you might fetch the actual content here,
      // but for this endpoint, we return the basic page structure.
    })),
  };

  return NextResponse.json(responseData, { status: 200 });
}

// Optional: Implement HEAD request if needed for checking existence without payload
export async function HEAD(
  request: Request,
  { params }: { params: { chapterId: string } }
) {
    const chapterIdString = params.chapterId;

    if (!chapterIdString) {
        return new Response(null, { status: 400 });
    }

    const chapterId = parseInt(chapterIdString, 10);

    if (isNaN(chapterId)) {
        return new Response(null, { status: 400 });
    }

    const bookData: { chapters: Chapter[] } = mockBookData;
    const chapterExists = bookData.chapters.some(chap => chap.id === chapterId);

    if (chapterExists) {
        return new Response(null, { status: 200 });
    }

    return new Response(null, { status: 404 });
}