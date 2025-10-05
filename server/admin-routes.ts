import { Express } from "express";
import { storage } from "./storage";
import { requireAdminAuth } from "./admin-auth";
import { insertAdminResearchSchema, updateAdminResearchSchema } from "@shared/schema";
import { z } from "zod";
import { generateAdminAssistantResponse } from "./admin-gemini";

export function setupAdminRoutes(app: Express) {
  app.get("/api/admin/research", requireAdminAuth, async (req, res) => {
    try {
      const publishedOnly = req.query.publishedOnly === 'true';
      const research = await storage.getAllAdminResearch(publishedOnly);
      res.json(research);
    } catch (error) {
      console.error("Error fetching admin research:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/research/:id", requireAdminAuth, async (req, res) => {
    try {
      const research = await storage.getAdminResearch(req.params.id);
      if (!research) {
        return res.status(404).json({ message: "Research not found" });
      }
      res.json(research);
    } catch (error) {
      console.error("Error fetching admin research:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/research", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertAdminResearchSchema.parse({
        ...req.body,
        createdBy: req.session.adminId,
      });

      const research = await storage.createAdminResearch(validatedData);
      res.status(201).json(research);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: error.errors[0].message,
          field: error.errors[0].path[0] 
        });
      }
      console.error("Error creating admin research:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/research/:id", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = updateAdminResearchSchema.parse(req.body);
      const research = await storage.updateAdminResearch(req.params.id, validatedData);
      res.json(research);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: error.errors[0].message,
          field: error.errors[0].path[0] 
        });
      }
      console.error("Error updating admin research:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/research/:id", requireAdminAuth, async (req, res) => {
    try {
      await storage.deleteAdminResearch(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting admin research:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/assistant", requireAdminAuth, async (req, res) => {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await generateAdminAssistantResponse(message, context);
      res.json({ response });
    } catch (error) {
      console.error("Error generating admin assistant response:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/suggestions", requireAdminAuth, async (req, res) => {
    try {
      const suggestions = await storage.getAllResearchSuggestions();
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/suggestions/:id", requireAdminAuth, async (req, res) => {
    try {
      await storage.deleteResearchSuggestion(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting suggestion:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
