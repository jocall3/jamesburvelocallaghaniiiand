import React from 'react';

/**
 * A utility function to conditionally join class names together.
 * Filters out any falsy values.
 * @param classes - A list of class names (strings, undefined, null, or false).
 * @returns A single string of space-separated class names.
 */
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

/**
 * A simple SVG spinner component for loading states.
 * This is an internal component used by the Button.
 */
const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-current"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);


/**
 * Defines the visual variants and sizes for the Button component.
 * This object structure allows for easy extension and maintenance of button styles.
 * It's a core part of our design system's "self-contained app-like" component architecture.
 */
const buttonVariants = {
  variant: {
    // --- Core Variants ---
    default: "bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm",
    destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    outline: "border border-cyan-500 bg-transparent hover:bg-cyan-500/10 text-cyan-400",
    secondary: "bg-gray-700 text-white hover:bg-gray-600 shadow-sm",
    ghost: "hover:bg-gray-700/80",
    link: "text-cyan-400 underline-offset-4 hover:underline",
    
    // --- Semantic Variants ---
    success: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
    warning: "bg-yellow-500 text-black hover:bg-yellow-600 shadow-sm",

    // --- Stylistic & Future-Forward Variants ---
    premium: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 shadow-lg hover:shadow-cyan-500/50 transition-shadow",
    glass: "bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20",
    
    // --- High-Frequency Trading (HFT) Simulation Variants ---
    // Designed for high-performance, visually distinct trading interfaces.
    hftBuy: "bg-green-500 text-white font-mono tracking-wider hover:bg-green-400 active:bg-green-600 transform active:scale-95 transition-all duration-75",
    hftSell: "bg-red-500 text-white font-mono tracking-wider hover:bg-red-400 active:bg-red-600 transform active:scale-95 transition-all duration-75",

    // --- GEIN Protocol Variants ---
    'gein-1': 'bg-red-500 text-white hover:bg-red-600',
    'gein-2': 'bg-orange-500 text-white hover:bg-orange-600',
    'gein-3': 'bg-yellow-500 text-white hover:bg-yellow-600',
    'gein-4': 'bg-green-500 text-white hover:bg-green-600',
    'gein-5': 'bg-teal-500 text-white hover:bg-teal-600',
    'gein-6': 'bg-blue-500 text-white hover:bg-blue-600',
    'gein-7': 'bg-indigo-500 text-white hover:bg-indigo-600',
    'gein-8': 'bg-purple-500 text-white hover:bg-purple-600',
    'gein-9': 'bg-pink-500 text-white hover:bg-pink-600',
    'gein-10': 'bg-gray-500 text-white hover:bg-gray-600',
    'gein-11': 'bg-rose-500 text-white hover:bg-rose-600',
    'gein-12': 'bg-fuchsia-500 text-white hover:bg-fuchsia-600',
    'gein-13': 'bg-cyan-500 text-white hover:bg-cyan-600',
    'gein-14': 'bg-lime-500 text-white hover:bg-lime-600',
    'gein-15': 'bg-amber-500 text-white hover:bg-amber-600',
    'gein-16': 'bg-emerald-500 text-white hover:bg-emerald-600',
    'gein-17': 'bg-sky-500 text-white hover:bg-sky-600',
    'gein-18': 'bg-violet-500 text-white hover:bg-violet-600',
    'gein-19': 'bg-red-600 text-white hover:bg-red-700',
    'gein-20': 'bg-orange-600 text-white hover:bg-orange-700',
    'gein-21': 'bg-yellow-600 text-white hover:bg-yellow-700',
    'gein-22': 'bg-green-600 text-white hover:bg-green-700',
    'gein-23': 'bg-teal-600 text-white hover:bg-teal-700',
    'gein-24': 'bg-blue-600 text-white hover:bg-blue-700',
    'gein-25': 'bg-indigo-600 text-white hover:bg-indigo-700',
    'gein-26': 'bg-purple-600 text-white hover:bg-purple-700',
    'gein-27': 'bg-pink-600 text-white hover:bg-pink-700',
    'gein-28': 'bg-gray-600 text-white hover:bg-gray-700',
    'gein-29': 'bg-rose-600 text-white hover:bg-rose-700',
    'gein-30': 'bg-fuchsia-600 text-white hover:bg-fuchsia-700',
    'gein-31': 'bg-cyan-600 text-white hover:bg-cyan-700',
    'gein-32': 'bg-lime-600 text-white hover:bg-lime-700',
    'gein-33': 'bg-amber-600 text-white hover:bg-amber-700',
    'gein-34': 'bg-emerald-600 text-white hover:bg-emerald-700',
    'gein-35': 'bg-sky-600 text-white hover:bg-sky-700',
    'gein-36': 'bg-violet-600 text-white hover:bg-violet-700',
    'gein-37': 'bg-red-700 text-white hover:bg-red-800',
    'gein-38': 'bg-orange-700 text-white hover:bg-orange-800',
    'gein-39': 'bg-yellow-700 text-white hover:bg-yellow-800',
    'gein-40': 'bg-green-700 text-white hover:bg-green-800',
    'gein-41': 'bg-teal-700 text-white hover:bg-teal-800',
    'gein-42': 'bg-blue-700 text-white hover:bg-blue-800',
    'gein-43': 'bg-indigo-700 text-white hover:bg-indigo-800',
    'gein-44': 'bg-purple-700 text-white hover:bg-purple-800',
    'gein-45': 'bg-pink-700 text-white hover:bg-pink-800',
    'gein-46': 'bg-gray-700 text-white hover:bg-gray-800',
    'gein-47': 'bg-rose-700 text-white hover:bg-rose-800',
    'gein-48': 'bg-fuchsia-700 text-white hover:bg-fuchsia-800',
    'gein-49': 'bg-cyan-700 text-white hover:bg-cyan-800',
    'gein-50': 'bg-lime-700 text-white hover:bg-lime-800',
    'gein-51': 'bg-amber-700 text-white hover:bg-amber-800',
    'gein-52': 'bg-emerald-700 text-white hover:bg-emerald-800',
    'gein-53': 'bg-sky-700 text-white hover:bg-sky-800',
    'gein-54': 'bg-violet-700 text-white hover:bg-violet-800',
    'gein-55': 'bg-red-800 text-white hover:bg-red-900',
    'gein-56': 'bg-orange-800 text-white hover:bg-orange-900',
    'gein-57': 'bg-yellow-800 text-white hover:bg-yellow-900',
    'gein-58': 'bg-green-800 text-white hover:bg-green-900',
    'gein-59': 'bg-teal-800 text-white hover:bg-teal-900',
    'gein-60': 'bg-blue-800 text-white hover:bg-blue-900',
    'gein-61': 'bg-indigo-800 text-white hover:bg-indigo-900',
    'gein-62': 'bg-purple-800 text-white hover:bg-purple-900',
    'gein-63': 'bg-pink-800 text-white hover:bg-pink-900',
    'gein-64': 'bg-gray-800 text-white hover:bg-gray-900',
    'gein-65': 'bg-rose-800 text-white hover:bg-rose-900',
    'gein-66': 'bg-fuchsia-800 text-white hover:bg-fuchsia-900',
    'gein-67': 'bg-cyan-800 text-white hover:bg-cyan-900',
    'gein-68': 'bg-lime-800 text-white hover:bg-lime-900',
    'gein-69': 'bg-amber-800 text-white hover:bg-amber-900',
    'gein-70': 'bg-emerald-800 text-white hover:bg-emerald-900',
    'gein-71': 'bg-sky-800 text-white hover:bg-sky-900',
    'gein-72': 'bg-violet-800 text-white hover:bg-violet-900',
    'gein-73': 'bg-red-900 text-white hover:bg-red-900',
    'gein-74': 'bg-orange-900 text-white hover:bg-orange-900',
    'gein-75': 'bg-yellow-900 text-white hover:bg-yellow-900',
    'gein-76': 'bg-green-900 text-white hover:bg-green-900',
    'gein-77': 'bg-teal-900 text-white hover:bg-teal-900',
    'gein-78': 'bg-blue-900 text-white hover:bg-blue-900',
    'gein-79': 'bg-indigo-900 text-white hover:bg-indigo-900',
    'gein-80': 'bg-purple-900 text-white hover:bg-purple-900',
    'gein-81': 'bg-pink-900 text-white hover:bg-pink-900',
    'gein-82': 'bg-gray-900 text-white hover:bg-gray-900',
    'gein-83': 'bg-rose-900 text-white hover:bg-rose-900',
    'gein-84': 'bg-fuchsia-900 text-white hover:bg-fuchsia-900',
    'gein-85': 'bg-cyan-900 text-white hover:bg-cyan-900',
    'gein-86': 'bg-lime-900 text-white hover:bg-lime-900',
    'gein-87': 'bg-amber-900 text-white hover:bg-amber-900',
    'gein-88': 'bg-emerald-900 text-white hover:bg-emerald-900',
    'gein-89': 'bg-sky-900 text-white hover:bg-sky-900',
    'gein-90': 'bg-violet-900 text-white hover:bg-violet-900',
    'gein-91': 'border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white',
    'gein-92': 'border-2 border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white',
    'gein-93': 'border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-white',
    'gein-94': 'border-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-white',
    'gein-95': 'border-2 border-teal-500 text-teal-400 hover:bg-teal-500 hover:text-white',
    'gein-96': 'border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white',
    'gein-97': 'border-2 border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white',
    'gein-98': 'border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white',
    'gein-99': 'border-2 border-pink-500 text-pink-400 hover:bg-pink-500 hover:text-white',
    'gein-100': 'border-2 border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white',
  },
  size: {
    // --- Standard Sizes ---
    default: "h-10 py-2 px-4",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    
    // --- Granular Sizes for Precision UI ---
    xs: "h-8 rounded-md px-2 text-xs",
    xl: "h-12 rounded-lg px-10 text-lg",
    
    // --- Shape-based Sizes ---
    icon: "h-10 w-10",
    pill: "h-10 rounded-full px-6",
  },
};

