import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { setupAdminAuth, initializeDefaultAdmin } from "./admin-auth";
import { setupAdminRoutes } from "./admin-routes";
import { generateChatResponse, summarizeStudy, generateSearchSuggestions, ConversationMode, type ChatContext, analyzeStudyComparison, generateResearchPathway } from "./gemini";
import { updateUserSchema, updatePasswordSchema, updateUsernameSchema } from "@shared/schema";
import { nasaOSDRService } from "./nasa-osdr";
import { z } from "zod";

const advancedFiltersSchema = z.object({
  yearRange: z.string().optional().default("All Years"),
  organism: z.array(z.string()).optional().default([]),
  experimentType: z.array(z.string()).optional().default([]),
  mission: z.array(z.string()).optional().default([]),
  tissueType: z.array(z.string()).optional().default([]),
  researchArea: z.array(z.string()).optional().default([]),
  publicationStatus: z.string().optional().default("All Status"),
  customDateRange: z.object({
    start: z.string().optional().default(""),
    end: z.string().optional().default("")
  }).optional().default({ start: "", end: "" }),
  keywords: z.array(z.string()).optional().default([]),
  osdStudyNumber: z.string().optional().default("")
});

const sortOptionsSchema = z.object({
  sortBy: z.enum(["relevance", "date", "title", "author", "citations"]).optional().default("relevance"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  secondarySort: z.enum(["relevance", "date", "title", "author", "citations"]).optional()
});

const searchRequestSchema = z.object({
  query: z.string().optional().default(""),
  filters: advancedFiltersSchema.optional().default({
    yearRange: "All Years",
    organism: [],
    experimentType: [],
    mission: [],
    tissueType: [],
    researchArea: [],
    publicationStatus: "All Status",
    customDateRange: { start: "", end: "" },
    keywords: [],
    osdStudyNumber: ""
  }),
  sortOptions: sortOptionsSchema.optional(),
  interests: z.array(z.string()).optional()
});

function isAuthenticated(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

function transformAdminResearchToStudyFormat(research: any): any {
  const authorsArray = research.authors 
    ? research.authors.split(',').map((a: string) => a.trim()).filter(Boolean)
    : ['BioGalactic Admin'];
  
  const validUrl = research.nasaOsdrLinks && research.nasaOsdrLinks.length > 0 
    ? research.nasaOsdrLinks[0] 
    : `https://osdr.nasa.gov/bio/repo/search?q=${encodeURIComponent(research.title)}`;
  
  return {
    id: `admin-${research.id}`,
    title: research.title,
    abstract: research.description,
    authors: authorsArray,
    institution: research.institution || 'BioGalactic Research',
    tags: research.tags || [],
    url: validUrl,
    year: research.year ? parseInt(research.year) : new Date(research.createdAt).getFullYear(),
    isAdminCreated: true,
    customFields: research.customFields,
    nasaOsdrLinks: research.nasaOsdrLinks || [],
    osdStudyNumber: research.osdStudyNumber || null,
  };
}

function searchInCustomFields(customFields: any, searchTerm: string): boolean {
  if (!customFields || typeof customFields !== 'object') {
    return false;
  }
  
  const searchLower = searchTerm.toLowerCase();
  
  for (const value of Object.values(customFields)) {
    if (typeof value === 'string' && value.toLowerCase().includes(searchLower)) {
      return true;
    } else if (Array.isArray(value)) {
      if (value.some((item: any) => 
        typeof item === 'string' && item.toLowerCase().includes(searchLower)
      )) {
        return true;
      }
    }
  }
  
  return false;
}

async function generateInterestBasedResults(interests: string[]) {
  try {
    const allResults: any[] = [];
    
    for (const interest of interests) {
      const studies = await nasaOSDRService.getStudiesByInterest(interest, 5);
      allResults.push(...studies);
    }
    
    if (allResults.length === 0) {
      const recentStudies = await nasaOSDRService.getRecentStudies(10);
      allResults.push(...recentStudies);
    }
    
    const adminResearch = await storage.getAllAdminResearch(true);
    const filteredAdminResearch = adminResearch.filter((research: any) => {
      if (!research.tags || !Array.isArray(research.tags) || research.tags.length === 0) {
        return false;
      }
      
      return research.tags.some((tag: string) =>
        interests.some((interest: string) =>
          tag.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(tag.toLowerCase())
        )
      );
    });
    
    const transformedAdminResearch = filteredAdminResearch.map(transformAdminResearchToStudyFormat);
    allResults.push(...transformedAdminResearch);
    
    const uniqueResults = allResults.filter((study, index, self) =>
      index === self.findIndex(s => s.id === study.id)
    );
    
    return uniqueResults.slice(0, 20);
  } catch (error) {
    console.error('Error generating interest-based results:', error);
    try {
      return await nasaOSDRService.getRecentStudies(10);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return [];
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  setupAdminAuth(app);
  setupAdminRoutes(app);
  
  await initializeDefaultAdmin();

  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const validatedData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.user!.id, validatedData);
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Profile update error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid profile data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app.put("/api/user/password", requireAuth, async (req, res) => {
    try {
      const validatedData = updatePasswordSchema.parse(req.body);
      const { currentPassword, newPassword } = validatedData;
      
      await storage.updateUserPassword(req.user!.id, currentPassword, newPassword);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error('Password update error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid password data", 
          errors: error.errors 
        });
      }
      if (error instanceof Error) {
        if (error.message === 'Current password is incorrect') {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
        if (error.message === 'User not found') {
          return res.status(404).json({ message: "User not found" });
        }
      }
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  app.put("/api/user/username", requireAuth, async (req, res) => {
    try {
      const validatedData = updateUsernameSchema.parse(req.body);
      const { username: newUsername, password } = validatedData;
      
      const updatedUser = await storage.updateUserUsername(req.user!.id, newUsername, password);
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ message: "Username updated successfully", user: userWithoutPassword });
    } catch (error) {
      console.error('Username update error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid username data", 
          errors: error.errors 
        });
      }
      if (error instanceof Error) {
        if (error.message === 'Password is incorrect') {
          return res.status(400).json({ message: "Password is incorrect" });
        }
        if (error.message === 'Username is already taken') {
          return res.status(409).json({ message: "Username is already taken" });
        }
        if (error.message === 'User not found') {
          return res.status(404).json({ message: "User not found" });
        }
      }
      res.status(500).json({ message: "Failed to update username" });
    }
  });

  app.get("/api/study/:studyId/metadata", requireAuth, async (req, res) => {
    try {
      const { studyId } = req.params;
      
      if (!studyId) {
        return res.status(400).json({ message: "Study ID is required" });
      }

      let metadata = await nasaOSDRService.getStudyMetadataV2(studyId);
      
      if (!metadata) {
        metadata = await nasaOSDRService.getStudyMetadata(studyId);
      }

      if (!metadata) {
        return res.status(404).json({ message: "Study not found" });
      }

      res.json(metadata);
    } catch (error) {
      console.error('Error fetching study metadata:', error);
      res.status(500).json({ message: "Failed to fetch study metadata" });
    }
  });

  app.post("/api/search", requireAuth, async (req, res) => {
    try {
      const searchRequest = searchRequestSchema.parse(req.body);
      const { query, filters, interests, sortOptions } = searchRequest;

      if (interests && interests.length > 0) {
        const interestBasedResults = await generateInterestBasedResults(interests);
        
        if (sortOptions && sortOptions.sortBy) {
          interestBasedResults.sort((a, b) => {
            let comparison = 0;
            
            switch (sortOptions.sortBy) {
              case "date":
                comparison = (a.year || 0) - (b.year || 0);
                break;
              case "title":
                comparison = (a.title || "").localeCompare(b.title || "");
                break;
              case "author":
                const aAuthor = Array.isArray(a.authors) ? a.authors[0] : a.authors || "";
                const bAuthor = Array.isArray(b.authors) ? b.authors[0] : b.authors || "";
                comparison = aAuthor.localeCompare(bAuthor);
                break;
              case "citations":
                comparison = (a.citations || 0) - (b.citations || 0);
                break;
              case "relevance":
              default:
                comparison = 0;
                break;
            }
            
            if (sortOptions.sortOrder === "desc") {
              comparison = -comparison;
            }
            
            return comparison;
          });
        }
        
        return res.json({
          results: interestBasedResults,
          totalCount: interestBasedResults.length,
        });
      }

      const searchFilters = {
        query: query && query.trim() ? query.trim() : undefined,
        organism: filters.organism && filters.organism.length > 0 ? filters.organism : undefined,
        assayType: filters.experimentType && filters.experimentType.length > 0 ? filters.experimentType : undefined,
        mission: filters.mission && filters.mission.length > 0 ? filters.mission : undefined,
        tissueType: filters.tissueType && filters.tissueType.length > 0 ? filters.tissueType : undefined,
        yearRange: undefined,
        dataType: undefined,
        limit: 30
      };

      let osdrResults: any[] = [];
      
      try {
        if (searchFilters.organism || searchFilters.assayType || searchFilters.mission || searchFilters.tissueType) {
          osdrResults = await nasaOSDRService.searchStudiesAdvanced(searchFilters);
        } else if (query && query.trim()) {
          osdrResults = await nasaOSDRService.searchStudies(query.trim(), 30);
        } else {
          osdrResults = await nasaOSDRService.getRecentStudies(30);
        }
      } catch (nasaError) {
        console.error('NASA OSDR API error, continuing with admin research only:', nasaError);
        osdrResults = [];
      }

      const adminResearch = await storage.getAllAdminResearch(false);
      const transformedAdminResearch = adminResearch.map(transformAdminResearchToStudyFormat);
      const allResults = [...osdrResults, ...transformedAdminResearch];

      let filteredResults = allResults;

      if (filters.yearRange && filters.yearRange !== "All Years") {
        if (filters.yearRange === "2020-2024") {
          filteredResults = filteredResults.filter(study => 
            study.year >= 2020 && study.year <= 2024
          );
        } else if (filters.yearRange === "2015-2019") {
          filteredResults = filteredResults.filter(study => 
            study.year >= 2015 && study.year <= 2019
          );
        } else if (filters.yearRange === "2010-2014") {
          filteredResults = filteredResults.filter(study => 
            study.year >= 2010 && study.year <= 2014
          );
        } else if (filters.yearRange === "2005-2009") {
          filteredResults = filteredResults.filter(study => 
            study.year >= 2005 && study.year <= 2009
          );
        } else if (filters.yearRange === "2000-2004") {
          filteredResults = filteredResults.filter(study => 
            study.year >= 2000 && study.year <= 2004
          );
        }
      }

      if (filters.customDateRange?.start || filters.customDateRange?.end) {
        const startYear = filters.customDateRange.start ? parseInt(filters.customDateRange.start.split('-')[0]) : 0;
        const endYear = filters.customDateRange.end ? parseInt(filters.customDateRange.end.split('-')[0]) : 9999;
        
        filteredResults = filteredResults.filter(study => 
          study.year >= startYear && study.year <= endYear
        );
      }

      if (filters.organism && Array.isArray(filters.organism) && filters.organism.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.organism.some((org: string) =>
            study.organism?.toLowerCase().includes(org.toLowerCase()) ||
            study.tags?.some((tag: string) => tag.toLowerCase().includes(org.toLowerCase())) ||
            study.title?.toLowerCase().includes(org.toLowerCase()) ||
            study.abstract?.toLowerCase().includes(org.toLowerCase()) ||
            (study.isAdminCreated && searchInCustomFields(study.customFields, org))
          )
        );
      }

      if (filters.experimentType && Array.isArray(filters.experimentType) && filters.experimentType.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.experimentType.some((type: string) =>
            study.assayType?.toLowerCase().includes(type.toLowerCase()) ||
            study.tags?.some((tag: string) => tag.toLowerCase().includes(type.toLowerCase())) ||
            study.title?.toLowerCase().includes(type.toLowerCase()) ||
            study.abstract?.toLowerCase().includes(type.toLowerCase()) ||
            (study.isAdminCreated && searchInCustomFields(study.customFields, type))
          )
        );
      }

      if (filters.researchArea && Array.isArray(filters.researchArea) && filters.researchArea.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.researchArea.some((area: string) =>
            study.title?.toLowerCase().includes(area.toLowerCase()) ||
            study.abstract?.toLowerCase().includes(area.toLowerCase()) ||
            study.tags?.some((tag: string) => tag.toLowerCase().includes(area.toLowerCase())) ||
            (study.isAdminCreated && searchInCustomFields(study.customFields, area))
          )
        );
      }

      if (filters.mission && Array.isArray(filters.mission) && filters.mission.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.mission.some((mission: string) =>
            study.missionName?.toLowerCase().includes(mission.toLowerCase()) ||
            study.title?.toLowerCase().includes(mission.toLowerCase()) ||
            study.abstract?.toLowerCase().includes(mission.toLowerCase()) ||
            (study.isAdminCreated && searchInCustomFields(study.customFields, mission))
          )
        );
      }

      if (filters.tissueType && Array.isArray(filters.tissueType) && filters.tissueType.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.tissueType.some((tissue: string) =>
            study.tissueType?.toLowerCase().includes(tissue.toLowerCase()) ||
            study.tags?.some((tag: string) => tag.toLowerCase().includes(tissue.toLowerCase())) ||
            study.title?.toLowerCase().includes(tissue.toLowerCase()) ||
            study.abstract?.toLowerCase().includes(tissue.toLowerCase()) ||
            (study.isAdminCreated && searchInCustomFields(study.customFields, tissue))
          )
        );
      }


      if (query && query.trim()) {
        const searchQuery = query.toLowerCase().trim();
        filteredResults = filteredResults.filter(study =>
          study.title?.toLowerCase().includes(searchQuery) ||
          study.abstract?.toLowerCase().includes(searchQuery) ||
          study.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery)) ||
          study.authors?.some((author: string) => author.toLowerCase().includes(searchQuery)) ||
          study.institution?.toLowerCase().includes(searchQuery) ||
          study.year?.toString().includes(searchQuery) ||
          study.nasaOsdrLinks?.some((link: string) => link.toLowerCase().includes(searchQuery)) ||
          (study.isAdminCreated && searchInCustomFields(study.customFields, searchQuery))
        );
      }

      if (filters.keywords && Array.isArray(filters.keywords) && filters.keywords.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.keywords.some((keyword: string) =>
            study.title?.toLowerCase().includes(keyword.toLowerCase()) ||
            study.abstract?.toLowerCase().includes(keyword.toLowerCase()) ||
            study.tags?.some((tag: string) => tag.toLowerCase().includes(keyword.toLowerCase())) ||
            study.authors?.some((author: string) => author.toLowerCase().includes(keyword.toLowerCase())) ||
            study.institution?.toLowerCase().includes(keyword.toLowerCase()) ||
            study.year?.toString().includes(keyword.toLowerCase()) ||
            study.nasaOsdrLinks?.some((link: string) => link.toLowerCase().includes(keyword.toLowerCase())) ||
            (study.isAdminCreated && searchInCustomFields(study.customFields, keyword))
          )
        );
      }

      if (filters.osdStudyNumber && filters.osdStudyNumber.trim()) {
        const osdNumber = filters.osdStudyNumber.trim().toUpperCase();
        filteredResults = filteredResults.filter(study =>
          study.osdStudyNumber?.toUpperCase().includes(osdNumber) ||
          study.id?.toUpperCase().includes(osdNumber) ||
          study.title?.toUpperCase().includes(osdNumber)
        );
      }

      if (sortOptions && sortOptions.sortBy) {
        filteredResults.sort((a, b) => {
          let comparison = 0;
          
          switch (sortOptions.sortBy) {
            case "date":
              comparison = (a.year || 0) - (b.year || 0);
              break;
            case "title":
              comparison = (a.title || "").localeCompare(b.title || "");
              break;
            case "author":
              const aAuthor = Array.isArray(a.authors) ? a.authors[0] : a.authors || "";
              const bAuthor = Array.isArray(b.authors) ? b.authors[0] : b.authors || "";
              comparison = aAuthor.localeCompare(bAuthor);
              break;
            case "citations":
              comparison = 0;
              break;
            case "relevance":
            default:
              comparison = 0;
              break;
          }
          
          if (sortOptions.sortOrder === "desc") {
            comparison = -comparison;
          }
          
          if (comparison === 0 && sortOptions.secondarySort) {
            switch (sortOptions.secondarySort) {
              case "date":
                comparison = (a.year || 0) - (b.year || 0);
                break;
              case "title":
                comparison = (a.title || "").localeCompare(b.title || "");
                break;
              default:
                break;
            }
          }
          
          return comparison;
        });
      }

      await storage.createSearch(req.user!.id, query, filters, filteredResults);

      res.json({
        query,
        filters,
        results: filteredResults,
        totalCount: filteredResults.length
      });
    } catch (error) {
      console.error("Search error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid search parameters", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/search/suggestions", isAuthenticated, async (req, res) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.json([]);
      }

      const suggestions = await generateSearchSuggestions(query as string);
      res.json(suggestions);
    } catch (error) {
      console.error("Suggestions error:", error);
      res.json([]);
    }
  });

  app.post("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const { studyId, studyTitle, studyData } = req.body;
      const favorite = await storage.createFavorite(req.user!.id, studyId, studyTitle, studyData);
      res.json(favorite);
    } catch (error) {
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.get("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const favorites = await storage.getUserFavorites(req.user!.id);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.delete("/api/favorites/:studyId", isAuthenticated, async (req, res) => {
    try {
      await storage.removeFavorite(req.user!.id, req.params.studyId);
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.post("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const { 
        message, 
        context = {}, 
        mode = ConversationMode.RESEARCH_ASSISTANT,
        currentStudy,
        currentPage 
      } = req.body;

      const user = await storage.getUser(req.user!.id);
      const favorites = await storage.getUserFavorites(req.user!.id);
      const allSearches = await storage.getUserSearches(req.user!.id);
      const recentSearches = allSearches.slice(0, 5);

      const enhancedContext: ChatContext = {
        currentStudy,
        userInterests: user?.interests || [],
        recentSearches: recentSearches.map((s: any) => s.query).filter(Boolean),
        currentPage,
        favoriteStudies: favorites,
        researchGoals: [],
        ...context
      };

      let chatSession = await storage.getChatSession(req.user!.id);
      const chatHistory = chatSession?.messages || [];

      const response = await generateChatResponse(message, enhancedContext, chatHistory, mode);

      const newMessages = [
        ...chatHistory,
        { role: "user", content: message, timestamp: new Date().toISOString() },
        { role: "assistant", content: response, timestamp: new Date().toISOString() }
      ];

      chatSession = await storage.updateChatSession(req.user!.id, newMessages);

      res.json({
        response,
        chatHistory: newMessages,
        context: enhancedContext
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Chat service unavailable" });
    }
  });

  app.get("/api/chat/history", isAuthenticated, async (req, res) => {
    try {
      const chatSession = await storage.getChatSession(req.user!.id);
      res.json(chatSession?.messages || []);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  app.post("/api/study/summarize", isAuthenticated, async (req, res) => {
    try {
      const { studyText } = req.body;
      const summary = await summarizeStudy(studyText);
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  app.post("/api/studies/compare", isAuthenticated, async (req, res) => {
    try {
      const { studies } = req.body;
      if (!studies || !Array.isArray(studies) || studies.length < 2) {
        return res.status(400).json({ message: "At least 2 studies required for comparison" });
      }
      
      const analysis = await analyzeStudyComparison(studies);
      res.json({ analysis });
    } catch (error) {
      console.error("Study comparison error:", error);
      res.status(500).json({ message: "Failed to generate study comparison" });
    }
  });

  app.post("/api/research/pathway", isAuthenticated, async (req, res) => {
    try {
      const { interests, currentKnowledge = "Beginner" } = req.body;
      if (!interests || !Array.isArray(interests) || interests.length === 0) {
        return res.status(400).json({ message: "Research interests are required" });
      }
      
      const pathway = await generateResearchPathway(interests, currentKnowledge);
      res.json({ pathway });
    } catch (error) {
      console.error("Research pathway error:", error);
      res.status(500).json({ message: "Failed to generate research pathway" });
    }
  });

  app.post("/api/search/advanced-suggestions", isAuthenticated, async (req, res) => {
    try {
      const { query, context = {} } = req.body;
      if (!query) {
        return res.json([]);
      }

      const user = await storage.getUser(req.user!.id);
      const enhancedQuery = `${query} (User interests: ${user?.interests?.join(', ') || 'general space biology'})`;
      
      const suggestions = await generateSearchSuggestions(enhancedQuery);
      res.json(suggestions);
    } catch (error) {
      console.error("Advanced suggestions error:", error);
      res.json([]);
    }
  });

  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const osdrStats = await nasaOSDRService.getStatistics();
      const adminResearch = await storage.getAllAdminResearch(true);
      
      const categoryStats: Record<string, number> = { ...osdrStats.categoryStats };
      adminResearch.forEach((research: any) => {
        if (research.tags && Array.isArray(research.tags)) {
          research.tags.forEach((tag: string) => {
            if (!categoryStats[tag]) {
              categoryStats[tag] = 0;
            }
            categoryStats[tag]++;
          });
        }
      });

      const yearlyTrends: Record<string, number> = { ...osdrStats.yearlyTrends };
      adminResearch.forEach((research: any) => {
        if (research.year) {
          if (!yearlyTrends[research.year]) {
            yearlyTrends[research.year] = 0;
          }
          yearlyTrends[research.year]++;
        }
      });

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData = [];
      
      for (let i = Math.max(0, currentMonth - 6); i <= currentMonth; i++) {
        const monthName = months[i];
        const osdrStudies = Math.floor((osdrStats.recentStudiesCount || 0) / 7);
        
        const adminMonthlyCount = adminResearch.filter((research: any) => {
          if (!research.createdAt) return false;
          const researchDate = new Date(research.createdAt);
          return researchDate.getMonth() === i && researchDate.getFullYear() === currentYear;
        }).length;
        
        const totalStudies = osdrStudies + adminMonthlyCount;
        monthlyData.push({
          month: monthName,
          papers: totalStudies * 2,
          studies: totalStudies
        });
      }

      const currentYearResearch = adminResearch.filter((research: any) => {
        return research.year === currentYear.toString() || 
               (research.createdAt && new Date(research.createdAt).getFullYear() === currentYear);
      }).length;

      res.json({
        totalPapers: osdrStats.totalStudies + adminResearch.length,
        recentStudies: osdrStats.recentStudiesCount + currentYearResearch,
        activeProjects: Math.floor((osdrStats.totalStudies + adminResearch.length) / 25),
        categoryStats,
        monthlyData,
        researchTrends: yearlyTrends
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/filter-options", isAuthenticated, async (req, res) => {
    try {
      const adminResearch = await storage.getAllAdminResearch(true);
      
      const allTags = new Set<string>();
      const customFieldValues = new Set<string>();
      
      adminResearch.forEach((research: any) => {
        if (research.tags && Array.isArray(research.tags)) {
          research.tags.forEach((tag: string) => allTags.add(tag));
        }
        
        if (research.customFields && typeof research.customFields === 'object') {
          Object.values(research.customFields).forEach((value: any) => {
            if (typeof value === 'string' && value.trim()) {
              customFieldValues.add(value.trim());
            } else if (Array.isArray(value)) {
              value.forEach((item: any) => {
                if (typeof item === 'string' && item.trim()) {
                  customFieldValues.add(item.trim());
                }
              });
            }
          });
        }
      });

      const organismKeywords = ['human', 'arabidopsis', 'mouse', 'rat', 'drosophila', 'elegans', 'coli', 'yeast', 'cell culture', 'mammalian', 'plant', 'microbial', 'organism'];
      const missionKeywords = ['iss', 'spacex', 'artemis', 'apollo', 'shuttle', 'skylab', 'mir', 'dragon', 'crew', 'mission', 'spaceflight', 'expedition'];
      const researchAreaKeywords = ['health', 'biology', 'microbiology', 'radiation', 'neuroscience', 'bone', 'food', 'sleep', 'cardiovascular', 'culture', 'genetics', 'biotechnology', 'medicine', 'physiology'];
      const experimentTypeKeywords = ['rna-seq', 'proteomics', 'metabolomics', 'imaging', 'behavioral', 'physiology', 'transcriptomics', 'genomics', 'assay', 'sequencing'];
      const tissueTypeKeywords = ['muscle', 'bone', 'blood', 'tissue', 'organ', 'cell', 'brain', 'heart', 'liver', 'kidney'];

      const allSearchableValues = new Set([...Array.from(allTags), ...Array.from(customFieldValues)]);

      const filterOptions = {
        organisms: Array.from(allSearchableValues).filter(tag => 
          organismKeywords.some(keyword => tag.toLowerCase().includes(keyword))
        ),
        missions: Array.from(allSearchableValues).filter(tag => 
          missionKeywords.some(keyword => tag.toLowerCase().includes(keyword))
        ),
        researchAreas: Array.from(allSearchableValues).filter(tag => 
          researchAreaKeywords.some(keyword => tag.toLowerCase().includes(keyword))
        ),
        experimentTypes: Array.from(allSearchableValues).filter(tag => 
          experimentTypeKeywords.some(keyword => tag.toLowerCase().includes(keyword))
        ),
        tissueTypes: Array.from(allSearchableValues).filter(tag => 
          tissueTypeKeywords.some(keyword => tag.toLowerCase().includes(keyword))
        ),
        allTags: Array.from(allTags)
      };

      res.json(filterOptions);
    } catch (error) {
      console.error("Filter options error:", error);
      res.status(500).json({ message: "Failed to fetch filter options" });
    }
  });

  app.get("/api/research/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      if (id.startsWith('admin-')) {
        const actualId = id.replace('admin-', '');
        const research = await storage.getAdminResearch(actualId);
        
        if (!research) {
          return res.status(404).json({ message: "Research not found" });
        }
        
        const transformedResearch = transformAdminResearchToStudyFormat(research);
        return res.json(transformedResearch);
      }
      
      const study = await nasaOSDRService.getStudyMetadata(id);
      
      if (!study) {
        return res.status(404).json({ message: "Research not found" });
      }
      
      res.json(study);
    } catch (error) {
      console.error("Get research error:", error);
      res.status(500).json({ message: "Failed to fetch research" });
    }
  });

  app.post("/api/suggestions", isAuthenticated, async (req, res) => {
    try {
      const { researchId, type, message } = req.body;
      
      if (!researchId || !type || !message) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const suggestion = await storage.createResearchSuggestion({
        researchId,
        userId: req.user!.id,
        type,
        message
      });
      
      res.json(suggestion);
    } catch (error) {
      console.error("Create suggestion error:", error);
      res.status(500).json({ message: "Failed to create suggestion" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}