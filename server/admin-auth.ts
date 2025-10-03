import { Express } from "express";
import { storage } from "./storage";
import { Admin } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

declare global {
  namespace Express {
    interface User {
      adminId?: string;
      isAdmin?: boolean;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    adminId?: string;
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function requireAdminAuth(req: any, res: any, next: any) {
  if (!req.session?.adminId) {
    return res.status(401).json({ message: "Admin authentication required" });
  }
  next();
}

export async function initializeDefaultAdmin() {
  try {
    const existingAdmin = await storage.getAdminByUsername("admin");
    if (!existingAdmin) {
      const hashedPassword = await hashPassword("noone");
      await storage.createAdmin({
        username: "admin",
        password: hashedPassword,
      });
      console.log("Default admin user created");
    }
  } catch (error) {
    console.error("Error initializing default admin:", error);
  }
}

export function setupAdminAuth(app: Express) {
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const admin = await storage.getAdminByUsername(username);
      
      if (!admin || !(await comparePasswords(password, admin.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.adminId = admin.id;
      
      const { password: _, ...adminWithoutPassword } = admin;
      res.status(200).json(adminWithoutPassword);
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.adminId = undefined;
    res.sendStatus(200);
  });

  app.get("/api/admin/user", requireAdminAuth, async (req, res) => {
    try {
      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      
      const { password: _, ...adminWithoutPassword } = admin;
      res.json(adminWithoutPassword);
    } catch (error) {
      console.error("Error fetching admin user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
