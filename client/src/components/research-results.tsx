import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { ExternalLink, Heart, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface ResearchResultsProps {
  query: string;
  filters: any;
}

export function ResearchResults({ query, filters }: ResearchResultsProps) {
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/search", query, filters],
    queryFn: async () => {
      if (!query && Object.values(filters).every(f => f.startsWith("All"))) {
        return { results: [], totalCount: 0 };
      }
      const res = await apiRequest("POST", "/api/search", { query, filters });
      return await res.json();
    },
    enabled: !!(query || !Object.values(filters).every(f => f.startsWith("All"))),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="glass border-0 animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const results = searchResults?.results || [];

  if (results.length === 0) {
    return (
      <Card className="glass border-0">
        <CardContent className="p-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Results Found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or filters to find relevant studies.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Research Results ({searchResults?.totalCount || 0})
        </h2>
      </div>

      <div className="space-y-4">
        {results.map((study: any, index: number) => (
          <motion.div
            key={study.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass border-0 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{study.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span>{study.year}</span>
                      <span>•</span>
                      <span>{study.institution}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {study.authors?.join(", ")}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {study.abstract}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {study.tags?.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Button variant="outline" size="sm" asChild>
                    <a href={study.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Study
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}