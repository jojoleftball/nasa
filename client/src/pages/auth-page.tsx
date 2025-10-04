
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2, Brain, Search, BarChart3, MessageCircle, Shield, Users, Globe } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username too long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const features = [
  {
    icon: Brain,
    title: "AI Research Assistant",
    description: "Meet Ria, your intelligent guide through space biology research"
  },
  {
    icon: Search,
    title: "Advanced Search",
    description: "Find relevant NASA studies with powerful filtering and categorization"
  },
  {
    icon: BarChart3,
    title: "Data Visualization",
    description: "Interactive charts and graphs to understand research trends"
  },
  {
    icon: MessageCircle,
    title: "Smart Insights",
    description: "Get explanations and interpretations of complex research data"
  },
  {
    icon: Users,
    title: "Personalized Experience",
    description: "Customized recommendations based on your research interests"
  },
  {
    icon: Globe,
    title: "Real NASA Data",
    description: "Access authentic space biology research from NASA's OSDR database"
  }
];

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect new users to interests page if they haven't set any interests
      // Otherwise redirect to dashboard for existing users
      if (!user.interests || user.interests.length === 0) {
        setLocation("/interests");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, isLoading, setLocation]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  if (isLoading || user) {
    return null;
  }

  return (
    <div className="cosmic-bg min-h-screen relative">
      <div className="stars"></div>
      
      <div className="min-h-screen flex relative z-10">
        {/* Left Side - Branding and Features */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12">
          <div className="max-w-lg">
            {/* Project Branding */}
            <div className="mb-12">
              <div className="mb-6">
                <Logo size="lg" textClassName="text-4xl" showText={true} />
                <p className="text-sm text-muted-foreground mt-3 ml-1">Space Biology Research Platform</p>
              </div>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Explore the cosmos of space biology research with our AI-powered platform. 
                Access real NASA data, discover groundbreaking studies, and unlock insights 
                that shape our understanding of life beyond Earth.
              </p>
            </div>

            {/* Features Grid */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Platform Features</h3>
              <div className="grid grid-cols-1 gap-4">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg glass border-0 hover:bg-primary/5 transition-all duration-300"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">2,847+</div>
                <div className="text-sm text-muted-foreground">Research Papers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">15+</div>
                <div className="text-sm text-muted-foreground">Research Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">2025</div>
                <div className="text-sm text-muted-foreground">Latest Studies</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Mobile Branding */}
            <div className="text-center mb-8 lg:hidden">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                  Biogalactic
                </h1>
              </div>
              <p className="text-muted-foreground">
                Access NASA's space biology research platform
              </p>
            </div>

            <Card className="glass border-0 animate-fade-in-scale">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome</CardTitle>
                <CardDescription>
                  Sign in to your account or create a new one to start exploring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
                    <TabsTrigger value="register" data-testid="tab-register">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="usernameOrEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username or Email</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter username or email" 
                                  {...field}
                                  data-testid="input-username-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Enter password" 
                                  {...field}
                                  data-testid="input-password"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full glow" 
                          disabled={loginMutation.isPending}
                          data-testid="button-submit-login"
                        >
                          {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Sign In to Explore
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Choose a username" 
                                  {...field}
                                  data-testid="input-username"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="Enter your email" 
                                  {...field}
                                  data-testid="input-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Create a password (8+ characters)" 
                                  {...field}
                                  data-testid="input-register-password"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Confirm your password" 
                                  {...field}
                                  data-testid="input-confirm-password"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full glow" 
                          disabled={registerMutation.isPending}
                          data-testid="button-submit-register"
                        >
                          {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Create Account & Start Exploring
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>

                {/* Security & Trust Indicators */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    <span>Secure authentication with encrypted data</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                © 2025 Biogalactic Team. Built with data from NASA's Open Science Data Repository (OSDR).
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Advancing space biology research through open science and AI innovation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
