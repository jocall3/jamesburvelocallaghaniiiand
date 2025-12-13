import { BookService } from '../../services/bookService';
import { Book } from '../../models/book';
import { BookRepository } from '../../repositories/bookRepository';

// Mock the BookRepository to isolate the BookService
jest.mock('../../repositories/bookRepository');

describe('BookService', () => {
  let bookService: BookService;
  let mockBookRepository: jest.Mocked<BookRepository>;

  beforeEach(() => {
    mockBookRepository = new BookRepository() as jest.Mocked<BookRepository>;
    bookService = new BookService(mockBookRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve all books', async () => {
    const mockBooks: Book[] = [
      { id: '1', title: 'Book 1', author: 'Author 1', genre: 'Fiction', publicationYear: 2020 },
      { id: '2', title: 'Book 2', author: 'Author 2', genre: 'Non-Fiction', publicationYear: 2022 },
    ];
    mockBookRepository.getAll.mockResolvedValue(mockBooks);

    const books = await bookService.getAllBooks();

    expect(books).toEqual(mockBooks);
    expect(mockBookRepository.getAll).toHaveBeenCalledTimes(1);
  });

  it('should retrieve a book by ID', async () => {
    const mockBook: Book = { id: '1', title: 'Book 1', author: 'Author 1', genre: 'Fiction', publicationYear: 2020 };
    mockBookRepository.getById.mockResolvedValue(mockBook);

    const book = await bookService.getBookById('1');

    expect(book).toEqual(mockBook);
    expect(mockBookRepository.getById).toHaveBeenCalledWith('1');
    expect(mockBookRepository.getById).toHaveBeenCalledTimes(1);
  });

  it('should return null if book is not found by ID', async () => {
    mockBookRepository.getById.mockResolvedValue(null);

    const book = await bookService.getBookById('nonexistent-id');

    expect(book).toBeNull();
    expect(mockBookRepository.getById).toHaveBeenCalledWith('nonexistent-id');
    expect(mockBookRepository.getById).toHaveBeenCalledTimes(1);
  });

  it('should create a new book', async () => {
    const newBookData: Omit<Book, 'id'> = { title: 'New Book', author: 'New Author', genre: 'Mystery', publicationYear: 2023 };
    const mockCreatedBook: Book = { id: '3', ...newBookData };
    mockBookRepository.create.mockResolvedValue(mockCreatedBook);

    const createdBook = await bookService.createBook(newBookData);

    expect(createdBook).toEqual(mockCreatedBook);
    expect(mockBookRepository.create).toHaveBeenCalledWith(newBookData);
    expect(mockBookRepository.create).toHaveBeenCalledTimes(1);
  });

  it('should update an existing book', async () => {
    const bookId = '1';
    const updateData: Partial<Omit<Book, 'id'>> = { title: 'Updated Title' };
    const mockUpdatedBook: Book = { id: bookId, title: 'Updated Title', author: 'Author 1', genre: 'Fiction', publicationYear: 2020 };
    mockBookRepository.update.mockResolvedValue(mockUpdatedBook);

    const updatedBook = await bookService.updateBook(bookId, updateData);

    expect(updatedBook).toEqual(mockUpdatedBook);
    expect(mockBookRepository.update).toHaveBeenCalledWith(bookId, updateData);
    expect(mockBookRepository.update).toHaveBeenCalledTimes(1);
  });

  it('should delete a book', async () => {
    mockBookRepository.delete.mockResolvedValue(true);

    const result = await bookService.deleteBook('1');

    expect(result).toBe(true);
    expect(mockBookRepository.delete).toHaveBeenCalledWith('1');
    expect(mockBookRepository.delete).toHaveBeenCalledTimes(1);
  });

  it('should return false if deleting a book fails', async () => {
    mockBookRepository.delete.mockResolvedValue(false);

    const result = await bookService.deleteBook('nonexistent-id');

    expect(result).toBe(false);
    expect(mockBookRepository.delete).toHaveBeenCalledWith('nonexistent-id');
    expect(mockBookRepository.delete).toHaveBeenCalledTimes(1);
  });

  it('should search books by title', async () => {
    const searchTerm = 'Book';
    const mockSearchResults: Book[] = [
      { id: '1', title: 'Book 1', author: 'Author 1', genre: 'Fiction', publicationYear: 2020 },
      { id: '2', title: 'Another Book', author: 'Author 3', genre: 'Thriller', publicationYear: 2021 },
    ];
    mockBookRepository.search.mockResolvedValue(mockSearchResults);

    const searchResults = await bookService.searchBooks(searchTerm);

    expect(searchResults).toEqual(mockSearchResults);
    expect(mockBookRepository.search).toHaveBeenCalledWith(searchTerm);
    expect(mockBookRepository.search).toHaveBeenCalledTimes(1);
  });
});