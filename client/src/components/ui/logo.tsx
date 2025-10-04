import { cn } from "@/lib/utils";
import logoImage from "@assets/Untitled58_20251004120941_1759571667227.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

export function Logo({ 
  size = "md", 
  className,
  showText = true,
  textClassName
}: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "relative overflow-hidden rounded-xl backdrop-blur-sm border border-primary/30 p-2",
        "bg-gradient-to-br from-primary/10 to-primary/5",
        className
      )}>
        <img
          src={logoImage}
          alt="Biogalactic Logo"
          className={cn(
            sizeClasses[size],
            "object-contain",
            "brightness-90 contrast-125 saturate-150",
            "dark:brightness-110 dark:contrast-110 dark:saturate-100",
            "mix-blend-screen",
            "transition-all duration-300"
          )}
          data-testid="img-logo"
        />
      </div>
      {showText && (
        <div className={cn(textClassName)}>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            Biogalactic
          </h1>
        </div>
      )}
    </div>
  );
}
