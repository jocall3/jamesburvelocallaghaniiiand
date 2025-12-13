import request from 'supertest';
import { app } from '../../../src/app'; // Assuming your main app instance is exported from app.ts
import { setupTestDB, closeTestDB } from '../../setupTests'; // Assuming you have setup/teardown utilities
import Book from '../../../src/models/Book';
import Chapter from '../../../src/models/Chapter';
import User from '../../../src/models/User';
import { generateAuthToken } from '../../../src/utils/auth';

// Mock data setup
let testBook: any;
let testChapters: any[];
let authToken: string;

describe('GET /api/book/:bookId/chapters', () => {
  beforeAll(async () => {
    await setupTestDB();

    // 1. Create a User and get a token
    const user = await User.create({
      email: 'testuser@example.com',
      password: 'password123',
      name: 'Test User',
    });
    authToken = generateAuthToken(user._id.toString());

    // 2. Create a Book
    testBook = await Book.create({
      title: 'The Great Test Book',
      author: user._id,
      isPublished: true,
    });

    // 3. Create Chapters for the book
    const chaptersData = [
      { bookId: testBook._id, title: 'Chapter 1: Introduction', pageStart: 1, pageEnd: 20 },
      { bookId: testBook._id, title: 'Chapter 2: Development', pageStart: 21, pageEnd: 50 },
      { bookId: testBook._id, title: 'Chapter 3: Conclusion', pageStart: 51, pageEnd: 75 },
    ];
    testChapters = await Chapter.insertMany(chaptersData);
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('should return 200 and all chapters for a valid book ID', async () => {
    const response = await request(app)
      .get(`/api/book/${testBook._id}/chapters`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(testChapters.length);

    // Check structure and content
    const chapterIds = response.body.map((c: any) => c._id.toString());
    expect(chapterIds).toEqual(testChapters.map(c => c._id.toString()));
    expect(response.body[0].title).toBe('Chapter 1: Introduction');
    expect(response.body[0].pageStart).toBe(1);
  });

  it('should return 200 and an empty array if the book has no chapters', async () => {
    // Create a new book with no chapters
    const emptyBook = await Book.create({
      title: 'Empty Book',
      author: (await User.findOne())._id,
      isPublished: true,
    });

    const response = await request(app)
      .get(`/api/book/${emptyBook._id}/chapters`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return 404 if the book ID does not exist', async () => {
    const nonExistentBookId = '60d5ec49f8c3a40015f00000'; // A clearly invalid/non-existent ID format

    const response = await request(app)
      .get(`/api/book/${nonExistentBookId}/chapters`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message', 'Book not found.');
  });

  it('should return 400 if the book ID is invalid (malformed ObjectId)', async () => {
    const invalidBookId = '12345';

    const response = await request(app)
      .get(`/api/book/${invalidBookId}/chapters`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid Book ID format.');
  });

  it('should return 401 if no authorization token is provided', async () => {
    const response = await request(app)
      .get(`/api/book/${testBook._id}/chapters`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('message', 'Not authorized, no token');
  });
});