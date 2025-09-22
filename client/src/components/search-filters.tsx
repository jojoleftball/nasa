
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

interface SearchFiltersProps {
  onSearch: (query: string, filters: any) => void;
}

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    yearRange: "All Years",
    organism: "All Organisms",
    experimentType: "All Types",
  });

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Card className="glass border-0">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search NASA space biology research..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={filters.yearRange} onValueChange={(value) => setFilters({ ...filters, yearRange: value })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Year Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Years">All Years</SelectItem>
                <SelectItem value="2020-2024">2020-2024</SelectItem>
                <SelectItem value="2015-2019">2015-2019</SelectItem>
                <SelectItem value="2010-2014">2010-2014</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.organism} onValueChange={(value) => setFilters({ ...filters, organism: value })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Organism" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Organisms">All Organisms</SelectItem>
                <SelectItem value="Plants">Plants</SelectItem>
                <SelectItem value="Humans">Humans</SelectItem>
                <SelectItem value="Microbes">Microbes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.experimentType} onValueChange={(value) => setFilters({ ...filters, experimentType: value })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Types">All Types</SelectItem>
                <SelectItem value="Microgravity">Microgravity</SelectItem>
                <SelectItem value="Radiation">Radiation</SelectItem>
                <SelectItem value="Growth">Growth</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleSearch} className="glow" data-testid="search-button">
              Search
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
