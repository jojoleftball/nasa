import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { generateChatResponse, summarizeStudy, generateSearchSuggestions } from "./gemini";
import { updateUserSchema } from "@shared/schema";

function isAuthenticated(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
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
  app.post("/api/search", isAuthenticated, async (req, res) => {
    try {
      const { query, filters = {} } = req.body;
      
      // Mock NASA OSDR search results - in production this would call actual NASA API
      const mockResults = [
        {
          id: "nasa_study_001",
          title: "Effects of Microgravity on Plant Cell Wall Composition",
          abstract: "This study examines how microgravity conditions affect the cellular structure and wall composition of various plant species, providing insights into potential agricultural applications for long-duration space missions.",
          year: 2023,
          authors: ["Dr. Sarah Chen", "Dr. Michael Rodriguez"],
          institution: "NASA Ames Research Center",
          tags: ["Plant Biology", "Microgravity", "Agriculture"],
          url: "https://www.nasa.gov/osdr/study-001"
        },
        {
          id: "nasa_study_002",
          title: "Cardiovascular Adaptations in Long-Duration Spaceflight",
          abstract: "Comprehensive analysis of cardiovascular system changes during extended periods in microgravity, including implications for crew health and mission planning for Mars exploration.",
          year: 2022,
          authors: ["Dr. Jennifer Kim", "Dr. Robert Thompson"],
          institution: "Johnson Space Center",
          tags: ["Human Health", "Cardiovascular", "Long-duration"],
          url: "https://www.nasa.gov/osdr/study-002"
        },
        {
          id: "nasa_study_003",
          title: "Radiation Shielding Effectiveness for Biological Systems",
          abstract: "Investigation of various shielding materials and their effectiveness in protecting biological specimens from cosmic radiation during interplanetary missions.",
          year: 2024,
          authors: ["Dr. Alex Martinez", "Dr. Lisa Wang"],
          institution: "Glenn Research Center",
          tags: ["Radiation", "Shielding", "Protection"],
          url: "https://www.nasa.gov/osdr/study-003"
        }
      ];

      // Apply filters to mock results
      let filteredResults = mockResults;
      
      if (filters.yearRange && filters.yearRange !== "All Years") {
        const [startYear, endYear] = filters.yearRange.split("-").map(Number);
        filteredResults = filteredResults.filter(study => 
          study.year >= startYear && study.year <= endYear
        );
      }

      if (filters.organism && filters.organism !== "All Organisms") {
        filteredResults = filteredResults.filter(study =>
          study.tags.some(tag => tag.toLowerCase().includes(filters.organism.toLowerCase()))
        );
      }

      if (filters.experimentType && filters.experimentType !== "All Types") {
        filteredResults = filteredResults.filter(study =>
          study.tags.some(tag => tag.toLowerCase().includes(filters.experimentType.toLowerCase()))
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

  // Chat endpoints
  app.post("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const { message, context = "" } = req.body;
      
      // Get chat history
      let chatSession = await storage.getChatSession(req.user!.id);
      const chatHistory = chatSession?.messages || [];

      // Generate response
      const response = await generateChatResponse(message, context, chatHistory);

      // Update chat session
      const newMessages = [
        ...chatHistory,
        { role: "user", content: message, timestamp: new Date().toISOString() },
        { role: "assistant", content: response, timestamp: new Date().toISOString() }
      ];

      chatSession = await storage.updateChatSession(req.user!.id, newMessages);

      res.json({
        response,
        chatHistory: newMessages
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

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      // Mock stats - in production would query actual NASA database
      res.json({
        totalPapers: 1247,
        recentStudies: 89,
        activeProjects: 23,
        categoryStats: {
          "Plant Biology": 420,
          "Human Health": 380,
          "Microbiology": 280,
          "Radiation Studies": 167
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
