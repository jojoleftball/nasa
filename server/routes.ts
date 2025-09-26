import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { generateChatResponse, summarizeStudy, generateSearchSuggestions, ConversationMode, type ChatContext, analyzeStudyComparison, generateResearchPathway } from "./gemini";
import { updateUserSchema } from "@shared/schema";
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
  keywords: z.array(z.string()).optional().default([])
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
    keywords: []
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
    
    const uniqueResults = allResults.filter((study, index, self) =>
      index === self.findIndex(s => s.id === study.id)
    );
    
    return uniqueResults.slice(0, 10); // Return top 10 results
  } catch (error) {
    console.error('Error generating interest-based results:', error);
    // Fallback to recent studies if interest-based search fails
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

  app.put("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const validatedData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.user!.id, validatedData);
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
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

      let osdrResults: any[] = [];
      
      if (query && query.trim()) {
        osdrResults = await nasaOSDRService.searchStudies(query.trim(), 20);
      } else {
        osdrResults = await nasaOSDRService.getRecentStudies(20);
      }

      let filteredResults = osdrResults;

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
            study.tags?.some((tag: string) => tag.toLowerCase().includes(org.toLowerCase()))
          )
        );
      }

      if (filters.experimentType && Array.isArray(filters.experimentType) && filters.experimentType.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.experimentType.some((type: string) =>
            study.assayType?.toLowerCase().includes(type.toLowerCase()) ||
            study.tags?.some((tag: string) => tag.toLowerCase().includes(type.toLowerCase()))
          )
        );
      }

      if (filters.researchArea && Array.isArray(filters.researchArea) && filters.researchArea.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.researchArea.some((area: string) =>
            study.title?.toLowerCase().includes(area.toLowerCase()) ||
            study.abstract?.toLowerCase().includes(area.toLowerCase()) ||
            study.tags?.some((tag: string) => tag.toLowerCase().includes(area.toLowerCase()))
          )
        );
      }

      if (filters.mission && Array.isArray(filters.mission) && filters.mission.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.mission.some((mission: string) =>
            study.mission?.toLowerCase().includes(mission.toLowerCase()) ||
            study.title?.toLowerCase().includes(mission.toLowerCase()) ||
            study.abstract?.toLowerCase().includes(mission.toLowerCase())
          )
        );
      }

      if (filters.tissueType && Array.isArray(filters.tissueType) && filters.tissueType.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.tissueType.some((tissue: string) =>
            study.tissue?.toLowerCase().includes(tissue.toLowerCase()) ||
            study.tags?.some((tag: string) => tag.toLowerCase().includes(tissue.toLowerCase()))
          )
        );
      }

      if (filters.publicationStatus && filters.publicationStatus !== "All Status") {
        filteredResults = filteredResults.filter(study => {
          const status = study.publicationStatus || study.status || "Published";
          return status.toLowerCase().includes(filters.publicationStatus.toLowerCase());
        });
      }

      if (filters.keywords && Array.isArray(filters.keywords) && filters.keywords.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.keywords.some((keyword: string) =>
            study.title?.toLowerCase().includes(keyword.toLowerCase()) ||
            study.abstract?.toLowerCase().includes(keyword.toLowerCase()) ||
            study.tags?.some((tag: string) => tag.toLowerCase().includes(keyword.toLowerCase()))
          )
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
      
      const currentMonth = new Date().getMonth();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData = [];
      
      for (let i = Math.max(0, currentMonth - 6); i <= currentMonth; i++) {
        const monthName = months[i];
        const studies = Math.floor((osdrStats.recentStudiesCount || 0) / 7) + Math.floor(Math.random() * 5);
        monthlyData.push({
          month: monthName,
          papers: studies * 2 + Math.floor(Math.random() * 10),
          studies: studies
        });
      }

      res.json({
        totalPapers: osdrStats.totalStudies,
        recentStudies: osdrStats.recentStudiesCount,
        activeProjects: Math.floor(osdrStats.totalStudies / 25),
        categoryStats: osdrStats.categoryStats,
        monthlyData: monthlyData,
        researchTrends: osdrStats.yearlyTrends
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}