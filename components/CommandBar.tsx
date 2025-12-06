
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, LoaderCircle } from 'lucide-react';

interface CommandBarProps {
  /**
   * Callback function to be invoked when the user submits a command.
   * @param command The natural language command string entered by the user.
   */
  onSendCommand: (command: string) => void;

  /**
   * A boolean flag indicating if the AI is currently processing a command.
   * When true, the input and submit button will be disabled.
   */
  isLoading: boolean;

  /**
   * An optional array of example commands to cycle through as placeholder text.
   */
  placeholderExamples?: string[];
}

const defaultPlaceholders = [
    "Create a payment order for $1,234.56 to Acme Inc.",
    "Show me all transactions from last week for account 'Operating Cash'",
    "What's the balance of my main checking account?",
    "Find counterparties in California",
    "Generate a report of all ACH payments in the last 30 days",
    "List all pending payment orders over $10,000",
];

/**
 * The primary UI component for users to input natural language commands to the Sovereign AI.
 * It features a text input with dynamic placeholders and a submit button that shows a loading state.
 */
const CommandBar: React.FC<CommandBarProps> = ({
  onSendCommand,
  isLoading,
  placeholderExamples = defaultPlaceholders,
}) => {
  const [command, setCommand] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Effect for cycling through placeholder text to give users ideas.
  useEffect(() => {
    if (placeholderExamples.length === 0) return;

    let index = Math.floor(Math.random() * placeholderExamples.length);
    setPlaceholder(placeholderExamples[index]);

    const intervalId = setInterval(() => {
      index = (index + 1) % placeholderExamples.length;
      setPlaceholder(placeholderExamples[index]);
    }, 4000); // Change placeholder every 4 seconds

    return () => clearInterval(intervalId);
  }, [placeholderExamples]);

  // Effect to add a global keyboard shortcut (Cmd+K or Ctrl+K) to focus the command bar.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCommand = command.trim();
    if (trimmedCommand && !isLoading) {
      onSendCommand(trimmedCommand);
      setCommand(''); // Clear input after sending
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/70 backdrop-blur-lg border-t border-gray-700 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="relative flex w-full items-center"
        >
          <Sparkles className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={`Ask Sovereign AI... e.g., "${placeholder}"`}
            disabled={isLoading}
            className="w-full rounded-full border border-gray-700 bg-gray-800 py-3 pl-12 pr-14 text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-70"
            autoComplete="off"
            aria-label="AI Command Input"
          />
          <button
            type="submit"
            disabled={isLoading || !command.trim()}
            className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600"
            aria-label="Send command"
          >
            {isLoading ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-gray-500">
          You can also press{' '}
          <kbd className="rounded-md border border-gray-600 bg-gray-700 px-2 py-1 text-xs font-semibold text-gray-400">
            ⌘ K
          </kbd>{' '}
          to focus.
        </p>
      </div>
    </div>
  );
};

export default CommandBar;
