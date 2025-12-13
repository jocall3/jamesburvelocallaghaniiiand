import fs from 'fs';
import path from 'path';

// Assume these functions are defined elsewhere and imported.
// For the purpose of this script, we'll define mock implementations.

// Mock implementation of D1_generateBookContent
// In a real scenario, this would be imported from a seed file.
const D1_generateBookContent = (): Array<{ thematicTitle: string; thematicContent: string }> => {
  const content = [];
  const numberOfPages = 527; // As per the project goal

  for (let i = 1; i <= numberOfPages; i++) {
    content.push({
      thematicTitle: `Chapter ${i}: Thematic Title ${i}`,
      thematicContent: `This is the content for page ${i}. It's a placeholder for now.`,
    });
  }
  return content;
};

// Mock implementation of B1_getThematicTitle
// In a real scenario, this would be imported from a seed file.
const B1_getThematicTitle = (pageNumber: number): string => {
  return `Thematic Title for Page ${pageNumber}`;
};

// Mock implementation of C1_getThematicContent
// In a real scenario, this would be imported from a seed file.
const C1_getThematicContent = (pageNumber: number): string => {
  return `This is the generated content for page ${pageNumber}. It will be more detailed in the actual implementation.`;
};

const generateBookMarkdownStubs = () => {
  const contentDirectory = path.join(__dirname, '..', 'content');
  const numberOfPages = 527; // As per the project goal

  // Ensure the content directory exists
  if (!fs.existsSync(contentDirectory)) {
    fs.mkdirSync(contentDirectory, { recursive: true });
    console.log(`Created directory: ${contentDirectory}`);
  }

  console.log(`Generating ${numberOfPages} markdown files in ${contentDirectory}...`);

  for (let i = 1; i <= numberOfPages; i++) {
    // Use the mock functions to get title and content.
    // In a real scenario, you would call the imported functions.
    // const thematicTitle = B1_getThematicTitle(i);
    // const thematicContent = C1_getThematicContent(i);

    // For this stub generation, we'll use the D1_generateBookContent mock
    // as it provides a structure that can be directly mapped.
    // If D1_generateBookContent was not available, we would use B1 and C1.

    const bookContent = D1_generateBookContent(); // This mock generates all content at once
    const currentPageContent = bookContent[i - 1]; // Adjust index for 0-based array

    const fileName = `page_${String(i).padStart(3, '0')}.md`;
    const filePath = path.join(contentDirectory, fileName);

    const markdownContent = `---
title: "${currentPageContent.thematicTitle}"
date: "2023-10-27T10:00:00.000Z" # Placeholder date, can be dynamic
tags: ["book", "chapter", "${i}"]
---

# ${currentPageContent.thematicTitle}

${currentPageContent.thematicContent}

---
`;

    fs.writeFileSync(filePath, markdownContent, 'utf-8');
    // console.log(`Generated: ${filePath}`);
  }

  console.log(`Successfully generated ${numberOfPages} markdown files.`);
};

// Execute the script if run directly
if (require.main === module) {
  generateBookMarkdownStubs();
}

export { generateBookMarkdownStubs };