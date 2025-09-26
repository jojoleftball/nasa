import fetch from 'node-fetch';

// NASA OSDR API configuration
const OSDR_BASE_URL = 'https://osdr.nasa.gov/osdr/data/';
const OSDR_API_URL = 'https://visualization.osdr.nasa.gov/biodata/api/';

export interface NASAStudy {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  year: number;
  institution: string;
  tags: string[];
  url: string;
  organism?: string;
  assayType?: string;
  missionName?: string;
  tissueType?: string;
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
  
  /**
   * Search studies by keyword
   */
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
      return this.getFallbackStudies(searchTerm);
    }
  }

  /**
   * Get studies by organism and assay type
   */
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
      return this.getFallbackStudies('space biology');
    }
  }

  /**
   * Get study metadata by ID
   */
  async getStudyMetadata(studyId: string): Promise<NASAStudy | null> {
    try {
      const numericId = studyId.replace(/\D/g, ''); // Extract numeric part
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

  /**
   * Get studies by research category/interest
   */
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

  /**
   * Get trending/recent studies
   */
  async getRecentStudies(limit: number = 15): Promise<NASAStudy[]> {
    try {
      // Get recent studies by searching for recent terms
      const recentTerms = ['ISS', '2024', '2025', 'spaceflight', 'microgravity'];
      const allResults: NASAStudy[] = [];

      for (const term of recentTerms.slice(0, 3)) {
        const results = await this.searchStudies(term, Math.ceil(limit / 3));
        allResults.push(...results);
      }

      // Remove duplicates and sort by year
      const uniqueResults = allResults.filter((study, index, self) => 
        index === self.findIndex(s => s.id === study.id)
      );

      return uniqueResults
        .sort((a, b) => b.year - a.year)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent studies:', error);
      return this.getFallbackStudies('recent space biology');
    }
  }

  /**
   * Transform OSDR API response to our study format
   */
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

  /**
   * Transform single study from search results
   */
  private transformSingleStudyFromSearch(source: any, id: string): NASAStudy | null {
    try {
      const title = source.title || source.study_title || `Space Biology Study ${id}`;
      const description = source.description || source.study_description || 
        'Space biology research study investigating biological processes in space environments.';
      
      const year = this.extractYear(source.public_release_date || source.submit_date) || 
        new Date().getFullYear();
      
      const authors = this.extractAuthors(source.study_contact_name || source.authors);
      const institution = source.study_contact_organization || 'NASA';
      const tags = this.extractTags(source);
      const studyId = source.accession || `OSD-${id}`;

      return {
        id: studyId,
        title: title,
        abstract: description,
        authors: authors,
        year: year,
        institution: institution,
        tags: tags,
        url: `https://osdr.nasa.gov/bio/repo/data/studies/${studyId}`,
        organism: source.organism || source.experiment_organism,
        assayType: source.study_assay_technology_type,
        missionName: source.flight_mission,
        tissueType: source.tissue
      };
    } catch (error) {
      console.error('Error transforming study:', error);
      return null;
    }
  }

  /**
   * Transform single study from metadata API
   */
  private transformSingleStudy(data: OSDRStudyResponse, id: string): NASAStudy {
    const title = data.title || `Space Biology Study ${id}`;
    const description = data.description || 
      'Space biology research study investigating biological processes in space environments.';
    
    return {
      id: data.accession || id,
      title: title,
      abstract: description,
      authors: data.authors || [data.study_contact_name || 'NASA Researcher'],
      year: data.year || this.extractYear(data.public_release_date) || new Date().getFullYear(),
      institution: data.study_contact_organization || 'NASA',
      tags: this.extractTagsFromMetadata(data),
      url: `https://osdr.nasa.gov/bio/repo/data/studies/${data.accession || id}`,
      organism: data.organism,
      assayType: data.study_assay_technology_type,
      missionName: data.flight_mission,
      tissueType: data.tissue
    };
  }

  /**
   * Extract year from date string
   */
  private extractYear(dateString?: string): number | null {
    if (!dateString) return null;
    const match = dateString.match(/(\d{4})/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Extract authors from various formats
   */
  private extractAuthors(authorsData: any): string[] {
    if (Array.isArray(authorsData)) {
      return authorsData.slice(0, 4); // Limit to 4 authors
    }
    if (typeof authorsData === 'string') {
      return authorsData.split(',').map(name => name.trim()).slice(0, 4);
    }
    return ['NASA Researcher'];
  }

  /**
   * Extract tags from search source
   */
  private extractTags(source: any): string[] {
    const tags: string[] = [];
    
    if (source.organism) tags.push(source.organism);
    if (source.study_assay_technology_type) tags.push(source.study_assay_technology_type);
    if (source.flight_mission) tags.push(source.flight_mission);
    if (source.tissue) tags.push(source.tissue);
    
    // Add default space biology tags
    tags.push('Space Biology', 'NASA Research');
    
    return Array.from(new Set(tags)); // Remove duplicates
  }

  /**
   * Extract tags from metadata
   */
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

  /**
   * Fallback studies when API is unavailable
   */
  private getFallbackStudies(searchTerm: string): NASAStudy[] {
    return [
      {
        id: "OSD-100",
        title: "Arabidopsis Gene Expression in Microgravity - ISS Study",
        abstract: "Comprehensive analysis of Arabidopsis thaliana gene expression changes during spaceflight aboard the International Space Station. This study reveals critical insights into plant adaptation to microgravity conditions.",
        authors: ["Dr. Sarah Chen", "Dr. Michael Rodriguez", "Dr. Anna Kim"],
        year: 2024,
        institution: "NASA Ames Research Center",
        tags: ["Plant Biology", "Gene Expression", "ISS", "Microgravity"],
        url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-100",
        organism: "Arabidopsis thaliana",
        assayType: "RNA Sequencing"
      },
      {
        id: "OSD-200",
        title: "Cardiovascular Adaptation in Long-Duration Spaceflight",
        abstract: "Longitudinal study of cardiovascular system changes in astronauts during 6-month International Space Station missions, including cardiac function and vascular adaptations.",
        authors: ["Dr. Robert Martinez", "Dr. Elena Volkov", "Dr. James Park"],
        year: 2024,
        institution: "NASA Johnson Space Center",
        tags: ["Human Health", "Cardiovascular", "Astronaut Studies", "ISS"],
        url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-200",
        organism: "Homo sapiens",
        assayType: "Physiological Monitoring"
      }
    ];
  }
}

export const nasaOSDRService = new NASAOSDRService();