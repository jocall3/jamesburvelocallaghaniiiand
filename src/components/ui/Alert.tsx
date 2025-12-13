import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils"; // Assuming a utility for merging class names
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

/**
 * Defines the visual styles for the Alert component variants.
 * Uses class-variance-authority (cva) for a clean, scalable approach.
 */
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        info: "bg-background border-blue-500/50 text-foreground [&>svg]:text-blue-500",
        success: "bg-background border-green-500/50 text-foreground [&>svg]:text-green-500",
        warning: "bg-background border-yellow-500/50 text-foreground [&>svg]:text-yellow-500",
        error: "bg-background border-red-500/50 text-foreground [&>svg]:text-red-500",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

/**
 * A map of variant names to their corresponding Lucide icons.
 */
const iconMap: Record<NonNullable<VariantProps<typeof alertVariants>["variant"]>, React.ReactNode> = {
  info: <Info className="h-4 w-4" />,
  success: <CheckCircle2 className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
};

/**
 * The main Alert component. It acts as a container and sets the variant context.
 * It's designed to be composed with AlertTitle and AlertDescription.
 */
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, children, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  >
    {iconMap[variant || "info"]}
    <div className="flex flex-col">
      {children}
    </div>
  </div>
));
Alert.displayName = "Alert";

/**
 * A sub-component for the Alert's title.
 * Should be used inside the Alert component for proper styling and semantics.
 */
const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

/**
 * A sub-component for the Alert's description or main content.
 * Should be used inside the Alert component.
 */
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };