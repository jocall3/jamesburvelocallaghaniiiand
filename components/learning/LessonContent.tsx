import React from 'react';
import Image from 'next/image'; // Assuming Next.js for Image component for optimized images
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism'; // A dark theme for code blocks

// --- Prop Types and Data Structures ---

/**
 * Defines the structure for various types of content blocks within a lesson.
 * Each block must have a unique `id` for React keying and potential anchor links.
 */
export type LessonContentType =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; content: string; id: string; }
  | { type: 'paragraph'; content: string; id: string; }
  | { type: 'image'; src: string; alt: string; id: string; width?: number; height?: number; layout?: 'fixed' | 'intrinsic' | 'responsive' | 'fill'; objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'; }
  | { type: 'video'; src: string; title: string; id: string; provider?: 'youtube' | 'vimeo' | 'generic'; }
  | { type: 'code'; content: string; language: string; id: string; }
  | { type: 'list'; items: string[]; ordered?: boolean; id: string; }
  | { type: 'quote'; content: string; author?: string; id: string; }
  | { type: 'quiz'; quizId: string; id: string; /* Add more specific quiz data here, e.g., questions, options */ }
  | { type: 'exercise'; exerciseId: string; id: string; /* Add more specific exercise data here, e.g., problem statement, starter code */ };

/**
 * Defines the overall structure of a lesson, including its title, description, and content blocks.
 */
export interface LessonData {
  id: string;
  title: string;
  description?: string;
  content: LessonContentType[];
}

/**
 * Props for the LessonContent component.
 */
interface LessonContentProps {
  lesson: LessonData;
}

// --- Helper Components for Rendering Different Block Types ---

const HeadingBlock: React.FC<{ block: Extract<LessonContentType, { type: 'heading' }> }> = ({ block }) => {
  const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
  const classes = {
    1: 'text-4xl font-extrabold mb-6 mt-10 text-gray-900 dark:text-white',
    2: 'text-3xl font-bold mb-5 mt-8 text-gray-800 dark:text-gray-100',
    3: 'text-2xl font-semibold mb-4 mt-6 text-gray-700 dark:text-gray-200',
    4: 'text-xl font-semibold mb-3 mt-5 text-gray-600 dark:text-gray-300',
    5: 'text-lg font-medium mb-2 mt-4 text-gray-500 dark:text-gray-400',
    6: 'text-base font-medium mb-1 mt-3 text-gray-400 dark:text-gray-500',
  };
  return <Tag id={block.id} className={classes[block.level]}>{block.content}</Tag>;
};

const ParagraphBlock: React.FC<{ block: Extract<LessonContentType, { type: 'paragraph' }> }> = ({ block }) => (
  <p className="mb-4 text-lg leading-relaxed text-gray-700 dark:text-gray-300">{block.content}</p>
);

const ImageBlock: React.FC<{ block: Extract<LessonContentType, { type: 'image' }> }> = ({ block }) => (
  <div className="my-6 flex justify-center">
    <Image
      src={block.src}
      alt={block.alt}
      width={block.width || 800} // Default width if not provided
      height={block.height || 450} // Default height if not provided
      layout={block.layout || "intrinsic"} // Default layout
      objectFit={block.objectFit || "contain"} // Default objectFit
      className="rounded-lg shadow-lg"
    />
  </div>
);

const VideoBlock: React.FC<{ block: Extract<LessonContentType, { type: 'video' }> }> = ({ block }) => {
  const getEmbedUrl = (src: string, provider?: 'youtube' | 'vimeo' | 'generic') => {
    if (provider === 'youtube' && src.includes('youtube.com/watch?v=')) {
      const videoId = src.split('v=')[1]?.split('&')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : src;
    }
    if (provider === 'vimeo' && src.includes('vimeo.com/')) {
      const videoId = src.split('vimeo.com/')[1]?.split('?')[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : src;
    }
    return src; // Assume generic URL is direct video or already embeddable
  };

  const embedSrc = getEmbedUrl(block.src, block.provider);

  if (block.provider === 'youtube' || block.provider === 'vimeo') {
    return (
      <div className="my-6 relative w-full max-w-4xl mx-auto" style={{ paddingTop: '56.25%' }}> {/* 16:9 Aspect Ratio */}
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
          src={embedSrc}
          title={block.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  return (
    <div className="my-6 w-full max-w-3xl mx-auto">
      <video controls className="w-full h-auto rounded-lg shadow-lg" title={block.title}>
        <source src={block.src} type="video/mp4" /> {/* Default to mp4, could add more types if needed */}
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

const CodeBlock: React.FC<{ block: Extract<LessonContentType, { type: 'code' }> }> = ({ block }) => (
  <div className="my-6 rounded-lg overflow-hidden shadow-md">
    <SyntaxHighlighter
      language={block.language}
      style={dracula}
      showLineNumbers={true}
      customStyle={{ padding: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5', borderRadius: '0.5rem' }}
      codeTagProps={{ className: 'font-mono' }} // Ensures monospace font for code
    >
      {block.content}
    </SyntaxHighlighter>
  </div>
);

const ListBlock: React.FC<{ block: Extract<LessonContentType, { type: 'list' }> }> = ({ block }) => {
  const ListTag = block.ordered ? 'ol' : 'ul';
  const itemClass = "mb-2 text-lg text-gray-700 dark:text-gray-300";
  const listClass = block.ordered ? "list-decimal list-inside pl-5 mb-4" : "list-disc list-inside pl-5 mb-4";

  return (
    <ListTag className={listClass}>
      {block.items.map((item, index) => (
        <li key={index} className={itemClass}>{item}</li>
      ))}
    </ListTag>
  );
};

const QuoteBlock: React.FC<{ block: Extract<LessonContentType, { type: 'quote' }> }> = ({ block }) => (
  <blockquote className="my-6 p-4 border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 rounded-r-lg shadow-sm">
    <p className="text-xl italic text-gray-800 dark:text-gray-200 mb-2">"{block.content}"</p>
    {block.author && <footer className="text-right text-gray-600 dark:text-gray-400">- {block.author}</footer>}
  </blockquote>
);

// Placeholder components for interactive elements (Quiz and Exercise)
const QuizBlock: React.FC<{ block: Extract<LessonContentType, { type: 'quiz' }> }> = ({ block }) => (
  <div className="my-6 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg shadow-md text-center">
    <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-3">Quiz Time!</h3>
    <p className="text-blue-700 dark:text-blue-300 mb-4">Engage with a quick quiz to test your knowledge on this topic.</p>
    <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">Quiz ID: {block.quizId}</p>
    <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
      Start Quiz
    </button>
  </div>
);

const ExerciseBlock: React.FC<{ block: Extract<LessonContentType, { type: 'exercise' }> }> = ({ block }) => (
  <div className="my-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg shadow-md text-center">
    <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-3">Hands-on Exercise</h3>
    <p className="text-green-700 dark:text-green-300 mb-4">Put your skills to practice with this interactive exercise.</p>
    <p className="text-sm text-green-600 dark:text-green-400 mb-4">Exercise ID: {block.exerciseId}</p>
    <button className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
      Start Exercise
    </button>
  </div>
);

// --- Main LessonContent Component ---

/**
 * LessonContent component renders the actual content of a lesson.
 * It supports various media types and interactive elements defined by the LessonData structure.
 */
const LessonContent: React.FC<LessonContentProps> = ({ lesson }) => {
  if (!lesson || !lesson.content || lesson.content.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <p className="text-xl font-semibold mb-4 text-gray-500 dark:text-gray-400">No lesson content available.</p>
        <p className="text-gray-600 dark:text-gray-300">Please check back later or select another lesson.</p>
      </div>
    );
  }

  return (
    <article className="prose dark:prose-invert max-w-none p-6 sm:p-8 lg:p-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-8 text-gray-900 dark:text-white leading-tight">
        {lesson.title}
      </h1>
      {lesson.description && (
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 border-b pb-6 border-gray-200 dark:border-gray-700">
          {lesson.description}
        </p>
      )}

      <div className="space-y-8"> {/* Adds consistent vertical spacing between all content blocks */}
        {lesson.content.map((block) => {
          switch (block.type) {
            case 'heading':
              return <HeadingBlock key={block.id} block={block} />;
            case 'paragraph':
              return <ParagraphBlock key={block.id} block={block} />;
            case 'image':
              return <ImageBlock key={block.id} block={block} />;
            case 'video':
              return <VideoBlock key={block.id} block={block} />;
            case 'code':
              return <CodeBlock key={block.id} block={block} />;
            case 'list':
              return <ListBlock key={block.id} block={block} />;
            case 'quote':
              return <QuoteBlock key={block.id} block={block} />;
            case 'quiz':
              return <QuizBlock key={block.id} block={block} />;
            case 'exercise':
              return <ExerciseBlock key={block.id} block={block} />;
            default:
              // Fallback for unknown block types to prevent crashes and aid debugging
              return (
                <div key={block.id} className="p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md">
                  <p className="font-semibold">Error: Unknown content block type.</p>
                  <p className="text-sm">Type: {(block as any).type}</p>
                </div>
              );
          }
        })}
      </div>
    </article>
  );
};

export default LessonContent;