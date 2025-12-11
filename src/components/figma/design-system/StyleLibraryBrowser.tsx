import * as React from 'react';
import { useFigmaDocument } from './FigmaDocumentContext';
import StyleBrowser from './StyleBrowser';

type StyleLibraryBrowserProps = {
  initialStyleKey?: string;
};

const StyleLibraryBrowser: React.FC<StyleLibraryBrowserProps> = ({ initialStyleKey }) => {
  const { styles } = useFigmaDocument();

  const styleKeys = Object.keys(styles || {});

  const styleMap = React.useMemo(() => {
    return styleKeys.reduce((acc, key) => {
      acc[key] = styles[key];
      return acc;
    }, {} as { [key: string]: any }); // Use 'any' for complex style structure if not fully defined elsewhere
  }, [styles, styleKeys]);

  if (!styles || styleKeys.length === 0) {
    return <div>No published styles found in this library.</div>;
  }

  return (
    <StyleBrowser
      styleMap={styleMap}
      initialStyleKey={initialStyleKey}
    />
  );
};

export default StyleLibraryBrowser;