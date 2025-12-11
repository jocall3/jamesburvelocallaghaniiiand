```tsx
import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'prism-react-renderer';
import { vsDark } from 'prism-react-renderer/themes/vsDark';
import { Language } from './types'; // Assuming you have a types.ts file

interface GeneratedCodeViewerProps {
  code: string;
  language: Language; // Use the Language type
}

const GeneratedCodeViewer: React.FC<GeneratedCodeViewerProps> = ({ code, language }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Or a loading indicator, as Prism needs the client
  }


  return (
    <SyntaxHighlighter language={language} style={vsDark} className="rounded-md overflow-x-auto">
      {code}
    </SyntaxHighlighter>
  );
};

export default GeneratedCodeViewer;
```