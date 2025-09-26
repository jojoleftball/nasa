import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Sprout, UserMinus, Weight, Radiation, Microscope, Dna } from "lucide-react";

const interestOptions = [
  { id: "plant-biology", label: "Plant Biology", icon: Sprout },
  { id: "human-health", label: "Human Health", icon: UserMinus },
  { id: "microgravity-effects", label: "Microgravity Effects", icon: Weight },
  { id: "radiation-studies", label: "Radiation Studies", icon: Radiation },
  { id: "microbiology", label: "Microbiology", icon: Microscope },
  { id: "genetics", label: "Genetics", icon: Dna },
];

export default function InterestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests || []);

  const updateInterestsMutation = useMutation({
    mutationFn: async (interests: string[]) => {
      const res = await apiRequest("PUT", "/api/user/profile", { interests });
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["user"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Interests saved!",
        description: "Your preferences have been updated successfully.",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save interests",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleContinue = () => {
    updateInterestsMutation.mutate(selectedInterests);
  };

  const handleSkip = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="cosmic-bg min-h-screen relative">
      <div className="stars"></div>
      
      <div className="min-h-screen flex items-center justify-center relative z-10 p-4">
        <Card className="glass rounded-2xl p-8 w-full max-w-4xl mx-4 animate-slide-in-right border-0">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Choose Your Space Biology Interests</h2>
            <p className="text-muted-foreground">
              Select topics that interest you for personalized recommendations
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {interestOptions.map((interest) => {
              const IconComponent = interest.icon;
              const isSelected = selectedInterests.includes(interest.id);
              
              return (
                <Card
                  key={interest.id}
                  className={`glass rounded-lg p-4 cursor-pointer transition-all glow-hover border-0 ${
                    isSelected ? 'bg-primary/20 ring-2 ring-primary' : ''
                  }`}
                  onClick={() => toggleInterest(interest.id)}
                  data-testid={`interest-${interest.id}`}
                >
                  <div className="text-center">
                    <IconComponent className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-medium">{interest.label}</h3>
                  </div>
                </Card>
              );
            })}
          </div>
          
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={handleSkip}
              data-testid="button-skip"
            >
              Skip for now
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
            </div>
            
            <Button
              onClick={handleContinue}
              disabled={updateInterestsMutation.isPending}
              className="glow"
              data-testid="button-continue"
            >
              Continue to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
