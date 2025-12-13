import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

interface Props {
  params: { chapterId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chapterId } = params;
  return {
    title: `Chapter ${chapterId} - Book`,
    description: `Viewing Chapter ${chapterId} of the book.`,
  };
}


const ChapterPage = ({ params }: Props) => {
  const { chapterId } = params;

  // Assuming each chapter has 500 pages, adjust as needed
  const totalPages = 500;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Chapter {chapterId}</h1>
      <p className="mb-4">Welcome to Chapter {chapterId} of the book. Browse the pages below:</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
          <Link key={pageNumber} href={`/book/${chapterId}/${pageNumber}`} className="block p-4 bg-white rounded-md shadow-md hover:shadow-lg transition duration-300">
            Page {pageNumber}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ChapterPage;