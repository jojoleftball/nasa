import { cn } from "@/lib/utils";
import logoImage from "@assets/Untitled58_20251004120941_1759571667227.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

const sizeClasses = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-20 w-20",
  xl: "h-24 w-24",
  "2xl": "h-32 w-32",
};

export function Logo({ 
  size = "md", 
  className,
  showText = true,
  textClassName
}: LogoProps) {
  return (
    <div className="flex items-center gap-4">
      <img
        src={logoImage}
        alt="Biogalactic Logo"
        className={cn(
          sizeClasses[size],
          "object-contain",
          "brightness-90 contrast-125 saturate-150",
          "dark:brightness-110 dark:contrast-110 dark:saturate-100",
          "mix-blend-screen",
          "transition-all duration-300",
          "drop-shadow-lg",
          className
        )}
        data-testid="img-logo"
      />
      {showText && (
        <div>
          <h1 className={cn("text-2xl font-bold", textClassName)} style={{
            background: 'linear-gradient(135deg, hsl(270, 100%, 75%), hsl(220, 100%, 65%), hsl(270, 100%, 75%))',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent'
          }}>
            Biogalactic
          </h1>
        </div>
      )}
    </div>
  );
}
