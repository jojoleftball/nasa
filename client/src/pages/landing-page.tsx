import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Brain, Search, BarChart3, MessageCircle, Globe, Database, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { 
  CosmicPageWrapper, 
  AnimatedDiv, 
  AnimatedCard, 
  StaggeredContainer,
  FloatingElement,
  GlowingElement,
  RevealText,
  LoadingSkeleton,
  fadeInUp,
  slideInLeft,
  slideInRight,
  scaleIn
} from "@/components/ui/animated-components";

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
      <CosmicPageWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <AnimatedDiv variants={scaleIn} className="glass rounded-2xl p-8">
            <GlowingElement>
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            </GlowingElement>
            <p className="text-center mt-4 text-muted-foreground">
              Loading experience...
            </p>
          </AnimatedDiv>
        </div>
      </CosmicPageWrapper>
    );
  }

  if (user) {
    return null;
  }

  return (
    <CosmicPageWrapper>
      <div className="min-h-screen relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-16">
          <StaggeredContainer className="text-center mb-16">
            <AnimatedDiv variants={fadeInUp} delay={0.2} className="flex items-center justify-center mb-6">
              <FloatingElement>
                <GlowingElement>
                  <Logo size="2xl" textClassName="text-6xl font-extrabold" showText={true} />
                </GlowingElement>
              </FloatingElement>
            </AnimatedDiv>
            
            <AnimatedDiv variants={fadeInUp} delay={0.4}>
              <p className="text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                The Ultimate Space Biology Research Platform
              </p>
            </AnimatedDiv>
            
            <AnimatedDiv variants={fadeInUp} delay={0.6}>
              <p className="text-lg text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
                Unlock the mysteries of life in space with our comprehensive AI-powered platform. Access real NASA research data, 
                discover groundbreaking studies, and gain insights that advance our understanding of space biology through 
                cutting-edge technology and intelligent analysis.
              </p>
            </AnimatedDiv>
            
            <AnimatedDiv variants={fadeInUp} delay={0.8} className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                className="glow-hover cosmic-glow px-8 py-3 text-lg" 
                onClick={() => setLocation("/auth")}
                data-testid="button-sign-in"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Exploring
              </Button>
              <Button 
                size="lg" 
                variant="secondary" 
                className="glow-hover shimmer-effect px-8 py-3 text-lg"
                onClick={() => setLocation("/auth")}
                data-testid="button-sign-up"
              >
                Join the Mission
              </Button>
            </AnimatedDiv>
          </StaggeredContainer>


          {/* Features Grid */}
          <AnimatedDiv variants={fadeInUp} delay={0.2} className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 cosmic-text-gradient">
              Platform Features
            </h2>
            <StaggeredContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <AnimatedCard 
                  key={index} 
                  delay={index * 0.1}
                  className="glass border-0 cosmic-border shimmer-effect group"
                >
                  <CardContent className="p-6 text-center">
                    <FloatingElement>
                      <div className="p-3 rounded-lg bg-primary/10 mx-auto w-fit mb-4 cosmic-glow">
                        <feature.icon className="h-8 w-8 text-primary group-hover:text-galaxy-core transition-colors duration-300" />
                      </div>
                    </FloatingElement>
                    <h3 className="font-semibold mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </AnimatedCard>
              ))}
            </StaggeredContainer>
          </AnimatedDiv>

          {/* Stats Section */}
          <AnimatedDiv variants={slideInLeft} delay={0.3} className="mb-16">
            <AnimatedCard className="glass border-0 max-w-4xl mx-auto cosmic-border">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-center mb-8 cosmic-text-gradient">
                  Research Database Statistics
                </h2>
                <StaggeredContainer className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <AnimatedDiv variants={scaleIn} delay={0.1} className="text-center">
                    <GlowingElement>
                      <div className="text-4xl font-bold text-primary mb-2 cosmic-glow">2,847+</div>
                    </GlowingElement>
                    <div className="text-muted-foreground">Research Studies</div>
                  </AnimatedDiv>
                  <AnimatedDiv variants={scaleIn} delay={0.2} className="text-center">
                    <GlowingElement>
                      <div className="text-4xl font-bold text-primary mb-2 cosmic-glow">15+</div>
                    </GlowingElement>
                    <div className="text-muted-foreground">Research Categories</div>
                  </AnimatedDiv>
                  <AnimatedDiv variants={scaleIn} delay={0.3} className="text-center">
                    <GlowingElement>
                      <div className="text-4xl font-bold text-primary mb-2 cosmic-glow">25+</div>
                    </GlowingElement>
                    <div className="text-muted-foreground">Years of Data</div>
                  </AnimatedDiv>
                  <AnimatedDiv variants={scaleIn} delay={0.4} className="text-center">
                    <GlowingElement>
                      <div className="text-4xl font-bold text-primary mb-2 cosmic-glow">2025</div>
                    </GlowingElement>
                    <div className="text-muted-foreground">Latest Studies</div>
                  </AnimatedDiv>
                </StaggeredContainer>
              </CardContent>
            </AnimatedCard>
          </AnimatedDiv>

          {}
          <AnimatedDiv variants={slideInRight} delay={0.4} className="text-center">
            <AnimatedCard className="glass border-0 max-w-4xl mx-auto cosmic-border shimmer-effect">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6 cosmic-text-gradient">
                  Our Mission
                </h2>
                <AnimatedDiv variants={fadeInUp} delay={0.8}>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    To advance space biology research by making NASA's scientific data accessible, understandable, 
                    and actionable for researchers, educators, and space enthusiasts worldwide. We believe that 
                    by democratizing access to space biology research, we can accelerate discoveries that will 
                    enable sustainable human presence in space and advance life sciences on Earth.
                  </p>
                </AnimatedDiv>
                <AnimatedDiv variants={scaleIn} delay={1.0} className="flex gap-4 justify-center">
                  <FloatingElement>
                    <Button 
                      size="lg" 
                      className="glow-hover cosmic-glow shimmer-effect" 
                      onClick={() => setLocation("/auth")}
                    >
                      Join Our Mission
                    </Button>
                  </FloatingElement>
                </AnimatedDiv>
              </CardContent>
            </AnimatedCard>
          </AnimatedDiv>
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
    </CosmicPageWrapper>
  );
}