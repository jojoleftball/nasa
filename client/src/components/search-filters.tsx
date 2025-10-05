import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  X, 
  SortAsc, 
  SortDesc, 
  Calendar,
  Save,
  History,
  Settings2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchFiltersProps {
  onSearch: (query: string, filters: any, sortOptions: any) => void;
}

interface AdvancedFilters {
  yearRange: string;
  organism: string[];
  experimentType: string[];
  mission: string[];
  tissueType: string[];
  researchArea: string[];
  publicationStatus: string;
  customDateRange: {
    start: string;
    end: string;
  };
  keywords: string[];
}

interface SortOptions {
  sortBy: string;
  sortOrder: string;
  secondarySort?: string;
}

interface FilterOptions {
  organisms: string[];
  missions: string[];
  researchAreas: string[];
  experimentTypes: string[];
  tissueTypes: string[];
  allTags: string[];
}

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [query, setQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<AdvancedFilters>({
    yearRange: "All Years",
    organism: [],
    experimentType: [],
    mission: [],
    tissueType: [],
    researchArea: [],
    publicationStatus: "All Status",
    customDateRange: {
      start: "",
      end: ""
    },
    keywords: []
  });
  
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: "relevance",
    sortOrder: "desc",
    secondarySort: "date"
  });

  const { data: dynamicFilterOptions } = useQuery<FilterOptions>({
    queryKey: ["/api/filter-options"],
  });

  const defaultResearchAreas = [
    "Human Health", "Plant Biology", "Microbiology", "Radiation Biology",
    "Neuroscience", "Bone Health", "Food Systems", "Sleep Medicine",
    "Cardiovascular", "Cell Culture", "Genetics", "Biotechnology"
  ];

  const defaultOrganisms = [
    "Human", "Arabidopsis", "Mouse", "Rat",
    "Drosophila", "C. elegans", "E. coli", "Yeast",
    "Cell Culture", "Mammalian", "Plant", "Microbial"
  ];

  const defaultExperimentTypes = [
    "Transcriptomics", "Proteomics", "Metabolomics", "Genomics",
    "Imaging", "Behavioral", "Physiological", "Biochemical",
    "Tissue Analysis", "Flight Studies", "Ground Controls"
  ];

  const defaultMissions = [
    "ISS", "SpaceX", "Shuttle", "Apollo",
    "Biosatellite", "Foton", "BION", "STS",
    "Artemis", "Gateway", "Commercial Crew"
  ];

  const researchAreas = Array.from(new Set([
    ...defaultResearchAreas,
    ...(dynamicFilterOptions?.researchAreas || [])
  ])).sort();

  const organisms = Array.from(new Set([
    ...defaultOrganisms,
    ...(dynamicFilterOptions?.organisms || [])
  ])).sort();

  const experimentTypes = Array.from(new Set([
    ...defaultExperimentTypes,
    ...(dynamicFilterOptions?.experimentTypes || [])
  ])).sort();

  const missions = Array.from(new Set([
    ...defaultMissions,
    ...(dynamicFilterOptions?.missions || [])
  ])).sort();

  const handleSearch = () => {
    onSearch(query, filters, sortOptions);
    updateActiveFilters();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  const updateActiveFilters = () => {
    const active: string[] = [];
    
    if (filters.yearRange !== "All Years") active.push(`Year: ${filters.yearRange}`);
    if (filters.organism.length > 0) active.push(`Organism: ${filters.organism.join(", ")}`);
    if (filters.experimentType.length > 0) active.push(`Type: ${filters.experimentType.join(", ")}`);
    if (filters.mission.length > 0) active.push(`Mission: ${filters.mission.join(", ")}`);
    if (filters.tissueType.length > 0) active.push(`Tissue: ${filters.tissueType.join(", ")}`);
    if (filters.researchArea.length > 0) active.push(`Area: ${filters.researchArea.join(", ")}`);
    if (filters.publicationStatus !== "All Status") active.push(`Status: ${filters.publicationStatus}`);
    if (filters.customDateRange.start || filters.customDateRange.end) {
      active.push(`Custom Date: ${filters.customDateRange.start} - ${filters.customDateRange.end}`);
    }
    if (filters.keywords.length > 0) active.push(`Keywords: ${filters.keywords.join(", ")}`);
    
    setActiveFilters(active);
  };
  
  const clearFilter = (filterToRemove: string) => {
    const newFilters = { ...filters };
    
    if (filterToRemove.startsWith("Year:")) {
      newFilters.yearRange = "All Years";
    } else if (filterToRemove.startsWith("Organism:")) {
      newFilters.organism = [];
    } else if (filterToRemove.startsWith("Type:")) {
      newFilters.experimentType = [];
    } else if (filterToRemove.startsWith("Mission:")) {
      newFilters.mission = [];
    } else if (filterToRemove.startsWith("Tissue:")) {
      newFilters.tissueType = [];
    } else if (filterToRemove.startsWith("Area:")) {
      newFilters.researchArea = [];
    } else if (filterToRemove.startsWith("Status:")) {
      newFilters.publicationStatus = "All Status";
    } else if (filterToRemove.startsWith("Custom Date:")) {
      newFilters.customDateRange = { start: "", end: "" };
    } else if (filterToRemove.startsWith("Keywords:")) {
      newFilters.keywords = [];
    }
    
    setFilters(newFilters);
    onSearch(query, newFilters, sortOptions);
  };
  
  const clearAllFilters = () => {
    const clearedFilters = {
      yearRange: "All Years",
      organism: [],
      experimentType: [],
      mission: [],
      tissueType: [],
      researchArea: [],
      publicationStatus: "All Status",
      customDateRange: { start: "", end: "" },
      keywords: []
    };
    setFilters(clearedFilters);
    setActiveFilters([]);
    onSearch(query, clearedFilters, sortOptions);
  };
  
  const handleMultiSelectChange = (field: keyof AdvancedFilters, value: string, checked: boolean) => {
    const currentValues = filters[field] as string[];
    const newValues = checked 
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    setFilters({ ...filters, [field]: newValues });
  };

  return (
    <div className="space-y-4">
      <Card className="glass border-0">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search NASA space biology research..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 h-12 text-base font-medium"
                  data-testid="search-input"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={filters.yearRange} onValueChange={(value) => setFilters({ ...filters, yearRange: value })}>
                <SelectTrigger className="w-40" data-testid="select-year-range">
                  <SelectValue placeholder="Year Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Years">All Years</SelectItem>
                  <SelectItem value="2020-2024">2020-2024</SelectItem>
                  <SelectItem value="2015-2019">2015-2019</SelectItem>
                  <SelectItem value="2010-2014">2010-2014</SelectItem>
                  <SelectItem value="2005-2009">2005-2009</SelectItem>
                  <SelectItem value="2000-2004">2000-2004</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOptions.sortBy} onValueChange={(value) => setSortOptions({ ...sortOptions, sortBy: value })}>
                <SelectTrigger className="w-40" data-testid="select-sort-by">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="citations">Citations</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => setSortOptions({ ...sortOptions, sortOrder: sortOptions.sortOrder === "asc" ? "desc" : "asc" })}
                className="w-12 h-10"
                data-testid="button-sort-order"
              >
                {sortOptions.sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>

              <Button 
                variant="outline" 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2"
                data-testid="button-advanced-filters"
              >
                <Settings2 className="h-4 w-4" />
                Advanced
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              <Button onClick={handleSearch} className="glow" data-testid="search-button">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeFilters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="glass border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Active Filters</span>
                  <Badge variant="secondary">{activeFilters.length}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-clear-all-filters"
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <span className="text-xs">{filter}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => clearFilter(filter)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="glass border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Advanced Search Filters</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save Preset
                    </Button>
                    <Button variant="outline" size="sm">
                      <History className="h-4 w-4 mr-2" />
                      Load Preset
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Research Areas</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {researchAreas.map((area) => (
                      <div key={area} className="flex items-center space-x-2">
                        <Checkbox
                          id={`area-${area}`}
                          checked={filters.researchArea.includes(area)}
                          onCheckedChange={(checked) => 
                            handleMultiSelectChange("researchArea", area, checked as boolean)
                          }
                          data-testid={`checkbox-research-area-${area.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                        <Label htmlFor={`area-${area}`} className="text-sm">
                          {area}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Model Organisms</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {organisms.map((organism) => (
                      <div key={organism} className="flex items-center space-x-2">
                        <Checkbox
                          id={`organism-${organism}`}
                          checked={filters.organism.includes(organism)}
                          onCheckedChange={(checked) => 
                            handleMultiSelectChange("organism", organism, checked as boolean)
                          }
                          data-testid={`checkbox-organism-${organism.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                        <Label htmlFor={`organism-${organism}`} className="text-sm">
                          {organism}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Experiment Types</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {experimentTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={filters.experimentType.includes(type)}
                          onCheckedChange={(checked) => 
                            handleMultiSelectChange("experimentType", type, checked as boolean)
                          }
                          data-testid={`checkbox-experiment-type-${type.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                        <Label htmlFor={`type-${type}`} className="text-sm">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Space Missions</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {missions.map((mission) => (
                      <div key={mission} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mission-${mission}`}
                          checked={filters.mission.includes(mission)}
                          onCheckedChange={(checked) => 
                            handleMultiSelectChange("mission", mission, checked as boolean)
                          }
                          data-testid={`checkbox-mission-${mission.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                        <Label htmlFor={`mission-${mission}`} className="text-sm">
                          {mission}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Publication Status */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Publication Status</Label>
                    <Select 
                      value={filters.publicationStatus} 
                      onValueChange={(value) => setFilters({ ...filters, publicationStatus: value })}
                    >
                      <SelectTrigger data-testid="select-publication-status">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Status">All Status</SelectItem>
                        <SelectItem value="Published">Published</SelectItem>
                        <SelectItem value="In Press">In Press</SelectItem>
                        <SelectItem value="Preprint">Preprint</SelectItem>
                        <SelectItem value="Dataset Only">Dataset Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Custom Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={filters.customDateRange.start}
                        onChange={(e) => setFilters({
                          ...filters,
                          customDateRange: { ...filters.customDateRange, start: e.target.value }
                        })}
                        data-testid="input-date-start"
                      />
                      <Input
                        type="date"
                        value={filters.customDateRange.end}
                        onChange={(e) => setFilters({
                          ...filters,
                          customDateRange: { ...filters.customDateRange, end: e.target.value }
                        })}
                        data-testid="input-date-end"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Secondary Sort</Label>
                    <Select 
                      value={sortOptions.secondarySort} 
                      onValueChange={(value) => setSortOptions({ ...sortOptions, secondarySort: value })}
                    >
                      <SelectTrigger data-testid="select-secondary-sort">
                        <SelectValue placeholder="Secondary Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="author">Author</SelectItem>
                        <SelectItem value="citations">Citations</SelectItem>
                        <SelectItem value="relevance">Relevance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={clearAllFilters} data-testid="button-reset-filters">
                    Reset All Filters
                  </Button>
                  <Button onClick={handleSearch} className="glow" data-testid="button-apply-filters">
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}