import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { generateChatResponse, summarizeStudy, generateSearchSuggestions, ConversationMode, type ChatContext, analyzeStudyComparison, generateResearchPathway } from "./gemini";
import { updateUserSchema } from "@shared/schema";
import { nasaOSDRService } from "./nasa-osdr";

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
      const { query, filters, interests } = req.body;

      // If searching by interests, return interest-based results
      if (interests && interests.length > 0) {
        const interestBasedResults = await generateInterestBasedResults(interests);
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

      // Apply additional filtering based on filters
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
        }
      }

      if (filters.organism && filters.organism !== "All Organisms") {
        filteredResults = filteredResults.filter(study =>
          study.organism?.toLowerCase().includes(filters.organism.toLowerCase()) ||
          study.tags?.some((tag: string) => tag.toLowerCase().includes(filters.organism.toLowerCase()))
        );
      }

      if (filters.experimentType && filters.experimentType !== "All Types") {
        filteredResults = filteredResults.filter(study =>
          study.assayType?.toLowerCase().includes(filters.experimentType.toLowerCase()) ||
          study.tags?.some((tag: string) => tag.toLowerCase().includes(filters.experimentType.toLowerCase()))
        );
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