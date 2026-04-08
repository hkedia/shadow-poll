import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md";
  className?: string;
}

export function Spinner({ size = "sm", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block rounded-full border-2 border-primary/30 border-t-primary animate-spin",
        size === "sm" && "h-5 w-5",
        size === "md" && "h-8 w-8",
        className
      )}
    />
  );
}
