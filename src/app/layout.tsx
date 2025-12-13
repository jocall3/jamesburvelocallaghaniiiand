import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Import global styles

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Next 500 Pages Project',
  description: 'A comprehensive project showcasing various features and pages built with Next.js App Router.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 
          This main tag acts as a flexible container for the entire application content.
          - flex flex-col: Arranges children vertically.
          - min-h-screen: Ensures the body takes at least the full height of the viewport.
        */}
        <main className="flex flex-col min-h-screen">
          {/* 
            Children represent the page content or nested layouts.
            Global UI elements like a Navbar or Footer could be placed here,
            outside of the 'children' prop, if they are truly universal across all pages.
          */}
          {children}
        </main>
      </body>
    </html>
  );
}