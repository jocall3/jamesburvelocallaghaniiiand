import React from 'react';
import { cn } from '@/lib/utils'; // Assuming a utility for combining class names

interface LoadingSpinnerProps {
  /**
   * Defines the size of the spinner.
   * Can be 'sm', 'md', 'lg', 'xl' or a custom Tailwind size class string (e.g., 'w-10 h-10').
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | string;
  /**
   * Defines the primary color of the spinner.
   * Should be a Tailwind CSS text color class (e.g., 'text-indigo-500', 'text-blue-600').
   * This color will be used for the active, visible part of the spinner.
   * @default 'text-indigo-500'
   */
  color?: string;
  /**
   * Defines the thickness of the spinner border.
   * Should be a Tailwind CSS border thickness class (e.g., 'border-2', 'border-4', 'border-8').
   * @default 'border-4'
   */
  thickness?: string;
  /**
   * Additional CSS classes to apply to the spinner container.
   */
  className?: string;
}

const sizeMap: Record<string, string> = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

/**
 * A UI component to indicate loading states, providing visual feedback to the user
 * during data fetching or processing.
 *
 * @example
 * <LoadingSpinner />
 * <LoadingSpinner size="lg" color="text-blue-500" thickness="border-8" />
 * <LoadingSpinner size="w-20 h-20" className="my-4" />
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-indigo-500',
  thickness = 'border-4',
  className,
}) => {
  const spinnerSizeClass = sizeMap[size] || size;

  // Convert the text color class to a border-top color class
  // e.g., 'text-indigo-500' becomes 'border-t-indigo-500'
  const activeBorderColorClass = color.replace('text-', 'border-t-');

  return (
    <div
      className={cn(
        'inline-block rounded-full animate-spin border-solid',
        spinnerSizeClass,
        thickness,
        'border-transparent', // All borders are transparent by default
        activeBorderColorClass, // Only the top border gets the specified color
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;