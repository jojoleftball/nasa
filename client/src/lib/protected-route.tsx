import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route } from "wouter";
import LandingPage from "@/pages/landing-page";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="cosmic-bg min-h-screen flex items-center justify-center relative">
          <div className="stars"></div>
          <div className="glass rounded-2xl p-8 animate-fade-in-scale">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-center mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <LandingPage />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
