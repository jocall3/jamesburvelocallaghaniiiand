"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PageContent {
  title: string;
  content: string;
}

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const { chapterId, pageId } = params;

  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageData = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real application, this would fetch from an API or a data source.
        // For this example, we'll simulate fetching data.
        // Replace with your actual data fetching logic.
        const response = await fetch(`/api/books/${chapterId}/${pageId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch page: ${response.statusText}`);
        }
        const data: PageContent = await response.json();
        setPageContent(data);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching page data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (chapterId && pageId) {
      fetchPageData();
    }
  }, [chapterId, pageId]);

  const handlePreviousPage = () => {
    const currentPageNum = parseInt(pageId as string, 10);
    if (currentPageNum > 1) {
      router.push(`/book/${chapterId}/${currentPageNum - 1}`);
    } else {
      // Optionally navigate to the previous chapter or a chapter index
      router.push(`/book/${chapterId}`); // Example: go to chapter index
    }
  };

  const handleNextPage = () => {
    const currentPageNum = parseInt(pageId as string, 10);
    // In a real app, you'd check if there's a next page available.
    // For now, we'll assume there's always a next page up to 500.
    if (currentPageNum < 500) {
      router.push(`/book/${chapterId}/${currentPageNum + 1}`);
    } else {
      // Optionally navigate to the next chapter or a book completion page
      router.push(`/book/${parseInt(chapterId as string, 10) + 1}/1`); // Example: go to first page of next chapter
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <p>Loading page...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-red-500">
        <p>Error loading page: {error}</p>
        <Button onClick={() => router.refresh()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!pageContent) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <p>Page not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6 text-center">{pageContent.title}</h1>
      <div className="prose lg:prose-xl max-w-none">
        <ReactMarkdown>{pageContent.content}</ReactMarkdown>
      </div>

      <div className="flex justify-between mt-12">
        <Button
          onClick={handlePreviousPage}
          variant="outline"
          disabled={parseInt(pageId as string, 10) === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous Page
        </Button>
        <Button onClick={handleNextPage} variant="outline">
          Next Page <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}