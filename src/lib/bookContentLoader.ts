import fs from 'fs';
import path from 'path';

// Define the structure for a chapter
interface A1_Chapter {
  title: string;
  sections: A1_Section[];
}

// Define the structure for a section within a chapter
interface A1_Section {
  title: string;
  content: string;
}

/**
 * Reads and aggregates individual markdown files into the structured A1_Chapter[] format.
 * This utility replaces the in-memory D1_generateBookContent.
 *
 * Assumes a directory structure like:
 *
 * book/
 *   chapter1/
 *     section1.md
 *     section2.md
 *   chapter2/
 *     section1.md
 *
 * Each markdown file's content will be treated as the section's content.
 * The directory names will be used as chapter titles.
 * The markdown file names (without extension) will be used as section titles.
 *
 * @param bookDirectoryPath The absolute path to the root directory of the book's markdown files.
 * @returns A promise that resolves to an array of A1_Chapter objects.
 */
export async function loadBookContent(bookDirectoryPath: string): Promise<A1_Chapter[]> {
  const bookContent: A1_Chapter[] = [];

  try {
    const chapterDirectories = await fs.promises.readdir(bookDirectoryPath, { withFileTypes: true });

    for (const chapterDir of chapterDirectories) {
      if (chapterDir.isDirectory()) {
        const chapterPath = path.join(bookDirectoryPath, chapterDir.name);
        const chapterTitle = chapterDir.name.replace(/_/g, ' '); // Basic title formatting

        const chapter: A1_Chapter = {
          title: chapterTitle,
          sections: [],
        };

        const sectionFiles = await fs.promises.readdir(chapterPath, { withFileTypes: true });

        for (const sectionFile of sectionFiles) {
          if (sectionFile.isFile() && sectionFile.name.endsWith('.md')) {
            const sectionFilePath = path.join(chapterPath, sectionFile.name);
            const sectionTitle = path.basename(sectionFile.name, '.md').replace(/_/g, ' '); // Basic title formatting

            try {
              const content = await fs.promises.readFile(sectionFilePath, 'utf-8');
              chapter.sections.push({
                title: sectionTitle,
                content: content,
              });
            } catch (readError) {
              console.error(`Error reading section file ${sectionFilePath}:`, readError);
              // Decide how to handle read errors: skip section, throw, etc.
              // For now, we'll just log and continue.
            }
          }
        }
        // Only add the chapter if it has at least one section
        if (chapter.sections.length > 0) {
          bookContent.push(chapter);
        }
      }
    }
  } catch (dirError) {
    console.error(`Error reading book directory ${bookDirectoryPath}:`, dirError);
    throw new Error(`Failed to load book content from ${bookDirectoryPath}. See console for details.`);
  }

  return bookContent;
}

// Example usage (for testing or demonstration purposes, not part of the exported module)
/*
async function main() {
  const bookPath = path.resolve(__dirname, '../book'); // Adjust path as needed
  try {
    const content = await loadBookContent(bookPath);
    console.log(JSON.stringify(content, null, 2));
  } catch (error) {
    console.error('Failed to load book:', error);
  }
}

if (require.main === module) {
  main();
}
*/