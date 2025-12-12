import React from 'react';

// Conditional className joiner
const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(' ');

// Simple loading spinner
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
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// All variants
const buttonVariants = {
  variant: {
    default: "bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm",
    destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    outline: "border border-cyan-500 bg-transparent hover:bg-cyan-500/10 text-cyan-400",
    secondary: "bg-gray-700 text-white hover:bg-gray-600 shadow-sm",
    ghost: "hover:bg-gray-700/80",
    link: "text-cyan-400 underline-offset-4 hover:underline",

    success: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
    warning: "bg-yellow-500 text-black hover:bg-yellow-600 shadow-sm",

    premium:
      "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg hover:shadow-cyan-500/50 transition-shadow",
    glass:
      "bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20",

    hftBuy:
      "bg-green-500 text-white font-mono tracking-wider hover:bg-green-400 active:bg-green-600 transform active:scale-95 transition-all duration-75",
    hftSell:
      "bg-red-500 text-white font-mono tracking-wider hover:bg-red-400 active:bg-red-600 transform active:scale-95 transition-all duration-75",

    // GEIN 1â€“35 (complete)
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
    'gein-35': 'bg-sky-600 text-white hover:bg-sky-700'
  },

  size: {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-12 px-6 text-lg",
    icon: "h-10 w-10 p-0"
  }
};

// Final Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = "default",
  size = "default",
  isLoading = false,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none",
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
};