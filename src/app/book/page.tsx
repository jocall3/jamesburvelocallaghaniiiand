"use client";

import Link from "next/link";
import { Fragment } from "react";

// Assuming you have a way to generate or fetch chapter data.
// For this example, we'll create a placeholder array.
// In a real application, this might come from a CMS, a Markdown file, or a database.

interface Chapter {
  id: string;
  title: string;
  description: string;
  slug: string;
}

// Placeholder for chapter data. In a real app, this would be dynamic.
// We'll simulate 500 chapters for demonstration.
const generateChapters = (count: number): Chapter[] => {
  const chapters: Chapter[] = [];
  for (let i = 1; i <= count; i++) {
    chapters.push({
      id: `chapter-${i}`,
      title: `Chapter ${i}: The Journey Begins`,
      description: `This chapter explores the initial stages of our grand adventure, setting the scene for what's to come.`,
      slug: `chapter-${i}`,
    });
  }
  return chapters;
};

const allChapters = generateChapters(500);

export default function TableOfContents() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800 dark:text-gray-200">
        The Grand Chronicle: Table of Contents
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allChapters.map((chapter) => (
          <Fragment key={chapter.id}>
            <Link
              href={`/book/${chapter.slug}`}
              className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400"
            >
              <h2 className="text-2xl font-semibold mb-2 text-blue-700 dark:text-blue-300">
                {chapter.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {chapter.description}
              </p>
            </Link>
          </Fragment>
        ))}
      </div>

      {allChapters.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-12">
          No chapters available yet. Check back soon!
        </p>
      )}
    </div>
  );
}