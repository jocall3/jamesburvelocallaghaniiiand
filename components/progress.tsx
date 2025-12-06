"use client";

import React from 'react';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A self-contained component that injects necessary CSS keyframes and utility classes
 * into the document's head for progress bar animations. This ensures the component
 * works out-of-the-box without requiring global CSS configuration, embodying the
 * "self-contained app" principle.
 */
const AnimationStyles = React.memo(() => {
  React.useEffect(() => {
    const styleId = 'progress-component-dynamic-animations';
    if (document.getElementById(styleId)) return;

    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.innerHTML = `
      @keyframes progress-stripes {
        from { background-position: 1rem 0; }
        to { background-position: 0 0; }
      }
      .animate-stripes {
        animation: progress-stripes 1s linear infinite;
      }
      .bg-stripes {
        background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);
        background-size: 1rem 1rem;
      }
      @keyframes progress-indeterminate-1 {
        0% { left: -35%; right: 100%; }
        60%, 100% { left: 100%; right: -90%; }
      }
      @keyframes progress-indeterminate-2 {
        0% { left: -200%; right: 100%; }
        60%, 100% { left: 107%; right: -8%; }
      }
      .animate-indeterminate-1 {
        animation: progress-indeterminate-1 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
      }
      .animate-indeterminate-2 {
        animation: progress-indeterminate-2 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
      }
    `;
    document.head.appendChild(styleSheet);
  }, []);

  return null;
});

// --- Type Definitions for the Expansive Progress Component ---

type ProgressSize = 'sm' | 'md' | 'lg' | 'xl';
type ProgressVariant = 'default' | 'striped' | 'animated-striped';
type LabelPosition = 'inside' | 'outside' | 'floating';
type ProgressRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
type ProgressStatus = 'default' | 'success' | 'warning' | 'error';

/**
 * @interface ProgressProps
 * Defines the extensive set of properties for the advanced Progress component,
 * allowing for deep customization of its appearance, behavior, and semantics.
 */
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The current value of the progress bar. Must be between `min` and `max`. */
  value?: number | null;
  /** A secondary value for the progress bar, often used for buffering. Must be between `min` and `max`. */
  bufferValue?: number | null;
  /** The minimum value of the progress range. Defaults to 0. */
  min?: number;
  /** The maximum value of the progress range. Defaults to 100. */
  max?: number;
  /** The visual style of the progress bar indicator. */
  variant?: ProgressVariant;
  /** A custom color for the progress indicator. Accepts Tailwind classes (e.g., 'bg-green-500') or raw CSS color values. Overridden by `status` prop. */
  color?: string;
  /** A custom color for the progress bar track. Accepts Tailwind classes or raw CSS color values. */
  trackColor?: string;
  /** The height of the progress bar, offering more granular control. */
  size?: ProgressSize;
  /** The border-radius of the progress bar. */
  radius?: ProgressRadius;
  /** Toggles the visibility of the percentage or status label. */
  showLabel?: boolean;
  /** Defines the placement of the label relative to the progress bar. */
  labelPosition?: LabelPosition;
  /** The unit to display next to the label value. Defaults to '%'. */
  labelUnit?: string;
  /** A function to format the label's content. Receives percentage, value, min, and max. */
  labelFormatter?: (percentage: number, value: number | null, min: number, max: number) => React.ReactNode;
  /** If true, the progress bar enters an indeterminate state, ideal for unknown loading durations. */
  isIndeterminate?: boolean;
  /** The duration of the value transition animation in milliseconds. Defaults to 300ms. */
  transitionDuration?: number;
  /** Shows a tooltip with the current value on hover. */
  showTooltip?: boolean;
  /** Sets a predefined color scheme based on status. Overrides the `color` prop. */
  status?: ProgressStatus;
}

/**
 * Calculates the percentage completion, ensuring the value is clamped within the min/max bounds.
 * @returns {number} The calculated percentage (0-100).
 */
const calculatePercentage = (value: number | null | undefined, min: number, max: number): number => {
  if (value == null) return 0;
  const boundedValue = Math.max(min, Math.min(value, max));
  const percentage = max - min === 0 ? 100 : ((boundedValue - min) / (max - min)) * 100;
  return isNaN(percentage) ? 0 : percentage;
};

