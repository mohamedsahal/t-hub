import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "destructive" | "ghost";
}

export function Spinner({
  className,
  size = "md",
  variant = "primary",
  ...props
}: SpinnerProps) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-10 w-10",
  };

  const variantClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    destructive: "text-destructive",
    ghost: "text-muted-foreground",
  };

  return (
    <div
      className={cn("animate-spin", variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      <Loader2 className="h-full w-full" />
    </div>
  );
}