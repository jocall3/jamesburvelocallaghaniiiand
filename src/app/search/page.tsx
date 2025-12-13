"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Chapter } from '@/types/Chapter';
import { Page as PageType } from '@/types/Page';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

interface SearchResult {
    chapter?: Chapter;
    page?: PageType;
    highlightedText?: string;
}

const SearchPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get('q') || '';
    const [query, setQuery] = useState(initialQuery);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
            handleSearch(initialQuery);
        }
    }, [initialQuery]);

    const handleSearch = async (searchQuery: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/search?q=${searchQuery}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setSearchResults(data.results);
        } catch (e: any) {
            setError(e.message || 'An error occurred during the search.');
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/search?q=${query}`);
        handleSearch(query);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Search</h1>
            <form onSubmit={handleSubmit} className="flex items-center space-x-2 mb-4">
                <Input
                    type="search"
                    placeholder="Enter your search query"
                    value={query}
                    onChange={handleInputChange}
                    className="flex-grow"
                />
                <Button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </Button>
            </form>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {searchResults.length > 0 ? (
                <ScrollArea className="h-[600px] w-full space-y-4">
                    {searchResults.map((result, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <CardTitle>
                                    {result.chapter && (
                                        <Link href={`/chapter/${result.chapter.id}`} className="hover:underline">
                                            Chapter: {result.chapter.title}
                                        </Link>
                                    )}
                                    {result.page && (
                                        <Link href={`/chapter/${result.page.chapterId}/page/${result.page.id}`} className="hover:underline">
                                            Page: {result.page.title}
                                        </Link>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {result.highlightedText ? (
                                    <p dangerouslySetInnerHTML={{ __html: result.highlightedText }} />
                                ) : (
                                    <p>No highlighted text available.</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </ScrollArea>
            ) : (
                !loading && query !== "" && <p>No results found for "{query}".</p>
            )}

            {loading && <p>Loading search results...</p>}
        </div>
    );
};

export default SearchPage;