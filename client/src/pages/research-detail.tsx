import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, ExternalLink, Star, Sparkles, AlertCircle, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ResearchDetailPage() {
  const [, params] = useRoute("/research/:id");
  const researchId = params?.id;
  const { toast } = useToast();
  const [suggestionType, setSuggestionType] = useState("suggest");
  const [message, setMessage] = useState("");

  const { data: research, isLoading } = useQuery<any>({
    queryKey: ["/api/research", researchId],
    enabled: !!researchId,
  });

  const suggestionMutation = useMutation({
    mutationFn: async (data: { researchId: string; type: string; message: string }) => {
      const res = await apiRequest("POST", "/api/suggestions", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Your suggestion has been sent to admins!" });
      setMessage("");
      setSuggestionType("suggest");
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a message" });
      return;
    }
    if (!researchId) return;
    suggestionMutation.mutate({ researchId, type: suggestionType, message: message.trim() });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen cosmic-bg relative overflow-hidden">
        <div className="stars"></div>
        <div className="relative z-10 p-4 sm:p-8 max-w-6xl mx-auto">
          <Card className="glass border-0 animate-pulse">
            <CardHeader>
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-4/6"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!research) {
    return (
      <div className="min-h-screen cosmic-bg relative overflow-hidden">
        <div className="stars"></div>
        <div className="relative z-10 p-4 sm:p-8 max-w-6xl mx-auto">
          <Card className="glass border-0">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">Research Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The research you're looking for doesn't exist or has been removed.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg relative overflow-hidden">
      <div className="stars"></div>
      <div className="relative z-10 p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button asChild variant="ghost" className="mb-4" data-testid="button-back">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          <Card className={`glass border-0 ${research.isAdminCreated ? 'cosmic-border cosmic-glow' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <CardTitle className="text-3xl cosmic-text-gradient" data-testid="text-title">
                      {research.title}
                    </CardTitle>
                    {research.isAdminCreated && (
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">
                    {research.year && <span data-testid="text-year">{research.year}</span>}
                    {research.year && research.institution && <span className="mx-2">•</span>}
                    {research.institution && <span data-testid="text-institution">{research.institution}</span>}
                    {research.isAdminCreated && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-purple-400 flex items-center gap-1 inline-flex">
                          <Sparkles className="w-3 h-3" />
                          Curated by Experts
                        </span>
                      </>
                    )}
                  </CardDescription>
                </div>
              </div>

              {research.authors && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Scientists/Authors</h3>
                  <p className="text-base" data-testid="text-authors">{research.authors}</p>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-description">
                  {research.description || research.abstract}
                </p>
              </div>

              {research.osdStudyNumber && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">OSD Study Number</h3>
                  <p className="text-muted-foreground" data-testid="text-osd-number">{research.osdStudyNumber}</p>
                </div>
              )}

              {research.tags && research.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {research.tags.map((tag: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={`${research.isAdminCreated ? 'bg-purple-600/30 text-purple-300' : ''}`}
                        data-testid={`badge-tag-${index}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {research.nasaOsdrLinks && research.nasaOsdrLinks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">NASA OSDR Links</h3>
                  <div className="space-y-2">
                    {research.nasaOsdrLinks.map((link: string, index: number) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline block flex items-center gap-2"
                        data-testid={`link-osdr-${index}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {research.url && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Study Link</h3>
                  <Button variant="outline" asChild>
                    <a 
                      href={research.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      data-testid="button-view-study"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Study
                    </a>
                  </Button>
                </div>
              )}

              {research.customFields && Object.keys(research.customFields).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
                  <div className="space-y-2">
                    {Object.entries(research.customFields).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex gap-2">
                        <span className="font-medium text-muted-foreground">{key}:</span>
                        <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Report or Suggest an Edit
              </CardTitle>
              <CardDescription>
                Help us improve this research entry by reporting issues or suggesting edits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={suggestionType} onValueChange={setSuggestionType}>
                    <SelectTrigger id="type" data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suggest">
                        <span className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Suggest an Edit
                        </span>
                      </SelectItem>
                      <SelectItem value="report">
                        <span className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Report a Problem
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder={
                      suggestionType === "suggest"
                        ? "Describe your suggested edit..."
                        : "Describe the problem you found..."
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="glass border-0"
                    data-testid="textarea-message"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={suggestionMutation.isPending}
                  data-testid="button-submit"
                >
                  {suggestionMutation.isPending ? "Sending..." : "Send to Admins"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
