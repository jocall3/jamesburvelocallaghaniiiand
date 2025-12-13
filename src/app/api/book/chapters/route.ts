import { NextResponse } from 'next/server';

// In a real application, this data would likely come from a database,
// a CMS, or a file system. For this example, we'll use a static array.
// Each chapter object should have at least an 'id' and a 'title'.
// The 'id' will be used for routing to individual chapter pages.
const chapters = [
  { id: 1, title: "The Beginning" },
  { id: 2, title: "A New Journey" },
  { id: 3, title: "The First Obstacle" },
  { id: 4, title: "A Moment of Reflection" },
  { id: 5, title: "The Path Ahead" },
  { id: 6, title: "Unexpected Allies" },
  { id: 7, title: "Whispers of the Past" },
  { id: 8, title: "The Looming Shadow" },
  { id: 9, title: "A Test of Courage" },
  { id: 10, title: "The Crossroads" },
  // ... and so on, up to 500 chapters
];

/**
 * @swagger
 * /api/book/chapters:
 *   get:
 *     summary: Get a list of all book chapters.
 *     description: Fetches a list of all chapters in the book, typically used for a table of contents.
 *     responses:
 *       200:
 *         description: A JSON array of chapter objects.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The unique identifier for the chapter.
 *                   title:
 *                     type: string
 *                     description: The title of the chapter.
 *       500:
 *         description: Internal server error.
 */
export async function GET() {
  try {
    // In a real-world scenario, you might fetch this data from a database.
    // For this example, we're returning a static list.
    // We're only returning the id and title, as that's typically what's needed
    // for a table of contents.
    const chapterList = chapters.map(chapter => ({
      id: chapter.id,
      title: chapter.title,
    }));

    return NextResponse.json(chapterList);
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json({ message: "Failed to fetch chapters" }, { status: 500 });
  }
}