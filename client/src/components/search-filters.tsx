import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

type Filters = {
  yearRange: string;
  organism: string;
  experimentType: string;
};

type SearchFiltersProps = {
  onSearch: (query: string, filters: Filters) => void;
};

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    yearRange: "All Years",
    organism: "All Organisms",
    experimentType: "All Types",
  });

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      yearRange: "All Years",
      organism: "All Organisms",
      experimentType: "All Types",
    };
    setFilters(clearedFilters);
    setQuery("");
    onSearch("", clearedFilters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search NASA Bioscience Database..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full px-6 py-4 bg-card border border-border rounded-xl text-lg pl-12 focus:ring-2 focus:ring-ring"
          data-testid="input-search"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Button 
          onClick={handleSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 glow"
          data-testid="button-search"
        >
          Search
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Label className="text-sm font-medium whitespace-nowrap">Year Range:</Label>
          <Select 
            value={filters.yearRange} 
            onValueChange={(value) => setFilters({ ...filters, yearRange: value })}
          >
            <SelectTrigger className="w-32" data-testid="select-year-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass border-border">
              <SelectItem value="All Years">All Years</SelectItem>
              <SelectItem value="2020-2024">2020-2024</SelectItem>
              <SelectItem value="2015-2019">2015-2019</SelectItem>
              <SelectItem value="2010-2014">2010-2014</SelectItem>
              <SelectItem value="2005-2009">2005-2009</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Label className="text-sm font-medium whitespace-nowrap">Organism:</Label>
          <Select 
            value={filters.organism} 
            onValueChange={(value) => setFilters({ ...filters, organism: value })}
          >
            <SelectTrigger className="w-32" data-testid="select-organism">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass border-border">
              <SelectItem value="All Organisms">All Organisms</SelectItem>
              <SelectItem value="Humans">Humans</SelectItem>
              <SelectItem value="Plants">Plants</SelectItem>
              <SelectItem value="Microbes">Microbes</SelectItem>
              <SelectItem value="Animals">Animals</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Label className="text-sm font-medium whitespace-nowrap">Experiment Type:</Label>
          <Select 
            value={filters.experimentType} 
            onValueChange={(value) => setFilters({ ...filters, experimentType: value })}
          >
            <SelectTrigger className="w-36" data-testid="select-experiment-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass border-border">
              <SelectItem value="All Types">All Types</SelectItem>
              <SelectItem value="Microgravity">Microgravity</SelectItem>
              <SelectItem value="Radiation">Radiation</SelectItem>
              <SelectItem value="Life Support">Life Support</SelectItem>
              <SelectItem value="Plant Growth">Plant Growth</SelectItem>
              <SelectItem value="Cell Biology">Cell Biology</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={clearFilters}
          className="text-muted-foreground hover:text-primary"
          data-testid="button-clear-filters"
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
