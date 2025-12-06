
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const useHighFrequencyIndicator = (value?: number) => {
  const [change, setChange] = React.useState<"up" | "down" | "stale">("stale");
  const prevValueRef = React.useRef(value);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (typeof value === "number" && typeof prevValueRef.current === "number") {
      if (value > prevValueRef.current) {
        setChange("up");
      } else if (value < prevValueRef.current) {
        setChange("down");
      }
    }

    prevValueRef.current = value;
    timeoutRef.current = setTimeout(() => setChange("stale"), 750);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value]);

  return change;
};

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        live: "border-cyan-500/50 bg-cyan-900/20 text-cyan-300 animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  liveValue?: number;
  variant?: "default" | "secondary" | "destructive" | "outline" | "live" | null | undefined;
  className?: string;
}

function Badge({ className, variant, liveValue, ...props }: BadgeProps) {
  const changeState = useHighFrequencyIndicator(liveValue);

  const dynamicIndicatorClasses = {
    up: "bg-green-500/90 border-green-400 text-white shadow-lg shadow-green-500/50 scale-110",
    down: "bg-red-500/90 border-red-400 text-white shadow-lg shadow-red-500/50 scale-110",
    stale: "",
  }[changeState];

  return (
    <div
      className={cn(
        badgeVariants({ variant }),
        dynamicIndicatorClasses,
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
