
import React from 'react';

interface DownloadLinkProps {
  url: string;
  filename: string;
}

export const DownloadLink: React.FC<DownloadLinkProps> = ({ url, filename }) => {
  return (
    <a 
      href={url} 
      download={filename}
      className="text-blue-500 hover:text-blue-600 underline text-sm"
      target="_blank"
      rel="noopener noreferrer"
    >
      Download {filename}
    </a>
  );
};
