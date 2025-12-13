/**
 * A utility function for conditionally joining Tailwind CSS classes.
 *
 * @param args - A list of class names or objects where keys are class names and values are booleans.
 * @returns A string of joined class names.
 */
export function cn(...args: ClassValue[]): string {
  return twMerge(args);
}

// --- Dependencies ---

// This is a placeholder for the actual `twMerge` function from the `tailwind-merge` library.
// In a real project, you would install and import it:
// import { twMerge } from 'tailwind-merge';
// For this example, we'll provide a simplified mock implementation.

type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | { [key: string]: any };

function twMerge(classes: ClassValue[]): string {
  const validClasses: string[] = [];

  for (const classValue of classes) {
    if (typeof classValue === 'string' && classValue.length > 0) {
      validClasses.push(classValue);
    } else if (typeof classValue === 'object' && classValue !== null) {
      for (const key in classValue) {
        if (Object.prototype.hasOwnProperty.call(classValue, key) && classValue[key]) {
          validClasses.push(key);
        }
      }
    }
  }

  // In a real `twMerge`, this would handle conflicts and ordering.
  // For this mock, we'll just join them with spaces.
  return validClasses.join(' ');
}

// --- Example Usage (for demonstration, not part of the final output) ---
/*
// Assuming you have Tailwind CSS configured in your project.

// Example 1: Simple joining
const baseClasses = "text-blue-500 font-bold";
const hoverClasses = "hover:text-blue-700";
const combined = cn(baseClasses, hoverClasses);
// combined will be "text-blue-500 font-bold hover:text-blue-700"

// Example 2: Conditional classes
const isActive = true;
const isDisabled = false;
const conditional = cn("p-4", isActive && "bg-green-500", isDisabled && "opacity-50");
// conditional will be "p-4 bg-green-500"

// Example 3: Object syntax for conditional classes
const variant = "primary";
const buttonClasses = cn(
  "py-2 px-4 rounded",
  {
    "bg-blue-500 text-white": variant === "primary",
    "bg-gray-200 text-gray-800": variant === "secondary",
  },
  "focus:outline-none focus:ring-2 focus:ring-offset-2"
);
// If variant is "primary", buttonClasses will be "py-2 px-4 rounded bg-blue-500 text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
*/