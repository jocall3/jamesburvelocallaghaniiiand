import { NextResponse } from 'next/server';

// In a real application, this data would come from a database or a more sophisticated data source.
// For demonstration purposes, we'll use a simple in-memory array.
const mockBookPages = Array.from({ length: 500 }, (_, i) => ({
  id: (i + 1).toString(),
  title: `Page ${i + 1}`,
  content: `This is the detailed content for page number ${i + 1}. It contains various information, stories, and descriptions that make up the book. Each page is unique and contributes to the overall narrative.`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

/**
 * @swagger
 * /api/book/pages/{pageId}:
 *   get:
 *     summary: Get detailed content of a specific book page
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the book page to retrieve.
 *     responses:
 *       200:
 *         description: Detailed content of the book page.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The unique identifier of the page.
 *                 title:
 *                   type: string
 *                   description: The title of the page.
 *                 content:
 *                   type: string
 *                   description: The detailed content of the page.
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: The timestamp when the page was created.
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: The timestamp when the page was last updated.
 *       404:
 *         description: Book page not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Book page not found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred."
 */
export async function GET(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  const { pageId } = params;

  try {
    const page = mockBookPages.find((p) => p.id === pageId);

    if (!page) {
      return NextResponse.json({ message: 'Book page not found.' }, { status: 404 });
    }

    return NextResponse.json(page, { status: 200 });
  } catch (error) {
    console.error('Error fetching book page:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}