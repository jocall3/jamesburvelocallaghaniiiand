import React from 'react';

// Define the Chapter interface
interface Chapter {
  id: string;
  title: string;
  slug: string; // Unique slug for navigation, often used in URLs
}

// Define the props for the ChapterList component
interface ChapterListProps {
  chapters: Chapter[];
  currentChapterSlug: string | null; // The slug of the currently active chapter
  onSelectChapter: (slug: string) => void; // Callback when a chapter is clicked
}

/**
 * A component that displays a list of chapters, allowing users to navigate through the book's structure.
 *
 * @param {ChapterListProps} props - The props for the ChapterList component.
 * @param {Chapter[]} props.chapters - An array of chapter objects to display.
 * @param {string | null} props.currentChapterSlug - The slug of the chapter that is currently active/selected.
 * @param {(slug: string) => void} props.onSelectChapter - A callback function invoked when a chapter is clicked,
 *                                                        receiving the slug of the selected chapter.
 */
const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  currentChapterSlug,
  onSelectChapter,
}) => {
  return (
    <nav
      aria-label="Book Chapters"
      className="w-full h-full overflow-y-auto bg-gray-800 text-white p-4 shadow-lg flex flex-col"
    >
      <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2 text-gray-100">
        Chapters
      </h2>
      <ul className="flex-grow space-y-2">
        {chapters.length === 0 ? (
          <li className="text-gray-400 italic py-2 px-3">No chapters available.</li>
        ) : (
          chapters.map((chapter) => (
            <li key={chapter.id}>
              <button
                type="button"
                onClick={() => onSelectChapter(chapter.slug)}
                className={`
                  block w-full text-left py-2 px-3 rounded-lg transition-colors duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75
                  ${
                    currentChapterSlug === chapter.slug
                      ? 'bg-blue-600 text-white font-semibold shadow-md'
                      : 'text-gray-200 hover:bg-gray-700 hover:text-white'
                  }
                `}
                aria-current={currentChapterSlug === chapter.slug ? 'page' : undefined}
              >
                {chapter.title}
              </button>
            </li>
          ))
        )}
      </ul>
    </nav>
  );
};

export default ChapterList;