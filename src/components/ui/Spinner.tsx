import React from 'react';

interface SpinnerProps {
  /**
   * Optional size of the spinner.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Optional additional CSS class names for custom styling.
   */
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-[3px]', // Custom border thickness for larger size
    xl: 'h-10 w-10 border-4',
  };

  const currentSizeClass = sizeClasses[size];

  return (
    <div
      className={`
        inline-block
        animate-spin
        rounded-full
        ${currentSizeClass}
        border-solid
        border-current
        border-r-transparent
        align-[-0.125em]
        text-indigo-600 dark:text-indigo-400
        motion-reduce:animate-[spin_1.5s_linear_infinite]
        ${className || ''}
      `}
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );
};

export default Spinner;