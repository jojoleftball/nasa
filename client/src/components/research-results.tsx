import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Tags, ExternalLink, ChevronDown, ChevronUp, Users, Building, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Study = {
  id: string;
  title: string;
  abstract: string;
  year: number;
  authors: string[];
  institution: string;
  tags: string[];
  url: string;
};

type SearchResults = {
  query: string;
  filters: any;
  results: Study[];
  totalCount: number;
};

type ResearchResultsProps = {
  query: string;
  filters: any;
};

export function ResearchResults({ query, filters }: ResearchResultsProps) {
  const { toast } = useToast();
  const [results, setResults] = useState<SearchResults | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  const searchMutation = useMutation({
    mutationFn: async ({ query, filters }: { query: string; filters: any }) => {
      const res = await apiRequest("POST", "/api/search", { query, filters });
      return await res.json();
    },
    onSuccess: (data: SearchResults) => {
      setResults(data);
      setHasSearched(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async (study: Study) => {
      const res = await apiRequest("POST", "/api/favorites", {
        studyId: study.id,
        studyTitle: study.title,
        studyData: study,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to favorites",
        description: "Study has been saved to your favorites.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add favorite",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (query || Object.values(filters).some(f => f !== "All Years" && f !== "All Organisms" && f !== "All Types")) {
      searchMutation.mutate({ query, filters });
    }
  }, [query, filters]);

  const toggleExpanded = (studyId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studyId)) {
        newSet.delete(studyId);
      } else {
        newSet.add(studyId);
      }
      return newSet;
    });
  };

  const addToFavorites = (study: Study) => {
    favoriteMutation.mutate(study);
  };

  if (searchMutation.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Searching NASA database...</p>
        </div>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="text-center py-12">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <ExternalLink className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium">Ready to Explore</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Use the search bar above to find relevant NASA space biology research studies. 
            Apply filters to narrow down your results.
          </p>
        </div>
      </div>
    );
  }

  if (!results || results.results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
            <ExternalLink className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No Results Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            No studies found matching your search criteria. Try adjusting your search terms or filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found {results.totalCount} result{results.totalCount !== 1 ? 's' : ''} 
          {results.query && ` for "${results.query}"`}
        </p>
      </div>

      <AnimatePresence>
        <div className="space-y-6">
          {results.results.map((study, index) => {
            const isExpanded = expandedCards.has(study.id);
            
            return (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="glass rounded-xl glow-hover cursor-pointer border-0"
                  data-testid={`research-card-${study.id}`}
                >
                  <CardContent className="p-6">
                    <div onClick={() => toggleExpanded(study.id)}>
                      <h3 className="text-xl font-semibold mb-3 hover:text-primary transition-colors">
                        {study.title}
                      </h3>
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {study.abstract}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {study.year}
                        </span>
                        <span className="flex items-center">
                          <Tags className="h-4 w-4 mr-1" />
                          {study.tags.join(", ")}
                        </span>
                        <a 
                          href={study.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Source
                        </a>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToFavorites(study);
                          }}
                          disabled={favoriteMutation.isPending}
                          data-testid={`button-favorite-${study.id}`}
                        >
                          Add to Favorites
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleExpanded(study.id)}
                          className="text-primary hover:text-primary/80"
                          data-testid={`button-expand-${study.id}`}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Collapse
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Expand
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t border-border overflow-hidden"
                        >
                          <div className="space-y-4 text-sm">
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Full Abstract</h4>
                              <p className="text-muted-foreground">{study.abstract}</p>
                            </div>
                            
                            <div className="flex items-center space-x-6 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                Authors: {study.authors.join(", ")}
                              </span>
                              <span className="flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                {study.institution}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
      
      {results.results.length > 0 && (
        <div className="text-center pt-8">
          <Button 
            variant="secondary" 
            className="glow-hover"
            data-testid="button-load-more"
          >
            Load More Results
          </Button>
        </div>
      )}
    </div>
  );
}
