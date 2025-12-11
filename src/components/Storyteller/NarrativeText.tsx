import React, { useEffect, useState, useRef } from 'react';

interface NarrativeTextProps {
  /** The complete narrative text to display. */
  text: string;
  /** Typing speed in milliseconds per character (default: 25ms). */
  speed?: number;
  /** Callback triggered when the typewriter effect completes. */
  onComplete?: () => void;
  /** Optional custom styling classes. */
  className?: string;
}

/**
 * NarrativeText Component
 * 
 * A typography-focused component that renders AI-generated story segments with a typewriter effect.
 * It dynamically parses and highlights technical EVM/Blockchain terms (e.g., Hex addresses, OpCodes, Gas)
 * to enhance readability for technical users.
 */
export const NarrativeText: React.FC<NarrativeTextProps> = ({
  text,
  speed = 25,
  onComplete,
  className = '',
}) => {
  const [displayedContent, setDisplayedContent] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Restart typewriter effect when text prop changes
  useEffect(() => {
    setDisplayedContent('');
    setIsTyping(true);
    let currentIndex = 0;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      // Check if we have reached the end of the text
      if (currentIndex < text.length) {
        // Append the next character
        // Note: Using functional state update ensures we don't depend on stale closures
        setDisplayedContent((prev) => prev + text.charAt(currentIndex));
        currentIndex++;
      } else {
        // Finished typing
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsTyping(false);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, onComplete]);

  /**
   * Processes the text string to wrap technical terms in styled spans.
   * Utilizes regex to identify Hex strings, EVM keywords, and numeric values.
   */
  const renderHighlightedContent = (content: string) => {
    // 1. Regex for Ethereum Hex Addresses / Hashes (starting with 0x)
    const hexPattern = /(0x[a-fA-F0-9]{4,})/;

    // 2. Technical Keywords derived from the project context (EVM traces, Nethereum)
    const keywords = [
      'EVM', 'Gas', 'Op', 'Pc', 'Stack', 'Memory', 'Storage', 'Depth', 
      'Transaction', 'Revert', 'Uniswap', 'OpenSea', 'Curve', 'Trace', 
      'Nethereum', 'SHA3', 'KECCAK256', 'Log', 'Call', 'Return'
    ];
    const keywordPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'i');

    // 3. Regex for numeric values (often Gas costs or PC indices)
    const numberPattern = /^\d+$/;

    // Split the content, capturing delimiters (words and hex strings)
    // The regex splits by: (Hex Strings) OR (Words)
    // Non-capturing groups would be lost, so we capture them to map over them.
    const parts = content.split(/((?:0x[a-fA-F0-9]{4,})|\b[\w]+\b)/g);

    return parts.map((part, index) => {
      // Highlight Hex Strings
      if (hexPattern.test(part)) {
        return (
          <span 
            key={index} 
            className="font-mono text-cyan-400 bg-cyan-950/30 px-1 rounded-sm mx-0.5 text-[0.9em] border border-cyan-900/50"
          >
            {part}
          </span>
        );
      }

      // Highlight Technical Keywords
      if (keywordPattern.test(part)) {
        return (
          <span 
            key={index} 
            className="font-bold text-yellow-400 border-b-2 border-yellow-400/20"
          >
            {part}
          </span>
        );
      }

      // Highlight Numbers (Gas/PC)
      if (numberPattern.test(part)) {
        return (
          <span key={index} className="font-mono text-emerald-400">
            {part}
          </span>
        );
      }

      // Render standard text and punctuation
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`relative max-w-prose ${className}`}>
      <div className="font-sans text-gray-200 leading-8 tracking-wide text-lg whitespace-pre-wrap">
        {renderHighlightedContent(displayedContent)}
        
        {/* Blinking Cursor Indicator */}
        {isTyping && (
          <span 
            className="inline-block w-2.5 h-5 ml-1 bg-green-500 animate-pulse align-middle shadow-[0_0_8px_rgba(34,197,94,0.8)]" 
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
};