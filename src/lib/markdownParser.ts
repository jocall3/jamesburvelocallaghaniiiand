import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Configuration options for markdown parsing.
 */
interface MarkdownParseOptions {
  /** If true, the output will be sanitized to prevent XSS attacks. */
  sanitize?: boolean;
  /** If true, the output will be rendered as raw HTML strings. If false, it might be adapted for React components (though this implementation focuses on HTML output). */
  rawHtml?: boolean;
  /** Custom options to pass directly to the marked library. */
  markedOptions?: marked.MarkedOptions;
}

const defaultOptions: MarkdownParseOptions = {
  sanitize: true,
  rawHtml: true,
};

/**
 * Parses a markdown string into an HTML string.
 *
 * This function leverages the 'marked' library for conversion and 'dompurify' for security.
 *
 * @param markdownContent The raw markdown string to parse.
 * @param options Configuration options for parsing and sanitization.
 * @returns The resulting HTML string.
 */
export function parseMarkdownToHtml(
  markdownContent: string,
  options: MarkdownParseOptions = {}
): string {
  if (!markdownContent || typeof markdownContent !== 'string') {
    return '';
  }

  const finalOptions: MarkdownParseOptions = {
    ...defaultOptions,
    ...options,
  };

  // 1. Configure marked
  const markedConfig: marked.MarkedOptions = {
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert '\n' in paragraph to <br>
    sanitize: false, // We handle sanitization separately with DOMPurify for better control
    ...finalOptions.markedOptions,
  };

  marked.setOptions(markedConfig);

  // 2. Convert markdown to HTML
  let htmlOutput: string;
  try {
    htmlOutput = marked.parse(markdownContent);
  } catch (error) {
    console.error('Error during markdown parsing:', error);
    // Return an error message block instead of crashing the render
    return `<div class="markdown-error">Error rendering content.</div>`;
  }

  // 3. Sanitize the output if requested
  if (finalOptions.sanitize) {
    // DOMPurify is highly recommended for sanitizing HTML generated from untrusted sources.
    // We use the 'string' version here as we are dealing with strings.
    const cleanHtml = DOMPurify.sanitize(htmlOutput, {
      // Basic configuration for security, can be extended if needed
      USE_PROFILES: { html: true },
    });
    return cleanHtml;
  }

  // 4. Return raw output if sanitization was skipped
  return htmlOutput;
}

/**
 * A helper function to render markdown directly into React elements (JSX).
 * NOTE: This requires a library like 'react-markdown' or similar for true component rendering.
 * For this utility file, we provide a placeholder/basic implementation that relies on
 * the consumer to use dangerouslySetInnerHTML, as integrating React context here is complex.
 *
 * For a production book renderer, you would likely use 'react-markdown' instead of this wrapper.
 *
 * @param markdownContent The raw markdown string.
 * @returns An object containing the sanitized HTML string and a flag indicating it should be rendered dangerously.
 */
export function renderMarkdownAsReactFragment(
  markdownContent: string,
  options: MarkdownParseOptions = {}
): { __html: string } {
  // We reuse the HTML parsing logic, ensuring it's sanitized.
  const htmlString = parseMarkdownToHtml(markdownContent, {
    ...options,
    sanitize: true, // Always sanitize when preparing for React injection
  });

  // In a React context, this object is used with dangerouslySetInnerHTML={{ __html: result.__html }}
  return { __html: htmlString };
}

// Export the marked instance if advanced configuration is needed elsewhere
export { marked };