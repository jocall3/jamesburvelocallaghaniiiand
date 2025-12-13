```typescript
import React from 'react';

/**
 * @fileoverview The James Burvel O’Callaghan III Code - Button Component.
 * @module components/button
 * @requires React
 * @description A comprehensive and deeply structured Button component, adhering to the "The James Burvel O’Callaghan III Code" standards.
 *  This component is designed with maximalist principles, featuring extensive UI elements,
 *  numerous variants, sizes, and interactive features. It is built for expert users who value
 *  traceability, explicitness, and scale.
 */

/**
 * @function A1_cn - Conditional Class Name Joiner - The James Burvel O’Callaghan III Code.
 * @param {...(string | undefined | null | false)[]} classes - Variadic input of class names, supports conditional rendering.
 * @returns {string} A single string containing space-separated class names, filtering out falsy values.
 * @description This function efficiently concatenates class names, handling undefined, null, and false values gracefully.
 *  It is a core utility for managing the dynamic styling of the button. This is function A1 in the module.
 */
const A1_cn = (...classes: (string | undefined | null | false)[]): string =>
  classes.filter(Boolean).join(' ');

/**
 * @component A2_Spinner - James Burvel O’Callaghan III Code - SVG Spinner Component.
 * @description An internal SVG spinner component, providing visual feedback during loading states.
 * @returns {JSX.Element} A React component representing the spinner. This is component A2 in the module.
 */
const A2_Spinner = (): JSX.Element => (
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
 * @typedef {object} A3_ButtonVariantDefinitions - James Burvel O’Callaghan III Code - Button Variant Definitions.
 * @property {object} variant - Defines the visual variants of the button.
 * @property {string} variant.default - The default button style.
 * @property {string} variant.destructive - Destructive action button style.
 * @property {string} variant.outline - Outline button style.
 * @property {string} variant.secondary - Secondary button style.
 * @property {string} variant.ghost - Ghost button style.
 * @property {string} variant.link - Link-style button style.
 * @property {string} variant.success - Success button style.
 * @property {string} variant.warning - Warning button style.
 * @property {string} variant.premium - Premium button style.
 * @property {string} variant.glass - Glass button style.
 * @property {string} variant.hftBuy - HFT buy button style.
 * @property {string} variant.hftSell - HFT sell button style.
 * @property {object} size - Defines the sizes of the button.
 * @property {string} size.default - The default button size.
 * @property {string} size.sm - Small button size.
 * @property {string} size.lg - Large button size.
 * @property {string} size.xs - Extra small button size.
 * @property {string} size.xl - Extra large button size.
 * @property {string} size.icon - Icon button size.
 * @property {string} size.pill - Pill button size.
 * @description This object meticulously defines the visual styles and sizes for the Button component.
 *  It's a foundational element of the design system, ensuring consistency and ease of maintenance.
 *  This is type definition A3 in the module.  There are also 100+ GEIN Protocol Variants.
 */
const A3_ButtonVariantDefinitions = {
  variant: {
    // --- Core Variants - James Burvel O’Callaghan III Code ---
    default: "bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm transition-all duration-150 ease-in-out",
    destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm transition-all duration-150 ease-in-out",
    outline: "border border-cyan-500 bg-transparent hover:bg-cyan-500/10 text-cyan-400 transition-all duration-150 ease-in-out",
    secondary: "bg-gray-700 text-white hover:bg-gray-600 shadow-sm transition-all duration-150 ease-in-out",
    ghost: "hover:bg-gray-700/80 transition-all duration-150 ease-in-out",
    link: "text-cyan-400 underline-offset-4 hover:underline transition-all duration-150 ease-in-out",

    // --- Semantic Variants - James Burvel O’Callaghan III Code ---
    success: "bg-green-600 text-white hover:bg-green-700 shadow-sm transition-all duration-150 ease-in-out",
    warning: "bg-yellow-500 text-black hover:bg-yellow-600 shadow-sm transition-all duration-150 ease-in-out",

    // --- Stylistic & Future-Forward Variants - James Burvel O’Callaghan III Code ---
    premium: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 shadow-lg hover:shadow-cyan-500/50 transition-shadow duration-200 ease-in-out",
    glass: "bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-150 ease-in-out",

    // --- High-Frequency Trading (HFT) Simulation Variants - The James Burvel O’Callaghan III Code ---
    hftBuy: "bg-green-500 text-white font-mono tracking-wider hover:bg-green-400 active:bg-green-600 transform active:scale-95 transition-all duration-75",
    hftSell: "bg-red-500 text-white font-mono tracking-wider hover:bg-red-400 active:bg-red-600 transform active:scale-95 transition-all duration-75",

    // --- GEIN Protocol Variants - The James Burvel O’Callaghan III Code ---
    'gein-1': 'bg-red-500 text-white hover:bg-red-600 transition-all duration-150 ease-in-out',
    'gein-2': 'bg-orange-500 text-white hover:bg-orange-600 transition-all duration-150 ease-in-out',
    'gein-3': 'bg-yellow-500 text-white hover:bg-yellow-600 transition-all duration-150 ease-in-out',
    'gein-4': 'bg-green-500 text-white hover:bg-green-600 transition-all duration-150 ease-in-out',
    'gein-5': 'bg-teal-500 text-white hover:bg-teal-600 transition-all duration-150 ease-in-out',
    'gein-6': 'bg-blue-500 text-white hover:bg-blue-600 transition-all duration-150 ease-in-out',
    'gein-7': 'bg-indigo-500 text-white hover:bg-indigo-600 transition-all duration-150 ease-in-out',
    'gein-8': 'bg-purple-500 text-white hover:bg-purple-600 transition-all duration-150 ease-in-out',
    'gein-9': 'bg-pink-500 text-white hover:bg-pink-600 transition-all duration-150 ease-in-out',
    'gein-10': 'bg-gray-500 text-white hover:bg-gray-600 transition-all duration-150 ease-in-out',
    'gein-11': 'bg-rose-500 text-white hover:bg-rose-600 transition-all duration-150 ease-in-out',
    'gein-12': 'bg-fuchsia-500 text-white hover:bg-fuchsia-600 transition-all duration-150 ease-in-out',
    'gein-13': 'bg-cyan-500 text-white hover:bg-cyan-600 transition-all duration-150 ease-in-out',
    'gein-14': 'bg-lime-500 text-white hover:bg-lime-600 transition-all duration-150 ease-in-out',
    'gein-15': 'bg-amber-500 text-white hover:bg-amber-600 transition-all duration-150 ease-in-out',
    'gein-16': 'bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-150 ease-in-out',
    'gein-17': 'bg-sky-500 text-white hover:bg-sky-600 transition-all duration-150 ease-in-out',
    'gein-18': 'bg-violet-500 text-white hover:bg-violet-600 transition-all duration-150 ease-in-out',
    'gein-19': 'bg-red-600 text-white hover:bg-red-700 transition-all duration-150 ease-in-out',
    'gein-20': 'bg-orange-600 text-white hover:bg-orange-700 transition-all duration-150 ease-in-out',
    'gein-21': 'bg-yellow-600 text-white hover:bg-yellow-700 transition-all duration-150 ease-in-out',
    'gein-22': 'bg-green-600 text-white hover:bg-green-700 transition-all duration-150 ease-in-out',
    'gein-23': 'bg-teal-600 text-white hover:bg-teal-700 transition-all duration-150 ease-in-out',
    'gein-24': 'bg-blue-600 text-white hover:bg-blue-700 transition-all duration-150 ease-in-out',
    'gein-25': 'bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-150 ease-in-out',
    'gein-26': 'bg-purple-600 text-white hover:bg-purple-700 transition-all duration-150 ease-in-out',
    'gein-27': 'bg-pink-600 text-white hover:bg-pink-700 transition-all duration-150 ease-in-out',
    'gein-28': 'bg-gray-600 text-white hover:bg-gray-700 transition-all duration-150 ease-in-out',
    'gein-29': 'bg-rose-600 text-white hover:bg-rose-700 transition-all duration-150 ease-in-out',
    'gein-30': 'bg-fuchsia-600 text-white hover:bg-fuchsia-700 transition-all duration-150 ease-in-out',
    'gein-31': 'bg-cyan-600 text-white hover:bg-cyan-700 transition-all duration-150 ease-in-out',
    'gein-32': 'bg-lime-600 text-white hover:bg-lime-700 transition-all duration-150 ease-in-out',
    'gein-33': 'bg-amber-600 text-white hover:bg-amber-700 transition-all duration-150 ease-in-out',
    'gein-34': 'bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-150 ease-in-out',
    'gein-35': 'bg-sky-600 text-white hover:bg-sky-700 transition-all duration-150 ease-in-out',
    'gein-36': 'bg-violet-600 text-white hover:bg-violet-700 transition-all duration-150 ease-in-out',
    'gein-37': 'bg-red-700 text-white hover:bg-red-800 transition-all duration-150 ease-in-out',
    'gein-38': 'bg-orange-700 text-white hover:bg-orange-800 transition-all duration-150 ease-in-out',
    'gein-39': 'bg-yellow-700 text-white hover:bg-yellow-800 transition-all duration-150 ease-in-out',
    'gein-40': 'bg-green-700 text-white hover:bg-green-800 transition-all duration-150 ease-in-out',
    'gein-41': 'bg-teal-700 text-white hover:bg-teal-800 transition-all duration-150 ease-in-out',
    'gein-42': 'bg-blue-700 text-white hover:bg-blue-800 transition-all duration-150 ease-in-out',
    'gein-43': 'bg-indigo-700 text-white hover:bg-indigo-800 transition-all duration-150 ease-in-out',
    'gein-44': 'bg-purple-700 text-white hover:bg-purple-800 transition-all duration-150 ease-in-out',
    'gein-45': 'bg-pink-700 text-white hover:bg-pink-800 transition-all duration-150 ease-in-out',
    'gein-46': 'bg-gray-700 text-white hover:bg-gray-800 transition-all duration-150 ease-in-out',
    'gein-47': 'bg-rose-700 text-white hover:bg-rose-800 transition-all duration-150 ease-in-out',
    'gein-48': 'bg-fuchsia-700 text-white hover:bg-fuchsia-800 transition-all duration-150 ease-in-out',
    'gein-49': 'bg-cyan-700 text-white hover:bg-cyan-800 transition-all duration-150 ease-in-out',
    'gein-50': 'bg-lime-700 text-white hover:bg-lime-800 transition-all duration-150 ease-in-out',
    'gein-51': 'bg-amber-700 text-white hover:bg-amber-800 transition-all duration-150 ease-in-out',
    'gein-52': 'bg-emerald-700 text-white hover:bg-emerald-800 transition-all duration-150 ease-in-out',
    'gein-53': 'bg-sky-700 text-white hover:bg-sky-800 transition-all duration-150 ease-in-out',
    'gein-54': 'bg-violet-700 text-white hover:bg-violet-800 transition-all duration-150 ease-in-out',
    'gein-55': 'bg-red-800 text-white hover:bg-red-900 transition-all duration-150 ease-in-out',
    'gein-56': 'bg-orange-800 text-white hover:bg-orange-900 transition-all duration-150 ease-in-out',
    'gein-57': 'bg-yellow-800 text-white hover:bg-yellow-900 transition-all duration-150 ease-in-out',
    'gein-58': 'bg-green-800 text-white hover:bg-green-900 transition-all duration-150 ease-in-out',
    'gein-59': 'bg-teal-800 text-white hover:bg-teal-900 transition-all duration-150 ease-in-out',
    'gein-60': 'bg-blue-800 text-white hover:bg-blue-900 transition-all duration-150 ease-in-out',
    'gein-61': 'bg-indigo-800 text-white hover:bg-indigo-900 transition-all duration-150 ease-in-out',
    'gein-62': 'bg-purple-800 text-white hover:bg-purple-900 transition-all duration-150 ease-in-out',
    'gein-63': 'bg-pink-800 text-white hover:bg-pink-900 transition-all duration-150 ease-in-out',
    'gein-64': 'bg-gray-800 text-white hover:bg-gray-900 transition-all duration-150 ease-in-out',
    'gein-65': 'bg-rose-800 text-white hover:bg-rose-900 transition-all duration-150 ease-in-out',
    'gein-66': 'bg-fuchsia-800 text-white hover:bg-fuchsia-900 transition-all duration-150 ease-in-out',
    'gein-67': 'bg-cyan-800 text-white hover:bg-cyan-900 transition-all duration-150 ease-in-out',
    'gein-68': 'bg-lime-800 text-white hover:bg-lime-900 transition-all duration-150 ease-in-out',
    'gein-69': 'bg-amber-800 text-white hover:bg-amber-900 transition-all duration-150 ease-in-out',
    'gein-70': 'bg-emerald-800 text-white hover:bg-emerald-900 transition-all duration-150 ease-in-out',
    'gein-71': 'bg-sky-800 text-white hover:bg-sky-900 transition-all duration-150 ease-in-out',
    'gein-72': 'bg-violet-800 text-white hover:bg-violet-900 transition-all duration-150 ease-in-out',
    'gein-73': 'bg-red-900 text-white hover:bg-red-900 transition-all duration-150 ease-in-out',
    'gein-74': 'bg-orange-900 text-white hover:bg-orange-900 transition-all duration-150 ease-in-out',
    'gein-75': 'bg-yellow-900 text-white hover:bg-yellow-900 transition-all duration-150 ease-in-out',
    'gein-76': 'bg-green-900 text-white hover:bg-green-900 transition-all duration-150 ease-in-out',
    'gein-77': 'bg-teal-900 text-white hover:bg-teal-900 transition-all duration-150 ease-in-out',
    'gein-78': 'bg-blue-900 text-white hover:bg-blue-900 transition-all duration-150 ease-in-out',
    'gein-79': 'bg-indigo-900 text-white hover:bg-indigo-900 transition-all duration-150 ease-in-out',
    'gein-80': 'bg-purple-900 text-white hover:bg-purple-900 transition-all duration-150 ease-in-out',
    'gein-81': 'bg-pink-900 text-white hover:bg-pink-900 transition-all duration-150 ease-in-out',
    'gein-82': 'bg-gray-900 text-white hover:bg-gray-900 transition-all duration-150 ease-in-out',
    'gein-83': 'bg-rose-900 text-white hover:bg-rose-900 transition-all duration-150 ease-in-out',
    'gein-84': 'bg-fuchsia-900 text-white hover:bg-fuchsia-900 transition-all duration-150 ease-in-out',
    'gein-85': 'bg-cyan-900 text-white hover:bg-cyan-900 transition-all duration-150 ease-in-out',
    'gein-86': 'bg-lime-900 text-white hover:bg-lime-900 transition-all duration-150 ease-in-out',
    'gein-87': 'bg-amber-900 text-white hover:bg-amber-900 transition-all duration-150 ease-in-out',
    'gein-88': 'bg-emerald-900 text-white hover:bg-emerald-900 transition-all duration-150 ease-in-out',
    'gein-89': 'bg-sky-900 text-white hover:bg-sky-900 transition-all duration-150 ease-in-out',
    'gein-90': 'bg-violet-900 text-white hover:bg-violet-900 transition-all duration-150 ease-in-out',
    'gein-91': 'border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-150 ease-in-out',
    'gein-92': 'border-2 border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white transition-all duration-150 ease-in-out',
    'gein-93': 'border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-white transition-all duration-150 ease-in-out',
    'gein-94': 'border-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-white transition-all duration-150 ease-in-out',
    'gein-95': 'border-2 border-teal-500 text-teal-400 hover:bg-teal-500 hover:text-white transition-all duration-150 ease-in-out',
    'gein-96': 'border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-150 ease-in-out',
    'gein-97': 'border-2 border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all duration-150 ease-in-out',
    'gein-98': 'border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white transition-all duration-150 ease-in-out',
    'gein-99': 'border-2 border-pink-500 text-pink-400 hover:bg-pink-500 hover:text-white transition-all duration-150 ease-in-out',
    'gein-100': 'border-2 border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white transition-all duration-150 ease-in-out',
  },
  size: {
    // --- Standard Sizes - James Burvel O’Callaghan III Code ---
    default: "h-10 py-2 px-4 rounded-md",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",

    // --- Granular Sizes for Precision UI - James Burvel O’Callaghan III Code ---
    xs: "h-8 rounded-md px-2 text-xs",
    xl: "h-12 rounded-lg px-10 text-lg",

    // --- Shape-based Sizes - James Burvel O’Callaghan III Code ---
    icon: "h-10 w-10 rounded-full",
    pill: "h-10 rounded-full px-6",
  },
};

/**
 * @typedef {object} A4_ButtonProps - James Burvel O’Callaghan III Code - Button Component Properties.
 * @property {string} [className] - Optional custom class name(s) to apply to the button.
 * @property {keyof A3_ButtonVariantDefinitions.variant} [variant='default'] - The visual style variant of the button.  Defaults to 'default'.
 * @property {keyof A3_ButtonVariantDefinitions.size} [size='default'] - The size of the button. Defaults to 'default'.
 * @property {boolean} [isLoading=false] - Determines if the button is in a loading state. Defaults to false.
 * @property {boolean} [fullWidth=false] - Determines if the button should span the full width of its container. Defaults to false.
 * @property {boolean} [geinAdaptive=false] - Enables GEIN-powered adaptive interaction scaling (conceptual feature). Defaults to false.
 * @property {number} [geinLayer] - Specifies the data point layer for GEIN interaction.
 * @property {boolean} [holographic=false] - Adds a holographic shimmer effect (requires corresponding CSS). Defaults to false.
 * @property {React.ReactNode} [children] - The content of the button.
 * @property {React.ButtonHTMLAttributes<HTMLButtonElement>} ...props -  All standard HTML button attributes.
 * @description Defines the properties accepted by the Button component, including styling, state, and interactive features.
 *  This interface ensures type safety and provides a comprehensive overview of the component's capabilities.
 *  This is type definition A4 in the module.
 */
interface A4_ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: keyof typeof A3_ButtonVariantDefinitions.variant;
  size?: keyof typeof A3_ButtonVariantDefinitions.size;
  isLoading?: boolean;
  fullWidth?: boolean;
  geinAdaptive?: boolean;
  geinLayer?: number;
  holographic?: boolean;
  children?: React.ReactNode;
}

/**
 * @component A5_Button - The James Burvel O’Callaghan III Code - Button Component.
 * @description A highly extensible and feature-rich Button component, serving as a core element for all interactive user interfaces.
 *  This component embraces a self-contained module design, reflecting principles of modularity and reusability. It includes extensive visual variants,
 *  dynamic sizing options, loading states, full-width capabilities, GEIN-powered features (conceptual), and a holographic effect.  This is component A5.
 * @param {A4_ButtonProps} props - The properties of the button.
 * @param {React.Ref<HTMLButtonElement>} ref -  A React ref to the button element.
 * @returns {JSX.Element}  A rendered button element.
 */
const A5_Button = React.forwardRef<HTMLButtonElement, A4_ButtonProps>(
  (
    {
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
    },
    ref
  ): JSX.Element => {
    // A. Core Button Class Construction - The James Burvel O’Callaghan III Code.
    // This is the primary function of the Button component,
    // where styles are dynamically composed based on props.
    // This uses A1_cn to ensure clean class management.
    const A5A_buttonClasses: string = A1_cn(
      // A1. Base Styles - The James Burvel O’Callaghan III Code.  Styles applicable to all button instances.
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50 disabled:pointer-events-none select-none",

      // A2. Variant and Size Styles - The James Burvel O’Callaghan III Code. Dynamic styles based on passed props.
      A3_ButtonVariantDefinitions.variant[variant],
      A3_ButtonVariantDefinitions.size[size],

      // A3. Conditional Styles - The James Burvel O’Callaghan III Code. Styles based on state (isLoading, fullWidth).
      fullWidth && "w-full",
      isLoading && "cursor-not-allowed",

      // A4. GEIN and Futuristic Styles - The James Burvel O’Callaghan III Code.  Conceptual features.
      geinAdaptive && "transition-transform transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50",
      holographic && "holographic-effect", // Requires corresponding CSS implementation

      // A5. User-Provided Class Names - The James Burvel O’Callaghan III Code. Allows for maximum customization.
      className
    );

    // B. Rendering the Button - The James Burvel O’Callaghan III Code.
    // The core of the component, defining the button element and its behavior.
    return (
      <button
        className={A5A_buttonClasses}
        ref={ref}
        disabled={isLoading || props.disabled}
        data-gein-layer={geinLayer}
        {...props}
      >
        {/* B1. Conditional Rendering of Spinner - The James Burvel O’Callaghan III Code. Handles loading state. */}
        {isLoading ? <A2_Spinner /> : children}
      </button>
    );
  }
);

// C. Component Metadata - The James Burvel O’Callaghan III Code.
// Configuration for the component.
A5_Button.displayName = "A5_Button"; // Explicitly set the display name for debugging and React DevTools.

// D. Exporting the Component - The James Burvel O’Callaghan III Code.
// Makes the component available for import in other modules.
export { A5_Button };
```