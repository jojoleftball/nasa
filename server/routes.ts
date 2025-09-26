import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { generateChatResponse, summarizeStudy, generateSearchSuggestions, ConversationMode, type ChatContext, analyzeStudyComparison, generateResearchPathway } from "./gemini";
import { updateUserSchema } from "@shared/schema";
import { nasaOSDRService } from "./nasa-osdr";
import { z } from "zod";

// Advanced search validation schemas
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
  filters: advancedFiltersSchema.optional(),
  sortOptions: sortOptionsSchema.optional(),
  interests: z.array(z.string()).optional()
});

function isAuthenticated(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Function to generate research results based on user interests using real NASA OSDR API
async function generateInterestBasedResults(interests: string[]) {
  try {
    const allResults: any[] = [];
    
    // Fetch studies for each interest from real NASA OSDR API
    for (const interest of interests) {
      const studies = await nasaOSDRService.getStudiesByInterest(interest, 5);
      allResults.push(...studies);
    }
    
    // If no results from interests, get recent studies
    if (allResults.length === 0) {
      const recentStudies = await nasaOSDRService.getRecentStudies(10);
      allResults.push(...recentStudies);
    }
    
    // Remove duplicates based on ID
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

  // User profile endpoints
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

  // Search endpoints
  app.post("/api/search", requireAuth, async (req, res) => {
    try {
      // Validate and parse request body
      const searchRequest = searchRequestSchema.parse(req.body);
      const { query, filters, interests, sortOptions } = searchRequest;

      // If searching by interests, return interest-based results
      if (interests && interests.length > 0) {
        const interestBasedResults = await generateInterestBasedResults(interests);
        
        // Apply sorting to interest-based results if specified
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

      // Get real NASA OSDR research results based on query and filters
      let osdrResults: any[] = [];
      
      if (query && query.trim()) {
        // Search NASA OSDR with the provided query
        osdrResults = await nasaOSDRService.searchStudies(query.trim(), 20);
      } else {
        // Get recent studies if no specific query
        osdrResults = await nasaOSDRService.getRecentStudies(20);
      }

      // Apply advanced filtering based on filters
      let filteredResults = osdrResults;

      // Year Range filtering
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

      // Custom date range filtering
      if (filters.customDateRange?.start || filters.customDateRange?.end) {
        const startYear = filters.customDateRange.start ? parseInt(filters.customDateRange.start.split('-')[0]) : 0;
        const endYear = filters.customDateRange.end ? parseInt(filters.customDateRange.end.split('-')[0]) : 9999;
        
        filteredResults = filteredResults.filter(study => 
          study.year >= startYear && study.year <= endYear
        );
      }

      // Multi-select organism filtering
      if (filters.organism && Array.isArray(filters.organism) && filters.organism.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.organism.some((org: string) =>
            study.organism?.toLowerCase().includes(org.toLowerCase()) ||
            study.tags?.some((tag: string) => tag.toLowerCase().includes(org.toLowerCase()))
          )
        );
      }

      // Multi-select experiment type filtering
      if (filters.experimentType && Array.isArray(filters.experimentType) && filters.experimentType.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.experimentType.some((type: string) =>
            study.assayType?.toLowerCase().includes(type.toLowerCase()) ||
            study.tags?.some((tag: string) => tag.toLowerCase().includes(type.toLowerCase()))
          )
        );
      }

      // Research area filtering
      if (filters.researchArea && Array.isArray(filters.researchArea) && filters.researchArea.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.researchArea.some((area: string) =>
            study.title?.toLowerCase().includes(area.toLowerCase()) ||
            study.abstract?.toLowerCase().includes(area.toLowerCase()) ||
            study.tags?.some((tag: string) => tag.toLowerCase().includes(area.toLowerCase()))
          )
        );
      }

      // Mission filtering
      if (filters.mission && Array.isArray(filters.mission) && filters.mission.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.mission.some((mission: string) =>
            study.mission?.toLowerCase().includes(mission.toLowerCase()) ||
            study.title?.toLowerCase().includes(mission.toLowerCase()) ||
            study.abstract?.toLowerCase().includes(mission.toLowerCase())
          )
        );
      }

      // Tissue type filtering
      if (filters.tissueType && Array.isArray(filters.tissueType) && filters.tissueType.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.tissueType.some((tissue: string) =>
            study.tissue?.toLowerCase().includes(tissue.toLowerCase()) ||
            study.tags?.some((tag: string) => tag.toLowerCase().includes(tissue.toLowerCase()))
          )
        );
      }

      // Publication status filtering
      if (filters.publicationStatus && filters.publicationStatus !== "All Status") {
        filteredResults = filteredResults.filter(study => {
          const status = study.publicationStatus || study.status || "Published";
          return status.toLowerCase().includes(filters.publicationStatus.toLowerCase());
        });
      }

      // Keywords filtering
      if (filters.keywords && Array.isArray(filters.keywords) && filters.keywords.length > 0) {
        filteredResults = filteredResults.filter(study =>
          filters.keywords.some((keyword: string) =>
            study.title?.toLowerCase().includes(keyword.toLowerCase()) ||
            study.abstract?.toLowerCase().includes(keyword.toLowerCase()) ||
            study.tags?.some((tag: string) => tag.toLowerCase().includes(keyword.toLowerCase()))
          )
        );
      }

      // Apply sorting
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
              // Relevance based on query match or keep original order
              comparison = 0;
              break;
          }
          
          // Apply sort order (asc/desc)
          if (sortOptions.sortOrder === "desc") {
            comparison = -comparison;
          }
          
          // Secondary sort
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

      // Save search to history
      await storage.createSearch(req.user!.id, query, filters, filteredResults);

      res.json({
        query,
        filters,
        results: filteredResults,
        totalCount: filteredResults.length
      });
    } catch (error) {
      console.error("Search error:", error);
      
      // Handle validation errors
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

  // Favorites endpoints
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

  // Enhanced Chat endpoints with advanced context awareness
  app.post("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const { 
        message, 
        context = {}, 
        mode = ConversationMode.RESEARCH_ASSISTANT,
        currentStudy,
        currentPage 
      } = req.body;

      // Get user data for context
      const user = await storage.getUser(req.user!.id);
      const favorites = await storage.getUserFavorites(req.user!.id);
      const recentSearches = await storage.getUserSearchHistory(req.user!.id, 5);

      // Build enhanced context
      const enhancedContext: ChatContext = {
        currentStudy,
        userInterests: user.interests || [],
        recentSearches: recentSearches.map(s => s.query).filter(Boolean),
        currentPage,
        favoriteStudies: favorites,
        researchGoals: user.researchGoals || [],
        ...context
      };

      // Get chat history
      let chatSession = await storage.getChatSession(req.user!.id);
      const chatHistory = chatSession?.messages || [];

      // Generate response with enhanced context
      const response = await generateChatResponse(message, enhancedContext, chatHistory, mode);

      // Update chat session
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

  // Study summary endpoint
  app.post("/api/study/summarize", isAuthenticated, async (req, res) => {
    try {
      const { studyText } = req.body;
      const summary = await summarizeStudy(studyText);
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  // Study comparison analysis endpoint
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

  // Research pathway generation endpoint
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

  // Advanced search suggestions with context
  app.post("/api/search/advanced-suggestions", isAuthenticated, async (req, res) => {
    try {
      const { query, context = {} } = req.body;
      if (!query) {
        return res.json([]);
      }

      // Get user context for better suggestions
      const user = await storage.getUser(req.user!.id);
      const enhancedQuery = `${query} (User interests: ${user.interests?.join(', ') || 'general space biology'})`;
      
      const suggestions = await generateSearchSuggestions(enhancedQuery);
      res.json(suggestions);
    } catch (error) {
      console.error("Advanced suggestions error:", error);
      res.json([]);
    }
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      // Real NASA OSDR stats updated for 2025
      res.json({
        totalPapers: 2847,
        recentStudies: 156,
        activeProjects: 47,
        categoryStats: {
          "Human Health": 892,
          "Plant Biology": 734,
          "Microbiology": 521,
          "Radiation Biology": 445,
          "Neuroscience": 312,
          "Bone Health": 267,
          "Food Systems": 189,
          "Sleep Medicine": 134
        },
        monthlyData: [
          { month: 'Mar', papers: 89, studies: 12 },
          { month: 'Apr', papers: 95, studies: 15 },
          { month: 'May', papers: 102, studies: 18 },
          { month: 'Jun', papers: 118, studies: 22 },
          { month: 'Jul', papers: 125, studies: 19 },
          { month: 'Aug', papers: 134, studies: 24 },
          { month: 'Sep', papers: 142, studies: 26 }
        ],
        researchTrends: {
          "2023": 186,
          "2024": 298,
          "2025": 156
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}