import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Rocket, Brain, Search, BarChart3, MessageCircle, Globe, Database, Sparkles } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="cosmic-bg min-h-screen flex items-center justify-center relative">
        <div className="stars"></div>
        <div className="glass rounded-2xl p-8 animate-fade-in-scale">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-center mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="cosmic-bg min-h-screen relative">
      <div className="stars"></div>

      <div className="min-h-screen relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30">
                <Rocket className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                Biogalactic
              </h1>
            </div>
            <p className="text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              The Ultimate Space Biology Research Platform
            </p>
            <p className="text-lg text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
              Unlock the mysteries of life in space with our comprehensive AI-powered platform. Access real NASA research data, 
              discover groundbreaking studies, and gain insights that advance our understanding of space biology through 
              cutting-edge technology and intelligent analysis.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                className="glow-hover px-8 py-3 text-lg" 
                onClick={() => setLocation("/auth")}
                data-testid="button-sign-in"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Exploring
              </Button>
              <Button 
                size="lg" 
                variant="secondary" 
                className="glow-hover px-8 py-3 text-lg"
                onClick={() => setLocation("/auth")}
                data-testid="button-sign-up"
              >
                Join the Mission
              </Button>
            </div>
          </div>

          {/* About Section */}
          <div className="mb-16">
            <Card className="glass border-0 max-w-5xl mx-auto">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                    What is Biogalactic?
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Biogalactic is a revolutionary platform that democratizes access to space biology research. 
                    We've transformed NASA's Open Science Data Repository (OSDR) into an intuitive, AI-enhanced 
                    experience that makes complex space biology research accessible to scientists, students, and 
                    space enthusiasts worldwide.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">🚀 Real NASA Data</h3>
                    <p className="text-muted-foreground">
                      Access authentic research from NASA's Space Biology program, including studies on 
                      microgravity effects, radiation impact, and life support systems. All data is 
                      sourced directly from NASA's official repositories.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">🤖 AI-Powered Insights</h3>
                    <p className="text-muted-foreground">
                      Meet Ria, your intelligent research companion. She can explain complex concepts, 
                      summarize research findings, and help you discover connections between different studies.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">📊 Advanced Visualizations</h3>
                    <p className="text-muted-foreground">
                      Interactive charts and graphs make complex data patterns visible. Track research trends, 
                      compare study outcomes, and visualize the evolution of space biology over time.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">🔬 Comprehensive Coverage</h3>
                    <p className="text-muted-foreground">
                      From plant biology in microgravity to human physiological adaptations, explore 
                      research across all domains of space biology with sophisticated filtering and search capabilities.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              Platform Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Brain,
                  title: "AI Research Assistant",
                  description: "Intelligent chatbot that understands space biology and can answer complex research questions"
                },
                {
                  icon: Search,
                  title: "Smart Search & Filters",
                  description: "Advanced search with filters by organism, experiment type, year, and research focus"
                },
                {
                  icon: BarChart3,
                  title: "Data Visualization",
                  description: "Interactive charts showing research trends, publication timelines, and study distributions"
                },
                {
                  icon: Database,
                  title: "Real NASA Database",
                  description: "Direct access to NASA's Open Science Data Repository with over 2,800+ research studies"
                },
                {
                  icon: MessageCircle,
                  title: "Personalized Insights",
                  description: "Customized research recommendations based on your interests and research history"
                },
                {
                  icon: Globe,
                  title: "Global Accessibility",
                  description: "Web-based platform accessible from anywhere, making space research globally available"
                }
              ].map((feature, index) => (
                <Card key={index} className="glass border-0 hover:bg-primary/5 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="p-3 rounded-lg bg-primary/10 mx-auto w-fit mb-4">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="mb-16">
            <Card className="glass border-0 max-w-4xl mx-auto">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                  Research Database Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">2,847+</div>
                    <div className="text-muted-foreground">Research Studies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">15+</div>
                    <div className="text-muted-foreground">Research Categories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">25+</div>
                    <div className="text-muted-foreground">Years of Data</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">2025</div>
                    <div className="text-muted-foreground">Latest Studies</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mission Statement */}
          <div className="text-center">
            <Card className="glass border-0 max-w-4xl mx-auto">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                  Our Mission
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  To advance space biology research by making NASA's scientific data accessible, understandable, 
                  and actionable for researchers, educators, and space enthusiasts worldwide. We believe that 
                  by democratizing access to space biology research, we can accelerate discoveries that will 
                  enable sustainable human presence in space and advance life sciences on Earth.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="glow-hover" 
                    onClick={() => setLocation("/auth")}
                  >
                    Join Our Mission
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                © 2025 Biogalactic Team — Built with data from NASA's Open Science Data Repository (OSDR)
              </p>
              <p className="text-sm text-muted-foreground">
                Advancing space biology research through open science and AI innovation
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}