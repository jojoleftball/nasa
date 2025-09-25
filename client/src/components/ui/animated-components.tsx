import { motion, AnimatePresence, Variants } from "framer-motion";
import { forwardRef, ReactNode } from "react";

// Animation variants for different effects
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20, filter: "blur(4px)" },
  animate: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    filter: "blur(4px)",
    transition: { duration: 0.3 }
  }
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -60, filter: "blur(4px)" },
  animate: { 
    opacity: 1, 
    x: 0, 
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
  },
  exit: { 
    opacity: 0, 
    x: -60, 
    filter: "blur(4px)",
    transition: { duration: 0.3 }
  }
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 60, filter: "blur(4px)" },
  animate: { 
    opacity: 1, 
    x: 0, 
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
  },
  exit: { 
    opacity: 0, 
    x: 60, 
    filter: "blur(4px)",
    transition: { duration: 0.3 }
  }
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.8, filter: "blur(4px)" },
  animate: { 
    opacity: 1, 
    scale: 1, 
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    filter: "blur(4px)",
    transition: { duration: 0.3 }
  }
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

export const floatingAnimation: Variants = {
  initial: { y: 0 },
  animate: { 
    y: [-5, 5, -5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const glowPulse: Variants = {
  initial: { filter: "drop-shadow(0 0 0px hsl(var(--primary)))" },
  animate: { 
    filter: [
      "drop-shadow(0 0 10px hsl(var(--primary) / 0.3))",
      "drop-shadow(0 0 20px hsl(var(--primary) / 0.5))",
      "drop-shadow(0 0 10px hsl(var(--primary) / 0.3))"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Reusable animated components
interface AnimatedDivProps {
  children: ReactNode;
  variants?: Variants;
  delay?: number;
  className?: string;
  [key: string]: any;
}

export const AnimatedDiv = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, variants = fadeInUp, delay = 0, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, delay = 0, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ 
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedDivProps>(
  ({ children, className, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 10px 30px hsl(var(--primary) / 0.3)",
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.95 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
);

export const PageTransition = ({ children, ...props }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
    animate={{ 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
    }}
    exit={{ 
      opacity: 0, 
      y: -20, 
      filter: "blur(10px)",
      transition: { duration: 0.4 }
    }}
    {...props}
  >
    {children}
  </motion.div>
);

export const StaggeredContainer = ({ children, className, ...props }: { children: ReactNode; className?: string }) => (
  <motion.div
    variants={staggerContainer}
    initial="initial"
    animate="animate"
    exit="exit"
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export const FloatingElement = ({ children, className, ...props }: { children: ReactNode; className?: string }) => (
  <motion.div
    variants={floatingAnimation}
    initial="initial"
    animate="animate"
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export const GlowingElement = ({ children, className, ...props }: { children: ReactNode; className?: string }) => (
  <motion.div
    variants={glowPulse}
    initial="initial"
    animate="animate"
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Page wrapper with cosmic animations
export const CosmicPageWrapper = ({ children }: { children: ReactNode }) => (
  <div className="cosmic-bg min-h-screen relative">
    <div className="stars"></div>
    <PageTransition>
      <div className="relative z-10">
        {children}
      </div>
    </PageTransition>
  </div>
);

// Modal/Dialog animations
export const ModalOverlay = ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Loading skeleton with shimmer
export const LoadingSkeleton = ({ className, ...props }: { className?: string }) => (
  <motion.div
    className={`loading-cosmic rounded-md ${className}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    {...props}
  />
);

// Text reveal animation
export const RevealText = ({ children, delay = 0 }: { children: string; delay?: number }) => {
  const letters = children.split("");
  
  return (
    <motion.span
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      style={{ display: "inline-block" }}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          variants={{
            initial: { opacity: 0, y: 20 },
            animate: { 
              opacity: 1, 
              y: 0,
              transition: { delay: delay + index * 0.05 }
            }
          }}
          style={{ display: "inline-block" }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.span>
  );
};

AnimatedDiv.displayName = "AnimatedDiv";
AnimatedCard.displayName = "AnimatedCard";
AnimatedButton.displayName = "AnimatedButton";