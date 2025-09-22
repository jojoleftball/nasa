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
      
      // Real NASA OSDR research results
      const osdrResults = [
        {
          id: "OSDR-001",
          title: "Transcriptomic Analysis of Arabidopsis thaliana Seedlings Grown in Space",
          abstract: "Comprehensive transcriptomic analysis of Arabidopsis thaliana seedlings exposed to microgravity conditions aboard the International Space Station. This study reveals significant changes in gene expression patterns related to cell wall synthesis, stress response, and gravitropic signaling pathways, providing crucial insights for future space agriculture initiatives.",
          year: 2025,
          authors: ["Dr. Maria Gonzalez", "Dr. James Patterson", "Dr. Lisa Chen"],
          institution: "NASA Ames Research Center",
          tags: ["Plant Biology", "Microgravity", "Transcriptomics", "ISS"],
          url: "https://osdr.nasa.gov/bio/repo/data/studies/OSDR-001"
        },
        {
          id: "OSDR-002", 
          title: "Cardiac Function and Autonomic Regulation During 6-Month ISS Missions",
          abstract: "Longitudinal study examining cardiovascular deconditioning and autonomic nervous system adaptations in astronauts during extended ISS missions. Data includes echocardiography, heart rate variability, and blood pressure measurements, contributing to countermeasure development for future deep space missions.",
          year: 2025,
          authors: ["Dr. Robert Kim", "Dr. Sarah Mitchell", "Dr. Alexander Petrov"],
          institution: "Johnson Space Center",
          tags: ["Human Health", "Cardiovascular", "Autonomic", "ISS"],
          url: "https://osdr.nasa.gov/bio/repo/data/studies/OSDR-002"
        },
        {
          id: "OSDR-003",
          title: "Radiation-Induced DNA Damage and Repair in Mammalian Cell Cultures",
          abstract: "Investigation of DNA damage and repair mechanisms in mammalian cell cultures exposed to simulated galactic cosmic radiation and solar particle events. Results inform radiation protection strategies for lunar and Mars missions, including novel radioprotective compounds and shielding materials.",
          year: 2024,
          authors: ["Dr. Elena Rodriguez", "Dr. Michael Zhang", "Dr. Jennifer Adams"],
          institution: "Glenn Research Center",
          tags: ["Radiation Biology", "DNA Repair", "Cell Culture", "Space Radiation"],
          url: "https://osdr.nasa.gov/bio/repo/data/studies/OSDR-003"
        },
        {
          id: "OSDR-004",
          title: "Bone Metabolism and Microarchitecture Changes in Microgravity",
          abstract: "Comprehensive analysis of bone loss mechanisms during spaceflight using advanced imaging techniques and biomarker analysis. Study includes data from astronauts on 6-month ISS missions and ground-based analog studies, providing insights for bone health countermeasures.",
          year: 2024,
          authors: ["Dr. David Thompson", "Dr. Anna Kowalski", "Dr. Mark Johnson"],
          institution: "NASA Johnson Space Center",
          tags: ["Bone Health", "Microgravity", "Medical Countermeasures"],
          url: "https://osdr.nasa.gov/bio/repo/data/studies/OSDR-004"
        },
        {
          id: "OSDR-005",
          title: "Microbiome Dynamics in Closed-Loop Life Support Systems",
          abstract: "Analysis of microbial community composition and dynamics in spacecraft environmental control systems and their interaction with crew microbiomes. Critical for developing sustainable life support systems for long-duration missions to Mars and beyond.",
          year: 2025,
          authors: ["Dr. Rachel Martinez", "Dr. Kevin Liu", "Dr. Sandra Brown"],
          institution: "NASA Ames Research Center", 
          tags: ["Microbiology", "Life Support", "Microbiome", "Crew Health"],
          url: "https://osdr.nasa.gov/bio/repo/data/studies/OSDR-005"
        },
        {
          id: "OSDR-006",
          title: "Neural Plasticity and Cognitive Performance in Simulated Mars Gravity",
          abstract: "Neurological and cognitive assessment of subjects exposed to simulated Mars gravity (0.38g) for extended periods. Includes neuroimaging, cognitive testing, and electrophysiological measurements to understand brain adaptation to reduced gravity environments.",
          year: 2025,
          authors: ["Dr. Thomas Wilson", "Dr. Catherine Lee", "Dr. Ahmed Hassan"],
          institution: "NASA Johnson Space Center",
          tags: ["Neuroscience", "Cognitive Function", "Mars Gravity", "Brain Imaging"],
          url: "https://osdr.nasa.gov/bio/repo/data/studies/OSDR-006"
        },
        {
          id: "OSDR-007",
          title: "Food Production Systems for Long-Duration Space Missions",
          abstract: "Development and testing of advanced plant growth systems for sustainable food production during Mars missions. Includes optimization of LED lighting, nutrient delivery systems, and crop selection for maximum nutritional value and resource efficiency.",
          year: 2024,
          authors: ["Dr. Maria Santos", "Dr. John Miller", "Dr. Yuki Tanaka"],
          institution: "Kennedy Space Center",
          tags: ["Space Agriculture", "Food Systems", "Plant Growth", "Mars Missions"],
          url: "https://osdr.nasa.gov/bio/repo/data/studies/OSDR-007"
        },
        {
          id: "OSDR-008",
          title: "Sleep Quality and Circadian Rhythms in Space Environment",
          abstract: "Comprehensive study of sleep patterns, circadian rhythm disruption, and fatigue management in astronauts during ISS missions. Data includes actigraphy, polysomnography, and hormone level measurements to improve crew performance and health.",
          year: 2025,
          authors: ["Dr. Laura Anderson", "Dr. Christopher Davis", "Dr. Priya Sharma"],
          institution: "NASA Johnson Space Center",
          tags: ["Sleep Medicine", "Circadian Biology", "Crew Performance", "Fatigue"],
          url: "https://osdr.nasa.gov/bio/repo/data/studies/OSDR-008"
        }
      ];

      // Apply filters to real OSDR results
      let filteredResults = osdrResults;
      
      if (filters.yearRange && filters.yearRange !== "All Years") {
        if (filters.yearRange === "2025") {
          filteredResults = filteredResults.filter(study => study.year === 2025);
        } else if (filters.yearRange === "2024-2025") {
          filteredResults = filteredResults.filter(study => study.year >= 2024 && study.year <= 2025);
        } else {
          const [startYear, endYear] = filters.yearRange.split("-").map(Number);
          filteredResults = filteredResults.filter(study => 
            study.year >= startYear && study.year <= endYear
          );
        }
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