/**
 * The properties for the Button component.
 * Extends standard HTML button attributes for full compatibility.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The visual style of the button.
   * @default 'default'
   */
  variant?: keyof typeof buttonVariants.variant;
  /**
   * The size of the button.
   * @default 'default'
   */
  size?: keyof typeof buttonVariants.size;
  /**
   * If `true`, the button will be in a loading state,
   * showing a spinner and disabling interactions.
   * @default false
   */
  isLoading?: boolean;
  /**
   * If `true`, the button will take up the full width of its container.
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Enables GEIN-powered adaptive interaction scaling.
   * This is a conceptual feature for this component.
   * @default false
   */
  geinAdaptive?: boolean;
  /**
   * Specifies the data point layer for GEIN interaction.
   * This is a conceptual feature for this component, passed as a data attribute.
   */
  geinLayer?: number;
  /**
   * Adds a holographic shimmer effect.
   * Requires corresponding CSS to be implemented via the 'holographic-effect' class.
   * @default false
   */
  holographic?: boolean;
}

/**
 * A highly extensible and futuristic Button component.
 * It serves as a foundational element for all interactive UIs,
 * from simple forms to complex, high-frequency trading applications.
 * This component is designed to be a self-contained module, embodying
 * principles of modularity and reusability.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'default',
    size = 'default',
    isLoading = false,
    fullWidth = false,
    geinAdaptive = false,
    geinLayer,
    holographic = false,
    children,
    ...props
  }, ref) => {
    // The core logic for constructing the button's class list.
    // This is where the base styles, variants, and conditional styles are merged.
    const buttonClasses = cn(
      // Base styles for all buttons
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50 disabled:pointer-events-none",
      
      // Dynamic styles from variants and size props
      buttonVariants.variant[variant],
      buttonVariants.size[size],
      
      // Conditional styles based on state props
      fullWidth && "w-full",
      isLoading && "cursor-not-allowed",

      // GEIN and futuristic feature styles
      geinAdaptive && "transition-transform transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50",
      holographic && "holographic-effect", // Placeholder class for CSS implementation

      // User-provided class names for ultimate customizability
      className
    );

    return (
      <button
        className={buttonClasses}
        ref={ref}
        disabled={isLoading || props.disabled}
        data-gein-layer={geinLayer}
        {...props}
      >
        {isLoading ? <Spinner /> : children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };