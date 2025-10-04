import fetch from 'node-fetch';

const OSDR_BASE_URL = 'https://osdr.nasa.gov/osdr/data/';
const OSDR_API_URL = 'https://visualization.osdr.nasa.gov/biodata/api/';
const OSDR_V2_API_URL = 'https://visualization.osdr.nasa.gov/biodata/api/v2/';

export interface NASAStudy {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  year?: number; 
  institution: string;
  tags: string[];
  url: string;
  organism?: string;
  assayType?: string;
  missionName?: string;
  tissueType?: string;
  dataType?: string;
  submissionDate?: string;
  releaseDate?: string;
  factorValue?: string;
  spaceflightMission?: string;
  hardware?: string;
}

interface OSDRStudyResponse {
  GSMS_name?: string;
  study_id?: string;
  accession?: string;
  title?: string;
  description?: string;
  study_contact_name?: string;
  study_contact_email?: string;
  study_contact_organization?: string;
  experiment_platform?: string;
  experiment_organism?: string;
  experiment_platform_organism?: string;
  study_factors?: string;
  study_assay_technology_type?: string;
  study_design_descriptors?: string;
  flight_mission?: string;
  flight_sequence?: string;
  ground_control_descriptors?: string;
  organism?: string;
  tissue?: string;
  cell_line?: string;
  developmental_stage?: string;
  treatment?: string;
  factor_value_unit?: string;
  study_factors_factor_type?: string;
  submit_date?: string;
  public_release_date?: string;
  authors?: string[];
  year?: number;
}

export class NASAOSDRService {
  private statsCache: {
    data: any;
    timestamp: number;
  } | null = null;
  private readonly cacheTimeout = 6 * 60 * 60 * 1000;
  
  // Enhanced caching for studies database
  private studiesCache: {
    studies: NASAStudy[];
    timestamp: number;
  } | null = null;
  private readonly studiesCacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  private isRefreshing = false;
  
  async searchStudies(searchTerm: string, limit: number = 20): Promise<NASAStudy[]> {
    try {
      const url = `${OSDR_BASE_URL}search`;
      const params = new URLSearchParams({
        'term': searchTerm,
        'from': '0',
        'size': limit.toString(),
        'type': 'cgene'
      });

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new Error(`OSDR API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return this.transformSearchResults(data);
    } catch (error) {
      console.error('Error fetching NASA OSDR data:', error);
      throw error; // No synthetic fallbacks - propagate error
    }
  }

  async getStudiesByFilters(organism?: string, assayType?: string, limit: number = 20): Promise<NASAStudy[]> {
    try {
      const url = `${OSDR_BASE_URL}search`;
      const params = new URLSearchParams({
        'from': '0',
        'size': limit.toString(),
        'type': 'cgene'
      });

      if (organism) {
        params.append('ffield', 'organism');
        params.append('fvalue', organism);
      }
      
      if (assayType) {
        params.append('ffield', 'Study Assay Technology Type');
        params.append('fvalue', assayType);
      }

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new Error(`OSDR API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return this.transformSearchResults(data);
    } catch (error) {
      console.error('Error fetching filtered NASA OSDR data:', error);
      throw error; // No synthetic fallbacks - propagate error
    }
  }

  async getStudyMetadata(studyId: string): Promise<NASAStudy | null> {
    try {
      const numericId = studyId.replace(/\D/g, '');
      const url = `${OSDR_BASE_URL}osd/meta/${numericId}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }

      const data = await response.json() as OSDRStudyResponse;
      return this.transformSingleStudy(data, studyId);
    } catch (error) {
      console.error('Error fetching study metadata:', error);
      return null;
    }
  }

  async getStudiesByInterest(interest: string, limit: number = 10): Promise<NASAStudy[]> {
    const searchTerms: Record<string, string[]> = {
      'plant-biology': ['plant', 'arabidopsis', 'lettuce', 'tomato', 'photosynthesis'],
      'human-health': ['human', 'astronaut', 'cardiovascular', 'bone', 'muscle'],
      'microgravity-effects': ['microgravity', 'gravity', 'weightlessness'],
      'radiation-studies': ['radiation', 'cosmic', 'DNA damage', 'radioprotection'],
      'microbiology': ['microbe', 'bacteria', 'biofilm', 'microbiome'],
      'genetics': ['gene', 'genetic', 'epigenetic', 'transcriptome', 'genome']
    };

    const terms = searchTerms[interest] || [interest];
    const randomTerm = terms[Math.floor(Math.random() * terms.length)];
    
    return this.searchStudies(randomTerm, limit);
  }

  // Enhanced search with advanced filters using improved v1 API
  async searchStudiesAdvanced(filters: {
    query?: string;
    organism?: string[];
    assayType?: string[];
    mission?: string[];
    tissueType?: string[];
    yearRange?: { start: number; end: number };
    dataType?: string[];
    limit?: number;
  }): Promise<NASAStudy[]> {
    try {
      // Use the reliable v1 API with enhanced filtering
      const query = filters.query || '';
      let results: NASAStudy[] = [];
      
      // If we have specific organism filters, try targeted searches
      if (filters.organism && filters.organism.length > 0) {
        for (const organism of filters.organism.slice(0, 2)) { // Limit to avoid too many requests
          const organismResults = await this.getStudiesByFilters(organism, undefined, Math.ceil((filters.limit || 20) / 2));
          results.push(...organismResults);
        }
      }
      
      // If we have assay type filters, try targeted searches
      if (filters.assayType && filters.assayType.length > 0) {
        for (const assayType of filters.assayType.slice(0, 2)) { // Limit to avoid too many requests
          const assayResults = await this.getStudiesByFilters(undefined, assayType, Math.ceil((filters.limit || 20) / 2));
          results.push(...assayResults);
        }
      }
      
      // If no specific filters or not enough results, do a general search
      if (results.length === 0 || (!filters.organism && !filters.assayType)) {
        if (query.trim()) {
          const generalResults = await this.searchStudies(query, filters.limit || 20);
          results.push(...generalResults);
        } else {
          const recentResults = await this.getRecentStudies(filters.limit || 20);
          results.push(...recentResults);
        }
      }
      
      // Remove duplicates
      const uniqueResults = results.filter((study, index, self) =>
        index === self.findIndex(s => s.id === study.id)
      );
      
      return uniqueResults.slice(0, filters.limit || 20);
    } catch (error) {
      console.error('Error with advanced search, falling back to basic search:', error);
      return this.searchStudies(filters.query || '', filters.limit || 20);
    }
  }

  // Get detailed study metadata (fallback to v1 only for now)
  async getStudyMetadataV2(studyId: string): Promise<NASAStudy | null> {
    // For now, just use the reliable v1 API
    return this.getStudyMetadata(studyId);
  }

  async getRecentStudies(limit: number = 15): Promise<NASAStudy[]> {
    try {
      const recentTerms = ['ISS', '2024', '2025', 'spaceflight', 'microgravity'];
      const allResults: NASAStudy[] = [];

      for (const term of recentTerms.slice(0, 3)) {
        try {
          const results = await this.searchStudies(term, Math.ceil(limit / 3));
          allResults.push(...results);
        } catch (error) {
          console.warn(`Error fetching recent studies for term "${term}":`, error);
          // Continue with other terms rather than using fallback
        }
      }

      const uniqueResults = allResults.filter((study, index, self) => 
        index === self.findIndex(s => s.id === study.id)
      );

      return uniqueResults
        .sort((a, b) => (b.year || 0) - (a.year || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent studies:', error);
      throw error; // No synthetic fallbacks - propagate error
    }
  }

  // Cached method to get comprehensive studies database
  async getComprehensiveStudiesDatabase(): Promise<NASAStudy[]> {
    // Return cached data if available and fresh
    if (this.studiesCache && (Date.now() - this.studiesCache.timestamp) < this.studiesCacheTimeout) {
      console.log(`Returning cached studies database with ${this.studiesCache.studies.length} studies`);
      return this.studiesCache.studies;
    }

    // If no cache or expired, but not currently refreshing, start background refresh
    if (!this.isRefreshing) {
      this.backgroundRefreshStudies();
    }

    // Return existing cached data while background refresh is happening
    if (this.studiesCache?.studies) {
      console.log('Returning existing cached data while background refresh is in progress');
      return this.studiesCache.studies;
    }

    // First time access - do synchronous fetch and properly cache the result
    const studies = await this.fetchRealStudiesWithPagination();
    
    // CRITICAL FIX: Set the cache immediately after fetch
    this.studiesCache = {
      studies,
      timestamp: Date.now()
    };
    
    return studies;
  }

  // Background refresh method to update studies cache
  private backgroundRefreshStudies(): void {
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    console.log('Starting background refresh of NASA studies database...');
    
    // Run async without blocking - use real pagination method
    this.fetchRealStudiesWithPagination()
      .then(studies => {
        this.studiesCache = {
          studies,
          timestamp: Date.now()
        };
        console.log(`Background refresh completed: cached ${studies.length} real studies`);
      })
      .catch(error => {
        console.error('Background refresh failed:', error);
        // Keep existing cache on failure rather than clearing it
      })
      .finally(() => {
        this.isRefreshing = false;
      });
  }

  // Deterministic concurrent fetching with retries to guarantee 300+ real studies
  private async fetchRealStudiesWithPagination(): Promise<NASAStudy[]> {
    try {
      console.log('Fetching 300+ real NASA OSDR studies with deterministic pagination...');
      const allStudies: NASAStudy[] = [];
      const uniqueIds = new Set<string>();
      const TARGET_STUDY_COUNT = 300;

      // Expanded high-yield search terms for better coverage
      const highYieldTerms = [
        "microgravity", "spaceflight", "ISS", "space", "NASA", "astronaut",
        "human", "mouse", "plant", "bacteria", "cell", "tissue", "gene",
        "protein", "RNA", "DNA", "metabolism", "immune", "cardiovascular",
        "bone", "muscle", "radiation", "growth", "development"
      ];

      // Concurrency and retry parameters
      const PAGE_SIZE = 50; // Smaller pages for better concurrency
      const MAX_PAGES_PER_TERM = 10; // More pages per term
      const MAX_CONCURRENT = 3; // Use actual concurrency
      const MAX_RETRIES = 3; // Retry failed pages

      // Process terms with proper concurrency control
      const processTermsConcurrently = async (terms: string[]) => {
        const semaphore = new Array(MAX_CONCURRENT).fill(null);
        let termIndex = 0;

        const processNextTerm = async (): Promise<void> => {
          while (termIndex < terms.length && uniqueIds.size < TARGET_STUDY_COUNT) {
            const currentTermIndex = termIndex++;
            const term = terms[currentTermIndex];

            console.log(`[${currentTermIndex}] Searching "${term}" - have ${uniqueIds.size} studies`);

            // Paginate through this term with retries
            for (let page = 0; page < MAX_PAGES_PER_TERM && uniqueIds.size < TARGET_STUDY_COUNT; page++) {
              let retries = 0;
              let success = false;

              while (retries < MAX_RETRIES && !success) {
                try {
                  const results = await this.searchStudiesWithPagination(term, page * PAGE_SIZE, PAGE_SIZE);
                  
                  if (results.length === 0) {
                    console.log(`[${currentTermIndex}] No more results for "${term}" on page ${page}`);
                    success = true;
                    break; // No more results for this term
                  }

                  let newStudiesCount = 0;
                  for (const study of results) {
                    if (!uniqueIds.has(study.id)) {
                      uniqueIds.add(study.id);
                      // Don't apply term-based category tags to avoid mislabeling
                      allStudies.push(study);
                      newStudiesCount++;
                    }
                  }

                  console.log(`[${currentTermIndex}] Page ${page}: ${newStudiesCount} new (${results.length} fetched) - Total: ${uniqueIds.size}`);
                  success = true;
                  
                  // API-friendly delay
                  await new Promise(resolve => setTimeout(resolve, 200));

                } catch (error) {
                  retries++;
                  console.warn(`[${currentTermIndex}] Retry ${retries}/${MAX_RETRIES} for page ${page} of "${term}":`, error);
                  
                  if (retries < MAX_RETRIES) {
                    // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
                  } else {
                    console.error(`[${currentTermIndex}] Max retries exceeded for page ${page} of "${term}"`);
                    break; // Move to next page after max retries
                  }
                }
              }
            }
          }
        };

        // Start concurrent processing
        await Promise.all(semaphore.map(() => processNextTerm()));
      };

      await processTermsConcurrently(highYieldTerms);

      console.log(`Fetched ${uniqueIds.size} unique studies from API`);
      
      // Process and validate studies - ONLY real data
      const processedStudies = allStudies
        .filter(study => {
          // Strict validation for real studies
          return study.title && 
                 study.abstract && 
                 study.title.length > 10 && 
                 study.abstract.length > 50 && 
                 (study.id.match(/OSD-\d+/) || study.id.match(/^\d+$/));
        })
        .filter(study => {
          // Only include studies with real years
          const realYear = study.year || this.extractYearFromDates(study.submissionDate, study.releaseDate);
          return realYear && realYear >= 2000 && realYear <= new Date().getFullYear();
        })
        .map(study => ({
          ...study,
          year: study.year || this.extractYearFromDates(study.submissionDate, study.releaseDate)!
        }))
        .sort((a, b) => (b.year || 0) - (a.year || 0));

      console.log(`Final processed: ${processedStudies.length} authentic NASA studies`);

      if (processedStudies.length < TARGET_STUDY_COUNT) {
        console.warn(`CRITICAL: Only ${processedStudies.length} real studies found, target was ${TARGET_STUDY_COUNT}`);
        throw new Error(`Cannot guarantee ${TARGET_STUDY_COUNT}+ authentic studies. Found: ${processedStudies.length}`);
      }

      return processedStudies;
    } catch (error) {
      console.error('Error in deterministic studies fetch:', error);
      throw error; // Fail fast - no fallback data
    }
  }

  // Enhanced search method with pagination support
  private async searchStudiesWithPagination(searchTerm: string, from: number = 0, size: number = 100): Promise<NASAStudy[]> {
    try {
      const url = `${OSDR_BASE_URL}search`;
      const params = new URLSearchParams({
        'term': searchTerm,
        'from': from.toString(),
        'size': size.toString(),
        'type': 'cgene'
      });

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new Error(`OSDR API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      return this.transformSearchResults(data);
    } catch (error) {
      console.error(`Error fetching NASA OSDR data for "${searchTerm}" (from: ${from}, size: ${size}):`, error);
      throw error; // Propagate error instead of returning fallback
    }
  }

  // Helper to infer categories from search terms
  private inferCategoryFromTerm(term: string): string[] {
    const categoryMap: Record<string, string[]> = {
      'plant': ['Plant Biology'],
      'arabidopsis': ['Plant Biology'],
      'human': ['Human Health'],
      'astronaut': ['Human Health'],
      'cardiovascular': ['Human Health'],
      'bone': ['Human Health'],
      'mouse': ['Rodent Research'],
      'bacteria': ['Microbiology'],
      'immune': ['Human Health', 'Microbiology'],
      'radiation': ['Radiation Biology'],
      'neuroscience': ['Neuroscience'],
      'microgravity': ['Human Health', 'Plant Biology', 'Cell Biology'],
      'spaceflight': ['Human Health', 'Plant Biology', 'Microbiology'],
      'ISS': ['Human Health', 'Plant Biology', 'Microbiology', 'Technology Demo']
    };

    const lowerTerm = term.toLowerCase();
    for (const [key, categories] of Object.entries(categoryMap)) {
      if (lowerTerm.includes(key)) {
        return categories;
      }
    }
    return [];
  }

  // Enhanced year extraction from multiple date sources
  private extractYearFromDates(...dates: (string | undefined)[]): number | null {
    for (const date of dates) {
      if (date) {
        const year = this.extractYear(date);
        if (year && year >= 2000 && year <= new Date().getFullYear() + 1) {
          return year;
        }
      }
    }
    return null;
  }

  async getStatistics(): Promise<{
    totalStudies: number;
    categoryStats: Record<string, number>;
    yearlyTrends: Record<string, number>;
    recentStudiesCount: number;
    monthlyData: Array<{ month: string; studies: number; papers: number }>;
    researchTrends: Record<string, number>;
  }> {
    if (this.statsCache && (Date.now() - this.statsCache.timestamp) < this.cacheTimeout) {
      return this.statsCache.data;
    }

    try {
      // Get cached studies for fast statistics calculation
      const allStudies = await this.getComprehensiveStudiesDatabase();
      
      // Calculate real statistics from fetched data
      const categoryStats: Record<string, number> = {};
      const yearlyTrends: Record<string, number> = {};

      // Initialize categories with better matching logic
      const categories = [
        "Plant Biology", "Human Health", "Microbiology", "Rodent Research", 
        "Cell Biology", "Radiation Biology", "Neuroscience", "Food Systems", 
        "Technology Demo", "Genetics", "Tissue Biology", "Developmental Biology"
      ];

      categories.forEach(category => {
        const categoryKey = category.toLowerCase().split(' ')[0];
        categoryStats[category] = allStudies.filter(study => {
          return study.tags.some(tag => 
            tag.toLowerCase().includes(categoryKey) || 
            tag.toLowerCase().includes(category.toLowerCase())
          ) || 
          study.title.toLowerCase().includes(categoryKey) ||
          study.abstract.toLowerCase().includes(categoryKey);
        }).length;
      });

      // Calculate real yearly trends from actual study years
      const studyYears = allStudies.map(study => study.year).filter(year => year !== undefined) as number[];
      const minYear = studyYears.length > 0 ? Math.min(...studyYears, 2018) : 2018;
      const maxYear = studyYears.length > 0 ? Math.max(...studyYears, 2025) : 2025;

      for (let year = minYear; year <= maxYear; year++) {
        yearlyTrends[year.toString()] = allStudies.filter(study => 
          study.year === year
        ).length;
      }

      // Calculate real monthly data based on submission/release dates
      const monthlyData = this.calculateMonthlyDistribution(allStudies);

      const currentYear = new Date().getFullYear();
      const stats = {
        totalStudies: allStudies.length,
        categoryStats,
        yearlyTrends,
        recentStudiesCount: yearlyTrends[currentYear.toString()] || 0,
        monthlyData,
        researchTrends: yearlyTrends
      };

      this.statsCache = {
        data: stats,
        timestamp: Date.now()
      };

      return stats;
    } catch (error) {
      console.error('Error fetching OSDR statistics:', error);
      
      // NO synthetic fallbacks - rely on existing cache or propagate error
      if (this.statsCache?.data) {
        console.log('Using last known good statistics cache due to error');
        return this.statsCache.data;
      }
      
      // If no cache exists, throw error rather than return synthetic data
      throw new Error('Cannot fetch real NASA statistics and no cached data available');
    }
  }

  // Calculate monthly distribution from real study dates ONLY - no synthetic data
  private calculateMonthlyDistribution(studies: NASAStudy[]): Array<{ month: string; studies: number; papers: number }> {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthlyDistribution = months.map((month, index) => {
      // Extract real monthly data from submission/release dates
      const monthlyStudies = studies.filter(study => {
        const submitDate = study.submissionDate;
        const releaseDate = study.releaseDate;
        
        // Only count if we have real dates
        if (submitDate || releaseDate) {
          const dateStr = (submitDate || releaseDate || '').toLowerCase();
          const monthNumber = String(index + 1).padStart(2, '0');
          const monthAbbr = month.toLowerCase();
          
          return dateStr.includes(monthAbbr) || 
                 dateStr.includes(`-${monthNumber}-`) ||
                 dateStr.includes(`/${monthNumber}/`) ||
                 dateStr.includes(`${monthNumber}/`);
        }
        
        return false; // No fallback - only real date matches
      }).length;

      return {
        month,
        studies: monthlyStudies, // Use only real counts
        papers: monthlyStudies   // Same count for papers (no artificial inflation)
      };
    });

    return monthlyDistribution;
  }

  private transformSearchResults(data: any): NASAStudy[] {
    const studies: NASAStudy[] = [];
    
    if (data?.hits?.hits) {
      for (const hit of data.hits.hits) {
        const source = hit._source || {};
        const study = this.transformSingleStudyFromSearch(source, hit._id);
        if (study) {
          studies.push(study);
        }
      }
    }

    return studies;
  }

  // Transform v2 API search results
  private transformV2SearchResults(data: any): NASAStudy[] {
    const studies: NASAStudy[] = [];
    
    if (data?.data && Array.isArray(data.data)) {
      for (const item of data.data) {
        const study = this.transformV2DataItem(item);
        if (study) {
          studies.push(study);
        }
      }
    }

    return studies;
  }

  // Transform v2 API metadata result
  private transformV2MetadataResult(data: any, studyId: string): NASAStudy | null {
    try {
      if (!data) return null;
      
      const metadata = data.data || data;
      return this.transformV2DataItem(metadata, studyId);
    } catch (error) {
      console.error('Error transforming v2 metadata:', error);
      return null;
    }
  }

  // Transform individual v2 API data item
  private transformV2DataItem(item: any, studyId?: string): NASAStudy | null {
    try {
      const accession = item['id.accession'] || item.accession || studyId || `OSD-${Date.now()}`;
      const title = item['study.title'] || item.title || `Space Biology Study ${accession}`;
      const description = item['study.description'] || item.description || 
        'Space biology research study investigating biological processes in space environments.';
      
      const organism = item['study.characteristics.organism'] || item.organism;
      const assayType = item['Study Assay Technology Type'] || item.assayType;
      const tissueType = item['study.characteristics.tissue'] || item.tissue;
      const mission = item['study.factor value.spaceflight'] || item['flight_mission'];
      const dataType = item['file.data type'] || item.dataType;
      
      const submitDate = item['study.submit date'] || item.submit_date;
      const releaseDate = item['study.public release date'] || item.public_release_date;
      const year = this.extractYear(releaseDate || submitDate); // No synthetic fallback - only real dates
      
      const contact = item['study.contact.name'] || item.study_contact_name;
      const organization = item['study.contact.organization'] || item.study_contact_organization || 'NASA';
      
      const authors = this.extractAuthors(contact);
      const tags = this.extractV2Tags(item);

      const study: NASAStudy = {
        id: accession,
        title: title,
        abstract: description,
        authors: authors,
        institution: organization,
        tags: tags,
        url: `https://osdr.nasa.gov/bio/repo/data/studies/${accession}`,
        organism: organism,
        assayType: assayType,
        missionName: mission,
        tissueType: tissueType,
        dataType: dataType,
        submissionDate: submitDate,
        releaseDate: releaseDate,
        factorValue: item['study.factor value.factor value'],
        spaceflightMission: mission,
        hardware: item['study.hardware'] || item.hardware
      };

      // Only set year if we have a real one
      if (year) {
        study.year = year;
      }

      return study;
    } catch (error) {
      console.error('Error transforming v2 data item:', error);
      return null;
    }
  }

  private extractV2Tags(item: any): string[] {
    const tags: string[] = [];
    
    if (item['study.characteristics.organism']) tags.push(item['study.characteristics.organism']);
    if (item['Study Assay Technology Type']) tags.push(item['Study Assay Technology Type']);
    if (item['study.factor value.spaceflight']) tags.push(item['study.factor value.spaceflight']);
    if (item['study.characteristics.tissue']) tags.push(item['study.characteristics.tissue']);
    if (item['file.data type']) tags.push(item['file.data type']);
    if (item['study.hardware']) tags.push(item['study.hardware']);
    
    tags.push('Space Biology', 'NASA Research');
    
    return Array.from(new Set(tags.filter(tag => tag && tag.trim())));
  }

  private transformSingleStudyFromSearch(source: any, id: string): NASAStudy | null {
    try {
      const title = source.title || source.study_title;
      const description = source.description || source.study_description;
      
      // Only use real dates - no fallback to current year
      const year = this.extractYear(source.public_release_date || source.submit_date);
      
      // Skip studies without essential real data
      if (!title || !description || title.length < 10 || description.length < 50) {
        return null;
      }
      
      const authors = this.extractAuthors(source.study_contact_name || source.authors);
      const institution = source.study_contact_organization || 'NASA';
      const tags = this.extractTags(source);
      const studyId = source.accession || `OSD-${id}`;

      const study: NASAStudy = {
        id: studyId,
        title: title,
        abstract: description,
        authors: authors,
        institution: institution,
        tags: tags,
        url: `https://osdr.nasa.gov/bio/repo/data/studies/${studyId}`,
        organism: source.organism || source.experiment_organism,
        assayType: source.study_assay_technology_type,
        missionName: source.flight_mission,
        tissueType: source.tissue,
        dataType: source.data_type,
        submissionDate: source.submit_date,
        releaseDate: source.public_release_date,
        factorValue: source.factor_value,
        spaceflightMission: source.flight_mission,
        hardware: source.hardware
      };

      // Only set year if we have a real one
      if (year) {
        study.year = year;
      }

      return study;
    } catch (error) {
      console.error('Error transforming study:', error);
      return null;
    }
  }

  private transformSingleStudy(data: OSDRStudyResponse, id: string): NASAStudy | null {
    const title = data.title;
    const description = data.description;
    
    // Skip studies without essential real data
    if (!title || !description || title.length < 10 || description.length < 50) {
      return null;
    }
    
    // Only use real dates - no fallback to current year
    const year = data.year || this.extractYear(data.public_release_date);
    
    const study: NASAStudy = {
      id: data.accession || id,
      title: title,
      abstract: description,
      authors: data.authors || [data.study_contact_name || 'NASA Researcher'],
      institution: data.study_contact_organization || 'NASA',
      tags: this.extractTagsFromMetadata(data),
      url: `https://osdr.nasa.gov/bio/repo/data/studies/${data.accession || id}`,
      organism: data.organism,
      assayType: data.study_assay_technology_type,
      missionName: data.flight_mission,
      tissueType: data.tissue
    };

    // Only set year if we have a real one
    if (year) {
      study.year = year;
    }

    return study;
  }

  private extractYear(dateString?: string): number | null {
    if (!dateString) return null;
    const match = dateString.match(/(\d{4})/);
    return match ? parseInt(match[1]) : null;
  }

  private extractAuthors(authorsData: any): string[] {
    if (Array.isArray(authorsData)) {
      return authorsData.slice(0, 4);
    }
    if (typeof authorsData === 'string') {
      return authorsData.split(',').map(name => name.trim()).slice(0, 4);
    }
    return ['NASA Researcher'];
  }

  private extractTags(source: any): string[] {
    const tags: string[] = [];
    
    if (source.organism) tags.push(source.organism);
    if (source.study_assay_technology_type) tags.push(source.study_assay_technology_type);
    if (source.flight_mission) tags.push(source.flight_mission);
    if (source.tissue) tags.push(source.tissue);
    
    tags.push('Space Biology', 'NASA Research');
    
    return Array.from(new Set(tags));
  }

  private extractTagsFromMetadata(data: OSDRStudyResponse): string[] {
    const tags: string[] = [];
    
    if (data.organism) tags.push(data.organism);
    if (data.study_assay_technology_type) tags.push(data.study_assay_technology_type);
    if (data.flight_mission) tags.push(data.flight_mission);
    if (data.tissue) tags.push(data.tissue);
    if (data.experiment_platform) tags.push(data.experiment_platform);
    
    tags.push('Space Biology', 'NASA Research');
    
    return Array.from(new Set(tags));
  }


}

export const nasaOSDRService = new NASAOSDRService();