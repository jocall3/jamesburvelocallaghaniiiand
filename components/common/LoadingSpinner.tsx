import React from 'react';

interface LoadingSpinnerProps {
  /**
   * Defines the size of the spinner. Can be 'small', 'medium', 'large',
   * or a custom Tailwind CSS class string (e.g., 'w-10 h-10').
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large' | string;
  /**
   * Defines the color of the spinner. This should be a Tailwind CSS color
   * class suffix (e.g., 'blue-500', 'gray-300').
   * @default 'blue-500'
   */
  color?: string;
  /**
   * Defines the thickness of the spinner's border. This should be a Tailwind CSS
   * border thickness class suffix (e.g., '2', '4', '8').
   * @default '4'
   */
  thickness?: string;
  /**
   * Additional Tailwind CSS classes to apply to the spinner container.
   */
  className?: string;
}

/**
 * A reusable loading spinner component to indicate data fetching or processing states.
 * It uses Tailwind CSS for styling and animation.
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'blue-500',
  thickness = '4',
  className = '',
}) => {
  const sizeClasses = {
    small: 'h-5 w-5',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  const currentSizeClass = sizeClasses[size as keyof typeof sizeClasses] || size;
  const borderColorClass = `border-${color}`;
  const borderThicknessClass = `border-${thickness}`;

  return (
    <div
      className={`
        animate-spin
        rounded-full
        ${currentSizeClass}
        ${borderThicknessClass}
        ${borderColorClass}
        border-solid
        border-t-transparent
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;