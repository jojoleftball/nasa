import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || user) {
    return null;
  }

  return (
    <div className="cosmic-bg min-h-screen relative">
      <div className="stars"></div>
      
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            Biogalactic
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Explore NASA's space biology research database with AI-powered insights
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="glow-hover" 
              onClick={() => setLocation("/auth")}
              data-testid="button-sign-in"
            >
              Sign In
            </Button>
            <Button 
              size="lg" 
              variant="secondary" 
              className="glow-hover"
              onClick={() => setLocation("/auth")}
              data-testid="button-sign-up"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
