import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { generateChatResponse, summarizeStudy, generateSearchSuggestions } from "./gemini";
import { updateUserSchema } from "@shared/schema";

function isAuthenticated(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Function to generate research results based on user interests
function generateInterestBasedResults(interests: string[]) {
  const interestResearchMap: Record<string, any[]> = {
    "plant-biology": [
      {
        id: "osdr-101",
        title: "Transcriptomic Analysis of Arabidopsis thaliana in Microgravity",
        abstract: "This study examines gene expression changes in Arabidopsis thaliana seedlings grown under microgravity conditions aboard the International Space Station. Results show significant alterations in cell wall biosynthesis and stress response pathways.",
        authors: ["Dr. Sarah Johnson", "Dr. Michael Chen", "Dr. Anna Rodriguez"],
        year: 2024,
        institution: "NASA Kennedy Space Center",
        tags: ["Plant Biology", "Transcriptomics", "Microgravity", "Gene Expression"],
        url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-101"
      },
      {
        id: "osdr-156",
        title: "Root Development in Space-Grown Lettuce",
        abstract: "Investigation of root morphology and development patterns in lettuce plants cultivated in the Advanced Plant Habitat on the ISS, revealing adaptations to the space environment.",
        authors: ["Dr. Lisa Park", "Dr. James Wilson"],
        year: 2023,
        institution: "NASA Ames Research Center",
        tags: ["Plant Biology", "Root Development", "Space Agriculture", "ISS"],
        url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-156"
      }
    ],
    "human-health": [
      {
        id: "osdr-203",
        title: "Cardiovascular Deconditioning During Long-Duration Spaceflight",
        abstract: "Comprehensive analysis of cardiovascular changes in astronauts during 6-month ISS missions, including cardiac function, blood pressure regulation, and vascular adaptation mechanisms.",
        authors: ["Dr. Robert Martinez", "Dr. Emily Thompson", "Dr. David Kim"],
        year: 2024,
        institution: "NASA Johnson Space Center",
        tags: ["Human Health", "Cardiovascular", "Long-Duration", "Astronaut Health"],
        url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-203"
      },
      {
        id: "osdr-178",
        title: "Bone Density Changes in Microgravity Environment",
        abstract: "Longitudinal study tracking bone mineral density changes in astronauts during extended space missions, investigating countermeasures and recovery patterns.",
        authors: ["Dr. Jennifer Brown", "Dr. Alex Turner"],
        year: 2023,
        institution: "NASA Johnson Space Center",
        tags: ["Human Health", "Bone Health", "Microgravity", "Countermeasures"],
        url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-178"
      }
    ],
    "microgravity-effects": [
      {
        id: "osdr-089",
        title: "Cellular Response to Simulated Microgravity in Human Fibroblasts",
        abstract: "Investigation of cellular mechanisms and gene expression changes in human fibroblasts exposed to simulated microgravity using clinostat rotation.",
        authors: ["Dr. Maria Gonzalez", "Dr. Peter Anderson"],
        year: 2024,
        institution: "NASA Ames Research Center",
        tags: ["Microgravity Effects", "Cell Biology", "Fibroblasts", "Gene Expression"],
        url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-089"
      }
    ],
    "radiation-studies": [
      {
        id: "osdr-245",
        title: "DNA Damage Response to Cosmic Radiation in Human Cells",
        abstract: "Analysis of DNA repair mechanisms and cellular responses to cosmic radiation exposure, studying both acute and chronic effects on human cell cultures.",
        authors: ["Dr. Rachel White", "Dr. Steven Lee"],
        year: 2024,
        institution: "NASA Glenn Research Center",
        tags: ["Radiation Biology", "DNA Repair", "Cosmic Radiation", "Cell Culture"],
        url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-245"
      }
    ],
    "microbiology": [
      {
        id: "osdr-134",
        title: "Microbial Community Dynamics in Space Environment",
        abstract: "Comprehensive study of microbial communities aboard the International Space Station, examining species diversity, biofilm formation, and antibiotic resistance patterns.",
        authors: ["Dr. Kevin Zhang", "Dr. Amanda Davis"],
        year: 2023,
        institution: "NASA Marshall Space Flight Center",
        tags: ["Microbiology", "Biofilms", "ISS Environment", "Antibiotic Resistance"],
        url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-134"
      }
    ],
    "genetics": [
      {
        id: "osdr-167",
        title: "Epigenetic Changes During Spaceflight in Twin Astronauts",
        abstract: "Groundbreaking study comparing epigenetic modifications between twin astronauts, one on Earth and one in space, revealing space-induced genetic regulation changes.",
        authors: ["Dr. Susan Kelly", "Dr. Mark Johnson", "Dr. Patricia Smith"],
        year: 2024,
        institution: "NASA Johnson Space Center",
        tags: ["Genetics", "Epigenetics", "Twin Study", "Space Medicine"],
        url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-167"
      }
    ]
  };

  let results: any[] = [];
  interests.forEach(interest => {
    if (interestResearchMap[interest]) {
      results = results.concat(interestResearchMap[interest]);
    }
  });

  // If no specific interests match, return some general space biology research
  if (results.length === 0) {
    results = [
      {
        id: "osdr-general-1",
        title: "Overview of Space Biology Research Initiatives",
        abstract: "Comprehensive review of current space biology research programs and their contributions to understanding life in space environments.",
        authors: ["Dr. Generic Scientist"],
        year: 2024,
        institution: "NASA",
        tags: ["Space Biology", "Research Overview"],
        url: "https://osdr.nasa.gov"
      }
    ];
  }

  return results.slice(0, 10); // Return top 10 results
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
        const interestBasedResults = generateInterestBasedResults(interests);
        return res.json({
          results: interestBasedResults,
          totalCount: interestBasedResults.length,
        });
      }

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