/**
 * A highly customizable, feature-rich, and self-contained Progress component.
 * It is designed to be "unbelievably expansive," supporting various visual styles,
 * animations, indeterminate states, and accessibility features.
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      bufferValue,
      min = 0,
      max = 100,
      variant = 'default',
      color: customColor = 'bg-cyan-500',
      trackColor = 'bg-gray-700',
      size = 'md',
      radius = 'full',
      showLabel = false,
      labelPosition = 'outside',
      labelUnit = '%',
      labelFormatter,
      isIndeterminate = false,
      transitionDuration = 300,
      showTooltip = false,
      status = 'default',
      ...props
    },
    ref
  ) => {
    const percentage = calculatePercentage(value, min, max);
    const bufferPercentage = calculatePercentage(bufferValue, min, max);

    const statusColors: Record<ProgressStatus, string> = {
      default: customColor,
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
    };
    const color = statusColors[status] || customColor;

    const sizeClasses: Record<ProgressSize, string> = {
      sm: 'h-2',
      md: 'h-4',
      lg: 'h-6',
      xl: 'h-8',
    };

    const radiusClasses: Record<ProgressRadius, string> = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full',
    };

    const labelSizeClasses: Record<ProgressSize, string> = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg',
    };

    const indicatorStyle: React.CSSProperties = {
      transform: `translateX(-${100 - percentage}%)`,
      transition: `transform ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      ...(color && !color.startsWith('bg-') && { backgroundColor: color }),
    };

    const bufferStyle: React.CSSProperties = {
      width: `${bufferPercentage}%`,
      transition: `width ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    };

    const ProgressLabel = () =>
      showLabel && !isIndeterminate ? (
        <span
          className={cn(
            'font-medium transition-all duration-300',
            labelSizeClasses[size],
            {
              'absolute inset-0 flex items-center justify-center text-white mix-blend-difference z-20': labelPosition === 'inside',
              'ml-2 text-gray-300': labelPosition === 'outside',
              'absolute bottom-full mb-1 rounded-md bg-gray-900 px-2 py-1 text-white': labelPosition === 'floating',
            }
          )}
          style={labelPosition === 'floating' ? { left: `${percentage}%`, transform: 'translateX(-50%)' } : {}}
        >
          {labelFormatter
            ? labelFormatter(percentage, value, min, max)
            : `${Math.round(percentage)}${labelUnit}`}
        </span>
      ) : null;

    const Tooltip = () =>
      showTooltip && !isIndeterminate ? (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap">
          <span className="relative z-30 rounded-md bg-gray-900 px-2 py-1 text-sm text-white">
            {labelFormatter
              ? labelFormatter(percentage, value, min, max)
              : `Value: ${value} (${Math.round(percentage)}${labelUnit})`}
            <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900" />
          </span>
        </div>
      ) : null;

    const indicatorClasses = cn(
      'h-full w-full flex-1 z-10',
      color.startsWith('bg-') ? color : '',
      {
        'bg-stripes': variant === 'striped' || variant === 'animated-striped',
        'animate-stripes': variant === 'animated-striped',
      }
    );

    const indeterminateIndicator = (
      <>
        <div
          className={cn('absolute h-full animate-indeterminate-1', color.startsWith('bg-') ? color : '')}
          style={!color.startsWith('bg-') ? { backgroundColor: color } : {}}
        />
        <div
          className={cn('absolute h-full animate-indeterminate-2', color.startsWith('bg-') ? color : '')}
          style={!color.startsWith('bg-') ? { backgroundColor: color } : {}}
        />
      </>
    );

    const trackStyle: React.CSSProperties = {
      ...(!trackColor.startsWith('bg-') && { backgroundColor: trackColor }),
    };

    return (
      <div className={cn('w-full', { 'flex items-center': labelPosition === 'outside' })}>
        <AnimationStyles />
        <div className="relative w-full group">
          <div
            ref={ref}
            role="progressbar"
            aria-valuenow={isIndeterminate ? undefined : percentage}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuetext={isIndeterminate ? 'Loading...' : `${Math.round(percentage)}${labelUnit}`}
            className={cn(
              "relative w-full overflow-hidden",
              sizeClasses[size],
              radiusClasses[radius],
              trackColor.startsWith('bg-') ? trackColor : '',
              className
            )}
            style={trackStyle}
            {...props}
          >
            {isIndeterminate ? (
              indeterminateIndicator
            ) : (
              <>
                {bufferValue != null && (
                  <div
                    className="absolute left-0 top-0 h-full bg-gray-500 opacity-30"
                    style={bufferStyle}
                  />
                )}
                <div className={indicatorClasses} style={indicatorStyle} />
              </>
            )}
            {labelPosition === 'inside' && <ProgressLabel />}
          </div>
          {labelPosition === 'floating' && <ProgressLabel />}
          {showTooltip && <Tooltip />}
        </div>
        {labelPosition === 'outside' && <ProgressLabel />}
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };