import { useState, useEffect, useCallback } from 'react';
import { bookService } from '../services/bookService';

interface PageData {
  content: string;
  // Add any other relevant page properties here
}

interface ChapterData {
  id: string;
  title: string;
  pages: PageData[];
  // Add any other relevant chapter properties here
}

interface BookDataState {
  chapters: ChapterData[];
  currentPage: PageData | null;
  currentChapterId: string | null;
  isLoading: boolean;
  error: Error | null;
}

const initialState: BookDataState = {
  chapters: [],
  currentPage: null,
  currentChapterId: null,
  isLoading: true,
  error: null,
};

export const useBookData = (bookId: string) => {
  const [state, setState] = useState<BookDataState>(initialState);

  const fetchBookData = useCallback(async () => {
    setState((prevState) => ({ ...prevState, isLoading: true, error: null }));
    try {
      const bookData = await bookService.getBookChapters(bookId);
      setState((prevState) => ({
        ...prevState,
        chapters: bookData,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching book data:', error);
      setState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error : new Error('An unknown error occurred'),
      }));
    }
  }, [bookId]);

  useEffect(() => {
    fetchBookData();
  }, [fetchBookData]);

  const selectPage = useCallback(
    (chapterId: string, pageIndex: number) => {
      const chapter = state.chapters.find((ch) => ch.id === chapterId);
      if (chapter && chapter.pages && chapter.pages.length > pageIndex) {
        setState((prevState) => ({
          ...prevState,
          currentPage: chapter.pages[pageIndex],
          currentChapterId: chapterId,
        }));
      } else {
        console.warn(`Page not found: Chapter ID ${chapterId}, Page Index ${pageIndex}`);
        setState((prevState) => ({
          ...prevState,
          currentPage: null,
          currentChapterId: chapterId,
        }));
      }
    },
    [state.chapters]
  );

  const goToNextPage = useCallback(() => {
    if (!state.currentChapterId || !state.chapters.length) return;

    const currentChapterIndex = state.chapters.findIndex(
      (ch) => ch.id === state.currentChapterId
    );
    if (currentChapterIndex === -1) return;

    const currentChapter = state.chapters[currentChapterIndex];
    const currentPageIndex = currentChapter.pages.findIndex(
      (page) => page === state.currentPage
    );

    if (currentPageIndex === -1) {
      // If current page is not found, try to go to the first page of the current chapter
      if (currentChapter.pages && currentChapter.pages.length > 0) {
        setState((prevState) => ({
          ...prevState,
          currentPage: currentChapter.pages[0],
        }));
      }
      return;
    }

    const nextPage = currentChapter.pages[currentPageIndex + 1];

    if (nextPage) {
      setState((prevState) => ({
        ...prevState,
        currentPage: nextPage,
      }));
    } else {
      // Move to the next chapter if available
      const nextChapterIndex = currentChapterIndex + 1;
      if (state.chapters[nextChapterIndex] && state.chapters[nextChapterIndex].pages && state.chapters[nextChapterIndex].pages.length > 0) {
        setState((prevState) => ({
          ...prevState,
          currentChapterId: state.chapters[nextChapterIndex].id,
          currentPage: state.chapters[nextChapterIndex].pages[0],
        }));
      }
    }
  }, [state.chapters, state.currentPage, state.currentChapterId]);

  const goToPreviousPage = useCallback(() => {
    if (!state.currentChapterId || !state.chapters.length) return;

    const currentChapterIndex = state.chapters.findIndex(
      (ch) => ch.id === state.currentChapterId
    );
    if (currentChapterIndex === -1) return;

    const currentChapter = state.chapters[currentChapterIndex];
    const currentPageIndex = currentChapter.pages.findIndex(
      (page) => page === state.currentPage
    );

    if (currentPageIndex === -1) {
      // If current page is not found, try to go to the last page of the current chapter
      if (currentChapter.pages && currentChapter.pages.length > 0) {
        setState((prevState) => ({
          ...prevState,
          currentPage: currentChapter.pages[currentChapter.pages.length - 1],
        }));
      }
      return;
    }

    const previousPage = currentChapter.pages[currentPageIndex - 1];

    if (previousPage) {
      setState((prevState) => ({
        ...prevState,
        currentPage: previousPage,
      }));
    } else {
      // Move to the previous chapter if available
      const previousChapterIndex = currentChapterIndex - 1;
      if (state.chapters[previousChapterIndex] && state.chapters[previousChapterIndex].pages && state.chapters[previousChapterIndex].pages.length > 0) {
        setState((prevState) => ({
          ...prevState,
          currentChapterId: state.chapters[previousChapterIndex].id,
          currentPage: state.chapters[previousChapterIndex].pages[state.chapters[previousChapterIndex].pages.length - 1],
        }));
      }
    }
  }, [state.chapters, state.currentPage, state.currentChapterId]);

  const resetBookState = useCallback(() => {
    setState(initialState);
    fetchBookData(); // Re-fetch data on reset
  }, [fetchBookData]);

  return {
    chapters: state.chapters,
    currentPage: state.currentPage,
    currentChapterId: state.currentChapterId,
    isLoading: state.isLoading,
    error: state.error,
    selectPage,
    goToNextPage,
    goToPreviousPage,
    resetBookState,
    refetchBookData: fetchBookData, // Expose refetch for manual refresh
  };
};