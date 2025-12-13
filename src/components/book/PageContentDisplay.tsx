import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PageContentDisplayProps {
  content: string;
}

const PageContentDisplay: React.FC<PageContentDisplayProps> = ({ content }) => {
  return (
    <div className="page-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default PageContentDisplay;