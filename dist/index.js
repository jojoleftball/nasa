var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";
import session3 from "express-session";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminResearch: () => adminResearch,
  admins: () => admins,
  chatSessions: () => chatSessions,
  favorites: () => favorites,
  insertAdminResearchSchema: () => insertAdminResearchSchema,
  insertAdminSchema: () => insertAdminSchema,
  insertResearchSuggestionSchema: () => insertResearchSuggestionSchema,
  insertUserSchema: () => insertUserSchema,
  researchSuggestions: () => researchSuggestions,
  searches: () => searches,
  studyRecommendations: () => studyRecommendations,
  updateAdminResearchSchema: () => updateAdminResearchSchema,
  updatePasswordSchema: () => updatePasswordSchema,
  updateUserSchema: () => updateUserSchema,
  updateUsernameSchema: () => updateUsernameSchema,
  userInteractions: () => userInteractions,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  displayName: text("display_name"),
  profilePicture: text("profile_picture"),
  coverImage: text("cover_image"),
  bio: text("bio"),
  interests: jsonb("interests").$type().default([]),
  chatbotName: text("chatbot_name").default("Ria"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var searches = pgTable("searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  query: text("query").notNull(),
  filters: jsonb("filters").$type(),
  results: jsonb("results").$type(),
  createdAt: timestamp("created_at").defaultNow()
});
var favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  studyId: text("study_id").notNull(),
  studyTitle: text("study_title").notNull(),
  studyData: jsonb("study_data").$type(),
  createdAt: timestamp("created_at").defaultNow()
});
var chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  messages: jsonb("messages").$type().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var userInteractions = pgTable("user_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  studyId: text("study_id").notNull(),
  interactionType: text("interaction_type").notNull(),
  // 'view', 'favorite', 'download', 'chat_discuss'
  duration: text("duration"),
  // How long they viewed the study
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("created_at").defaultNow()
});
var studyRecommendations = pgTable("study_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  studyId: text("study_id").notNull(),
  recommendationType: text("recommendation_type").notNull(),
  // 'interest_based', 'behavior_based', 'ai_suggested'
  score: text("score").notNull(),
  // Recommendation strength (0-1)
  reasoning: text("reasoning"),
  // Why this was recommended
  studyData: jsonb("study_data").$type(),
  isViewed: boolean("is_viewed").default(false),
  isFavorited: boolean("is_favorited").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var adminResearch = pgTable("admin_research", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  year: text("year"),
  authors: text("authors"),
  institution: text("institution"),
  osdStudyNumber: text("osd_study_number"),
  tags: jsonb("tags").$type().default([]),
  nasaOsdrLinks: jsonb("nasa_osdr_links").$type().default([]),
  customFields: jsonb("custom_fields").$type().default({}),
  published: boolean("published").default(false),
  createdBy: varchar("created_by").references(() => admins.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var researchSuggestions = pgTable("research_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  researchId: text("research_id").notNull(),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true
});
var updateUserSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  displayName: true,
  profilePicture: true,
  coverImage: true,
  bio: true,
  interests: true,
  chatbotName: true
}).partial();
var updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
var updateUsernameSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters"),
  password: z.string().min(1, "Password is required for security")
});
var insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertAdminResearchSchema = createInsertSchema(adminResearch).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var updateAdminResearchSchema = createInsertSchema(adminResearch).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true
}).partial();
var insertResearchSuggestionSchema = createInsertSchema(researchSuggestions).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id, updates) {
    const updateData = { updatedAt: /* @__PURE__ */ new Date() };
    if (updates.firstName !== void 0) {
      updateData.firstName = updates.firstName;
    }
    if (updates.lastName !== void 0) {
      updateData.lastName = updates.lastName;
    }
    if (updates.displayName !== void 0) {
      updateData.displayName = updates.displayName;
    }
    if (updates.profilePicture !== void 0) {
      updateData.profilePicture = updates.profilePicture;
    }
    if (updates.coverImage !== void 0) {
      updateData.coverImage = updates.coverImage;
    }
    if (updates.bio !== void 0) {
      updateData.bio = updates.bio;
    }
    if (updates.interests !== void 0) {
      updateData.interests = updates.interests;
    }
    if (updates.chatbotName !== void 0) {
      updateData.chatbotName = updates.chatbotName;
    }
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }
  async updateUserPassword(id, currentPassword, newPassword) {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    const isCurrentPasswordValid = await comparePasswords(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }
    const hashedNewPassword = await hashPassword(newPassword);
    const [updatedUser] = await db.update(users).set({
      password: hashedNewPassword,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return updatedUser;
  }
  async updateUserUsername(id, newUsername, password) {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Password is incorrect");
    }
    const existingUser = await this.getUserByUsername(newUsername);
    if (existingUser && existingUser.id !== id) {
      throw new Error("Username is already taken");
    }
    const [updatedUser] = await db.update(users).set({
      username: newUsername,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return updatedUser;
  }
  async createSearch(userId, query, filters, results) {
    const [search] = await db.insert(searches).values({ userId, query, filters, results }).returning();
    return search;
  }
  async getUserSearches(userId) {
    return await db.select().from(searches).where(eq(searches.userId, userId));
  }
  async createFavorite(userId, studyId, studyTitle, studyData) {
    const [favorite] = await db.insert(favorites).values({ userId, studyId, studyTitle, studyData }).returning();
    return favorite;
  }
  async getUserFavorites(userId) {
    return await db.select().from(favorites).where(eq(favorites.userId, userId));
  }
  async removeFavorite(userId, studyId) {
    await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.studyId, studyId)));
  }
  async getChatSession(userId) {
    const [session4] = await db.select().from(chatSessions).where(eq(chatSessions.userId, userId));
    return session4 || void 0;
  }
  async updateChatSession(userId, messages) {
    const existingSession = await this.getChatSession(userId);
    if (existingSession) {
      const [session4] = await db.update(chatSessions).set({ messages, updatedAt: /* @__PURE__ */ new Date() }).where(eq(chatSessions.userId, userId)).returning();
      return session4;
    } else {
      const [session4] = await db.insert(chatSessions).values({ userId, messages }).returning();
      return session4;
    }
  }
  async getAdmin(id) {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin || void 0;
  }
  async getAdminByUsername(username) {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin || void 0;
  }
  async createAdmin(insertAdmin) {
    const [admin] = await db.insert(admins).values(insertAdmin).returning();
    return admin;
  }
  async createAdminResearch(research) {
    const [newResearch] = await db.insert(adminResearch).values(research).returning();
    return newResearch;
  }
  async getAdminResearch(id) {
    const [research] = await db.select().from(adminResearch).where(eq(adminResearch.id, id));
    return research || void 0;
  }
  async getAllAdminResearch(publishedOnly = false) {
    if (publishedOnly) {
      return await db.select().from(adminResearch).where(eq(adminResearch.published, true));
    }
    return await db.select().from(adminResearch);
  }
  async updateAdminResearch(id, updates) {
    const updateData = { updatedAt: /* @__PURE__ */ new Date() };
    if (updates.title !== void 0) updateData.title = updates.title;
    if (updates.description !== void 0) updateData.description = updates.description;
    if (updates.year !== void 0) updateData.year = updates.year;
    if (updates.authors !== void 0) updateData.authors = updates.authors;
    if (updates.institution !== void 0) updateData.institution = updates.institution;
    if (updates.osdStudyNumber !== void 0) updateData.osdStudyNumber = updates.osdStudyNumber;
    if (updates.tags !== void 0) updateData.tags = updates.tags;
    if (updates.nasaOsdrLinks !== void 0) updateData.nasaOsdrLinks = updates.nasaOsdrLinks;
    if (updates.customFields !== void 0) updateData.customFields = updates.customFields;
    if (updates.published !== void 0) updateData.published = updates.published;
    const [updatedResearch] = await db.update(adminResearch).set(updateData).where(eq(adminResearch.id, id)).returning();
    return updatedResearch;
  }
  async deleteAdminResearch(id) {
    await db.delete(adminResearch).where(eq(adminResearch.id, id));
  }
  async createResearchSuggestion(suggestion) {
    const [newSuggestion] = await db.insert(researchSuggestions).values(suggestion).returning();
    return newSuggestion;
  }
  async getAllResearchSuggestions() {
    return await db.select().from(researchSuggestions);
  }
  async deleteResearchSuggestion(id) {
    await db.delete(researchSuggestions).where(eq(researchSuggestions.id, id));
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt as scrypt2, randomBytes as randomBytes2, timingSafeEqual as timingSafeEqual2 } from "crypto";
import { promisify as promisify2 } from "util";
import { z as z2 } from "zod";
var scryptAsync2 = promisify2(scrypt2);
async function hashPassword2(password) {
  const salt = randomBytes2(16).toString("hex");
  const buf = await scryptAsync2(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords2(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync2(supplied, salt, 64);
  return timingSafeEqual2(hashedBuf, suppliedBuf);
}
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(
      {
        usernameField: "usernameOrEmail",
        passwordField: "password"
      },
      async (usernameOrEmail, password, done) => {
        try {
          let user = await storage.getUserByUsername(usernameOrEmail);
          if (!user) {
            user = await storage.getUserByEmail(usernameOrEmail);
          }
          if (!user || !await comparePasswords2(password, user.password)) {
            return done(null, false, { message: "Invalid credentials" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const registerSchema = insertUserSchema.extend({
        confirmPassword: z2.string()
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"]
      });
      const validatedData = registerSchema.parse(req.body);
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const hashedPassword = await hashPassword2(validatedData.password);
      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword
      });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path[0]
        });
      }
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err2) => {
        if (err2) return next(err2);
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}

// server/admin-auth.ts
import { scrypt as scrypt3, randomBytes as randomBytes3, timingSafeEqual as timingSafeEqual3 } from "crypto";
import { promisify as promisify3 } from "util";
var scryptAsync3 = promisify3(scrypt3);
async function hashPassword3(password) {
  const salt = randomBytes3(16).toString("hex");
  const buf = await scryptAsync3(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords3(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync3(supplied, salt, 64);
  return timingSafeEqual3(hashedBuf, suppliedBuf);
}
function requireAdminAuth(req, res, next) {
  if (!req.session?.adminId) {
    return res.status(401).json({ message: "Admin authentication required" });
  }
  next();
}
async function initializeDefaultAdmin() {
  try {
    const existingAdmin = await storage.getAdminByUsername("admin");
    if (!existingAdmin) {
      const hashedPassword = await hashPassword3("noone");
      await storage.createAdmin({
        username: "admin",
        password: hashedPassword
      });
      console.log("Default admin user created");
    }
  } catch (error) {
    console.error("Error initializing default admin:", error);
  }
}
function setupAdminAuth(app2) {
  app2.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      const admin = await storage.getAdminByUsername(username);
      if (!admin || !await comparePasswords3(password, admin.password)) {
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
  app2.post("/api/admin/logout", (req, res) => {
    req.session.adminId = void 0;
    res.sendStatus(200);
  });
  app2.get("/api/admin/user", requireAdminAuth, async (req, res) => {
    try {
      const admin = await storage.getAdmin(req.session.adminId);
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

// server/admin-routes.ts
import { z as z3 } from "zod";

// server/admin-gemini.ts
import { GoogleGenAI } from "@google/genai";

// server/nasa-osdr.ts
import fetch from "node-fetch";
var OSDR_BASE_URL = "https://osdr.nasa.gov/osdr/data/";
var OSDR_API_URL = "https://osdr.nasa.gov/geode-py/ws/api/";
var NASAOSDRService = class {
  statsCache = null;
  cacheTimeout = 6 * 60 * 60 * 1e3;
  studiesCache = null;
  studiesCacheTimeout = 24 * 60 * 60 * 1e3;
  isRefreshing = false;
  async searchStudies(searchTerm, limit = 20) {
    try {
      const url = `${OSDR_API_URL}study/search`;
      const params = new URLSearchParams({
        "term": searchTerm,
        "size": limit.toString()
      });
      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        console.warn(`OSDR API returned ${response.status}, trying fallback...`);
        return this.searchStudiesFallback(searchTerm, limit);
      }
      const data = await response.json();
      const results = this.transformSearchResults(data);
      if (results.length === 0) {
        console.warn("No results from primary API, trying fallback...");
        return this.searchStudiesFallback(searchTerm, limit);
      }
      return results;
    } catch (error) {
      console.error("Error fetching NASA OSDR data:", error);
      return this.searchStudiesFallback(searchTerm, limit);
    }
  }
  async searchStudiesFallback(searchTerm, limit) {
    try {
      const url = `${OSDR_API_URL}study`;
      const response = await fetch(url);
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      const allStudies = this.transformSearchResults(data);
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return allStudies.filter(
          (study) => study.title?.toLowerCase().includes(term) || study.abstract?.toLowerCase().includes(term) || study.tags?.some((tag) => tag.toLowerCase().includes(term))
        ).slice(0, limit);
      }
      return allStudies.slice(0, limit);
    } catch (error) {
      console.error("Fallback search also failed:", error);
      return [];
    }
  }
  async getStudiesByFilters(organism, assayType, limit = 20) {
    try {
      const url = `${OSDR_BASE_URL}search`;
      const params = new URLSearchParams({
        "from": "0",
        "size": limit.toString(),
        "type": "cgene"
      });
      if (organism) {
        params.append("ffield", "organism");
        params.append("fvalue", organism);
      }
      if (assayType) {
        params.append("ffield", "Study Assay Technology Type");
        params.append("fvalue", assayType);
      }
      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new Error(`OSDR API error: ${response.status}`);
      }
      const data = await response.json();
      return this.transformSearchResults(data);
    } catch (error) {
      console.error("Error fetching filtered NASA OSDR data:", error);
      throw error;
    }
  }
  async getStudyMetadata(studyId) {
    try {
      const numericId = studyId.replace(/\D/g, "");
      const url = `${OSDR_BASE_URL}osd/meta/${numericId}`;
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return this.transformSingleStudy(data, studyId);
    } catch (error) {
      console.error("Error fetching study metadata:", error);
      return null;
    }
  }
  async getStudiesByInterest(interest, limit = 10) {
    const searchTerms = {
      "plant-biology": ["plant", "arabidopsis", "lettuce", "tomato", "photosynthesis"],
      "human-health": ["human", "astronaut", "cardiovascular", "bone", "muscle"],
      "microgravity-effects": ["microgravity", "gravity", "weightlessness"],
      "radiation-studies": ["radiation", "cosmic", "DNA damage", "radioprotection"],
      "microbiology": ["microbe", "bacteria", "biofilm", "microbiome"],
      "genetics": ["gene", "genetic", "epigenetic", "transcriptome", "genome"]
    };
    const terms = searchTerms[interest] || [interest];
    const randomTerm = terms[Math.floor(Math.random() * terms.length)];
    try {
      return this.searchStudies(randomTerm, limit);
    } catch (error) {
      console.error("Error generating interest-based results:", error);
      try {
        return this.getRecentStudies(limit);
      } catch (recentError) {
        console.error("Fallback to recent studies also failed:", recentError);
        return [];
      }
    }
  }
  async searchStudiesAdvanced(filters) {
    try {
      const query = filters.query || "";
      let results = [];
      if (filters.organism && filters.organism.length > 0) {
        for (const organism of filters.organism.slice(0, 2)) {
          const organismResults = await this.getStudiesByFilters(organism, void 0, Math.ceil((filters.limit || 20) / 2));
          results.push(...organismResults);
        }
      }
      if (filters.assayType && filters.assayType.length > 0) {
        for (const assayType of filters.assayType.slice(0, 2)) {
          const assayResults = await this.getStudiesByFilters(void 0, assayType, Math.ceil((filters.limit || 20) / 2));
          results.push(...assayResults);
        }
      }
      if (results.length === 0 || !filters.organism && !filters.assayType) {
        if (query.trim()) {
          const generalResults = await this.searchStudies(query, filters.limit || 20);
          results.push(...generalResults);
        } else {
          const recentResults = await this.getRecentStudies(filters.limit || 20);
          results.push(...recentResults);
        }
      }
      const uniqueResults = results.filter(
        (study, index, self) => index === self.findIndex((s) => s.id === study.id)
      );
      return uniqueResults.slice(0, filters.limit || 20);
    } catch (error) {
      console.error("Error with advanced search, falling back to basic search:", error);
      return this.searchStudies(filters.query || "", filters.limit || 20);
    }
  }
  async getStudyMetadataV2(studyId) {
    return this.getStudyMetadata(studyId);
  }
  async getRecentStudies(limit = 15) {
    try {
      const recentTerms = ["ISS", "2024", "2025", "spaceflight", "microgravity"];
      const allResults = [];
      for (const term of recentTerms.slice(0, 3)) {
        try {
          const results = await this.searchStudies(term, Math.ceil(limit / 3));
          allResults.push(...results);
        } catch (error) {
          console.warn(`Error fetching recent studies for term "${term}":`, error);
        }
      }
      const uniqueResults = allResults.filter(
        (study, index, self) => index === self.findIndex((s) => s.id === study.id)
      );
      return uniqueResults.sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, limit);
    } catch (error) {
      console.error("Error fetching recent studies:", error);
      throw error;
    }
  }
  async getComprehensiveStudiesDatabase() {
    if (this.studiesCache && Date.now() - this.studiesCache.timestamp < this.studiesCacheTimeout) {
      console.log(`Returning cached studies database with ${this.studiesCache.studies.length} studies`);
      return this.studiesCache.studies;
    }
    if (!this.isRefreshing) {
      this.backgroundRefreshStudies();
    }
    if (this.studiesCache?.studies) {
      console.log("Returning existing cached data while background refresh is in progress");
      return this.studiesCache.studies;
    }
    const studies = await this.fetchRealStudiesWithPagination();
    this.studiesCache = {
      studies,
      timestamp: Date.now()
    };
    return studies;
  }
  backgroundRefreshStudies() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    console.log("Starting background refresh of NASA studies database...");
    this.fetchRealStudiesWithPagination().then((studies) => {
      this.studiesCache = {
        studies,
        timestamp: Date.now()
      };
      console.log(`Background refresh completed: cached ${studies.length} real studies`);
    }).catch((error) => {
      console.error("Background refresh failed:", error);
    }).finally(() => {
      this.isRefreshing = false;
    });
  }
  async fetchRealStudiesWithPagination() {
    try {
      console.log("Fetching 300+ real NASA OSDR studies with deterministic pagination...");
      const allStudies = [];
      const uniqueIds = /* @__PURE__ */ new Set();
      const TARGET_STUDY_COUNT = 100;
      const highYieldTerms = [
        "microgravity",
        "spaceflight",
        "ISS",
        "space",
        "NASA",
        "astronaut",
        "human",
        "mouse",
        "plant",
        "bacteria",
        "cell",
        "tissue",
        "gene",
        "protein",
        "RNA",
        "DNA",
        "metabolism",
        "immune",
        "cardiovascular",
        "bone",
        "muscle",
        "radiation",
        "growth",
        "development"
      ];
      const PAGE_SIZE = 50;
      const MAX_PAGES_PER_TERM = 10;
      const MAX_CONCURRENT = 3;
      const MAX_RETRIES = 3;
      const processTermsConcurrently = async (terms) => {
        const semaphore = new Array(MAX_CONCURRENT).fill(null);
        let termIndex = 0;
        const processNextTerm = async () => {
          while (termIndex < terms.length && uniqueIds.size < TARGET_STUDY_COUNT) {
            const currentTermIndex = termIndex++;
            const term = terms[currentTermIndex];
            console.log(`[${currentTermIndex}] Searching "${term}" - have ${uniqueIds.size} studies`);
            for (let page = 0; page < MAX_PAGES_PER_TERM && uniqueIds.size < TARGET_STUDY_COUNT; page++) {
              let retries = 0;
              let success = false;
              while (retries < MAX_RETRIES && !success) {
                try {
                  const results = await this.searchStudiesWithPagination(term, page * PAGE_SIZE, PAGE_SIZE);
                  if (results.length === 0) {
                    console.log(`[${currentTermIndex}] No more results for "${term}" on page ${page}`);
                    success = true;
                    break;
                  }
                  let newStudiesCount = 0;
                  for (const study of results) {
                    if (!uniqueIds.has(study.id)) {
                      uniqueIds.add(study.id);
                      allStudies.push(study);
                      newStudiesCount++;
                    }
                  }
                  console.log(`[${currentTermIndex}] Page ${page}: ${newStudiesCount} new (${results.length} fetched) - Total: ${uniqueIds.size}`);
                  success = true;
                  await new Promise((resolve) => setTimeout(resolve, 200));
                } catch (error) {
                  retries++;
                  console.warn(`[${currentTermIndex}] Retry ${retries}/${MAX_RETRIES} for page ${page} of "${term}":`, error);
                  if (retries < MAX_RETRIES) {
                    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 1e3));
                  } else {
                    console.error(`[${currentTermIndex}] Max retries exceeded for page ${page} of "${term}"`);
                    break;
                  }
                }
              }
            }
          }
        };
        await Promise.all(semaphore.map(() => processNextTerm()));
      };
      await processTermsConcurrently(highYieldTerms);
      console.log(`Fetched ${uniqueIds.size} unique studies from API`);
      const processedStudies = allStudies.filter((study) => {
        return study.title && study.abstract && study.title.length > 10 && study.abstract.length > 50 && (study.id.match(/OSD-\d+/) || study.id.match(/^\d+$/));
      }).filter((study) => {
        const realYear = study.year || this.extractYearFromDates(study.submissionDate, study.releaseDate);
        return realYear && realYear >= 2e3 && realYear <= (/* @__PURE__ */ new Date()).getFullYear();
      }).map((study) => ({
        ...study,
        year: study.year || this.extractYearFromDates(study.submissionDate, study.releaseDate)
      })).sort((a, b) => (b.year || 0) - (a.year || 0));
      console.log(`Final processed: ${processedStudies.length} authentic NASA studies`);
      if (processedStudies.length < TARGET_STUDY_COUNT) {
        console.warn(`Only ${processedStudies.length} real studies found, target was ${TARGET_STUDY_COUNT}. Using available data.`);
      }
      return processedStudies.length > 0 ? processedStudies : this.getMockStudies();
    } catch (error) {
      console.error("Error in deterministic studies fetch:", error);
      throw error;
    }
  }
  async searchStudiesWithPagination(searchTerm, from = 0, size = 100) {
    try {
      const url = `${OSDR_BASE_URL}search`;
      const params = new URLSearchParams({
        "term": searchTerm,
        "from": from.toString(),
        "size": size.toString(),
        "type": "cgene"
      });
      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new Error(`OSDR API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return this.transformSearchResults(data);
    } catch (error) {
      console.error(`Error fetching NASA OSDR data for "${searchTerm}" (from: ${from}, size: ${size}):`, error);
      throw error;
    }
  }
  inferCategoryFromTerm(term) {
    const categoryMap = {
      "plant": ["Plant Biology"],
      "arabidopsis": ["Plant Biology"],
      "human": ["Human Health"],
      "astronaut": ["Human Health"],
      "cardiovascular": ["Human Health"],
      "bone": ["Human Health"],
      "mouse": ["Rodent Research"],
      "bacteria": ["Microbiology"],
      "immune": ["Human Health", "Microbiology"],
      "radiation": ["Radiation Biology"],
      "neuroscience": ["Neuroscience"],
      "microgravity": ["Human Health", "Plant Biology", "Cell Biology"],
      "spaceflight": ["Human Health", "Plant Biology", "Microbiology"],
      "ISS": ["Human Health", "Plant Biology", "Microbiology", "Technology Demo"]
    };
    const lowerTerm = term.toLowerCase();
    for (const [key, categories] of Object.entries(categoryMap)) {
      if (lowerTerm.includes(key)) {
        return categories;
      }
    }
    return [];
  }
  extractYearFromDates(...dates) {
    for (const date of dates) {
      if (date) {
        const year = this.extractYear(date);
        if (year && year >= 2e3 && year <= (/* @__PURE__ */ new Date()).getFullYear() + 1) {
          return year;
        }
      }
    }
    return null;
  }
  async getStatistics() {
    if (this.statsCache && Date.now() - this.statsCache.timestamp < this.cacheTimeout) {
      return this.statsCache.data;
    }
    try {
      const allStudies = await this.getComprehensiveStudiesDatabase();
      const categoryStats = {};
      const yearlyTrends = {};
      const categories = [
        "Plant Biology",
        "Human Health",
        "Microbiology",
        "Rodent Research",
        "Cell Biology",
        "Radiation Biology",
        "Neuroscience",
        "Food Systems",
        "Technology Demo",
        "Genetics",
        "Tissue Biology",
        "Developmental Biology"
      ];
      categories.forEach((category) => {
        const categoryKey = category.toLowerCase().split(" ")[0];
        categoryStats[category] = allStudies.filter((study) => {
          return study.tags.some(
            (tag) => tag.toLowerCase().includes(categoryKey) || tag.toLowerCase().includes(category.toLowerCase())
          ) || study.title.toLowerCase().includes(categoryKey) || study.abstract.toLowerCase().includes(categoryKey);
        }).length;
      });
      const studyYears = allStudies.map((study) => study.year).filter((year) => year !== void 0);
      const minYear = studyYears.length > 0 ? Math.min(...studyYears, 2018) : 2018;
      const maxYear = studyYears.length > 0 ? Math.max(...studyYears, 2025) : 2025;
      for (let year = minYear; year <= maxYear; year++) {
        yearlyTrends[year.toString()] = allStudies.filter(
          (study) => study.year === year
        ).length;
      }
      const monthlyData = this.calculateMonthlyDistribution(allStudies);
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      const stats = {
        totalStudies: allStudies.length,
        categoryStats,
        yearlyTrends,
        recentStudiesCount: yearlyTrends[currentYear.toString()] || 0,
        monthlyData,
        researchTrends: yearlyTrends
      };
      this.statsCache = {
        data: stats,
        timestamp: Date.now()
      };
      return stats;
    } catch (error) {
      console.error("Error fetching OSDR statistics:", error);
      if (this.statsCache?.data) {
        console.log("Using last known good statistics cache due to error");
        return this.statsCache.data;
      }
      throw new Error("Cannot fetch real NASA statistics and no cached data available");
    }
  }
  calculateMonthlyDistribution(studies) {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    const monthlyDistribution = months.map((month, index) => {
      const monthlyStudies = studies.filter((study) => {
        const submitDate = study.submissionDate;
        const releaseDate = study.releaseDate;
        if (submitDate || releaseDate) {
          const dateStr = (submitDate || releaseDate || "").toLowerCase();
          const monthNumber = String(index + 1).padStart(2, "0");
          const monthAbbr = month.toLowerCase();
          return dateStr.includes(monthAbbr) || dateStr.includes(`-${monthNumber}-`) || dateStr.includes(`/${monthNumber}/`) || dateStr.includes(`${monthNumber}/`);
        }
        return false;
      }).length;
      return {
        month,
        studies: monthlyStudies,
        papers: monthlyStudies
      };
    });
    return monthlyDistribution;
  }
  transformSearchResults(data) {
    const studies = [];
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
  transformV2SearchResults(data) {
    const studies = [];
    if (data?.data && Array.isArray(data.data)) {
      for (const item of data.data) {
        const study = this.transformV2DataItem(item);
        if (study) {
          studies.push(study);
        }
      }
    }
    return studies;
  }
  transformV2MetadataResult(data, studyId) {
    try {
      if (!data) return null;
      const metadata = data.data || data;
      return this.transformV2DataItem(metadata, studyId);
    } catch (error) {
      console.error("Error transforming v2 metadata:", error);
      return null;
    }
  }
  transformV2DataItem(item, studyId) {
    try {
      const accession = item["id.accession"] || item.accession || studyId || `OSD-${Date.now()}`;
      const title = item["study.title"] || item.title || `Space Biology Study ${accession}`;
      const description = item["study.description"] || item.description || "Space biology research study investigating biological processes in space environments.";
      const organism = item["study.characteristics.organism"] || item.organism;
      const assayType = item["Study Assay Technology Type"] || item.assayType;
      const tissueType = item["study.characteristics.tissue"] || item.tissue;
      const mission = item["study.factor value.spaceflight"] || item["flight_mission"];
      const dataType = item["file.data type"] || item.dataType;
      const submitDate = item["study.submit date"] || item.submit_date;
      const releaseDate = item["study.public release date"] || item.public_release_date;
      const year = this.extractYear(releaseDate || submitDate);
      const contact = item["study.contact.name"] || item.study_contact_name;
      const organization = item["study.contact.organization"] || item.study_contact_organization || "NASA";
      const authors = this.extractAuthors(contact);
      const tags = this.extractV2Tags(item);
      const study = {
        id: accession,
        title,
        abstract: description,
        authors,
        institution: organization,
        tags,
        url: `https://osdr.nasa.gov/bio/repo/data/studies/${accession}`,
        organism,
        assayType,
        missionName: mission,
        tissueType,
        dataType,
        submissionDate: submitDate,
        releaseDate,
        factorValue: item["study.factor value.factor value"],
        spaceflightMission: mission,
        hardware: item["study.hardware"] || item.hardware
      };
      if (year) {
        study.year = year;
      }
      return study;
    } catch (error) {
      console.error("Error transforming v2 data item:", error);
      return null;
    }
  }
  extractV2Tags(item) {
    const tags = [];
    if (item["study.characteristics.organism"]) tags.push(item["study.characteristics.organism"]);
    if (item["Study Assay Technology Type"]) tags.push(item["Study Assay Technology Type"]);
    if (item["study.factor value.spaceflight"]) tags.push(item["study.factor value.spaceflight"]);
    if (item["study.characteristics.tissue"]) tags.push(item["study.characteristics.tissue"]);
    if (item["file.data type"]) tags.push(item["file.data type"]);
    if (item["study.hardware"]) tags.push(item["study.hardware"]);
    tags.push("Space Biology", "NASA Research");
    return Array.from(new Set(tags.filter((tag) => tag && tag.trim())));
  }
  transformSingleStudyFromSearch(source, id) {
    try {
      const title = source.title || source.study_title;
      const description = source.description || source.study_description;
      const year = this.extractYear(source.public_release_date || source.submit_date);
      if (!title || !description || title.length < 10 || description.length < 50) {
        return null;
      }
      const authors = this.extractAuthors(source.study_contact_name || source.authors);
      const institution = source.study_contact_organization || "NASA";
      const tags = this.extractTags(source);
      const studyId = source.accession || `OSD-${id}`;
      const study = {
        id: studyId,
        title,
        abstract: description,
        authors,
        institution,
        tags,
        url: `https://osdr.nasa.gov/bio/repo/data/studies/${studyId}`,
        organism: source.organism || source.experiment_organism,
        assayType: source.study_assay_technology_type,
        missionName: source.flight_mission,
        tissueType: source.tissue,
        dataType: source.data_type,
        submissionDate: source.submit_date,
        releaseDate: source.public_release_date,
        factorValue: source.factor_value,
        spaceflightMission: source.flight_mission,
        hardware: source.hardware
      };
      if (year) {
        study.year = year;
      }
      return study;
    } catch (error) {
      console.error("Error transforming study:", error);
      return null;
    }
  }
  transformSingleStudy(data, id) {
    const title = data.title;
    const description = data.description;
    if (!title || !description || title.length < 10 || description.length < 50) {
      return null;
    }
    const year = data.year || this.extractYear(data.public_release_date);
    const study = {
      id: data.accession || id,
      title,
      abstract: description,
      authors: data.authors || [data.study_contact_name || "NASA Researcher"],
      institution: data.study_contact_organization || "NASA",
      tags: this.extractTagsFromMetadata(data),
      url: `https://osdr.nasa.gov/bio/repo/data/studies/${data.accession || id}`,
      organism: data.organism,
      assayType: data.study_assay_technology_type,
      missionName: data.flight_mission,
      tissueType: data.tissue
    };
    if (year) {
      study.year = year;
    }
    return study;
  }
  extractYear(dateString) {
    if (!dateString) return null;
    const match = dateString.match(/(\d{4})/);
    return match ? parseInt(match[1]) : null;
  }
  extractAuthors(authorsData) {
    if (Array.isArray(authorsData)) {
      return authorsData.slice(0, 4);
    }
    if (typeof authorsData === "string") {
      return authorsData.split(",").map((name) => name.trim()).slice(0, 4);
    }
    return ["NASA Researcher"];
  }
  extractTags(source) {
    const tags = [];
    if (source.organism) tags.push(source.organism);
    if (source.study_assay_technology_type) tags.push(source.study_assay_technology_type);
    if (source.flight_mission) tags.push(source.flight_mission);
    if (source.tissue) tags.push(source.tissue);
    tags.push("Space Biology", "NASA Research");
    return Array.from(new Set(tags));
  }
  extractTagsFromMetadata(data) {
    const tags = [];
    if (data.organism) tags.push(data.organism);
    if (data.study_assay_technology_type) tags.push(data.study_assay_technology_type);
    if (data.flight_mission) tags.push(data.flight_mission);
    if (data.tissue) tags.push(data.tissue);
    if (data.experiment_platform) tags.push(data.experiment_platform);
    tags.push("Space Biology", "NASA Research");
    return Array.from(new Set(tags));
  }
  getMockStudies() {
    console.warn("Using mock NASA studies as fallback");
    return [
      {
        id: "OSD-1",
        title: "Microgravity Effects on Plant Growth - ISS Expedition",
        abstract: "Study of plant growth and development in microgravity conditions aboard the International Space Station.",
        authors: ["NASA Research Team"],
        institution: "NASA",
        tags: ["Plant Biology", "Microgravity", "ISS"],
        url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-1",
        year: 2024
      }
    ];
  }
};
var nasaOSDRService = new NASAOSDRService();

// server/admin-gemini.ts
var ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
function generateAdminSystemPrompt(context) {
  const baseIdentity = `You are an advanced AI assistant specifically designed to help administrators manage and curate space biology research content. You have deep expertise in NASA OSDR research and can help with content creation, research analysis, and data curation.`;
  const capabilities = `
CORE CAPABILITIES:
\u2022 Research Content Analysis: Analyze and summarize space biology research papers
\u2022 Content Curation: Help create compelling titles, descriptions, and tags for research entries
\u2022 NASA OSDR Integration: Provide relevant NASA OSDR links and research connections
\u2022 Research Recommendations: Suggest related studies and research pathways
\u2022 Quality Assurance: Review research entries for completeness and accuracy
\u2022 Search Optimization: Recommend effective tags and keywords for discoverability
\u2022 Data Validation: Help verify research data and sources

ADMIN-SPECIFIC FEATURES:
\u2022 Suggest appropriate NASA OSDR links for research topics
\u2022 Generate comprehensive research descriptions
\u2022 Recommend relevant tags based on research content
\u2022 Identify gaps in research coverage
\u2022 Suggest custom fields for specialized research data
\u2022 Help organize and categorize research entries
\u2022 Provide insights on research trends and popular topics`;
  let contextInfo = "";
  if (context.currentResearch) {
    contextInfo = `

CURRENT RESEARCH CONTEXT:
Title: ${context.currentResearch.title}
Description: ${context.currentResearch.description}
Tags: ${context.currentResearch.tags?.join(", ") || "None"}`;
  }
  if (context.allResearch && context.allResearch.length > 0) {
    contextInfo += `

TOTAL RESEARCH ENTRIES: ${context.allResearch.length}`;
  }
  return `${baseIdentity}

${capabilities}${contextInfo}

You should provide practical, actionable assistance to help administrators create high-quality research entries. When suggesting content, be specific and reference actual NASA OSDR research when relevant. Format your responses clearly and professionally.`;
}
async function generateAdminAssistantResponse(message, context) {
  try {
    const systemPrompt = generateAdminSystemPrompt(context || {});
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{ text: message }]
      }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 2e3
      }
    });
    return response.text || "I'm here to help you manage research content. How can I assist you?";
  } catch (error) {
    console.error("Error generating admin assistant response:", error);
    return "I apologize, but I encountered an error. Please try again.";
  }
}

// server/admin-routes.ts
function setupAdminRoutes(app2) {
  app2.get("/api/admin/research", requireAdminAuth, async (req, res) => {
    try {
      const publishedOnly = req.query.publishedOnly === "true";
      const research = await storage.getAllAdminResearch(publishedOnly);
      res.json(research);
    } catch (error) {
      console.error("Error fetching admin research:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/admin/research/:id", requireAdminAuth, async (req, res) => {
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
  app2.post("/api/admin/research", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertAdminResearchSchema.parse({
        ...req.body,
        createdBy: req.session.adminId
      });
      const research = await storage.createAdminResearch(validatedData);
      res.status(201).json(research);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path[0]
        });
      }
      console.error("Error creating admin research:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/admin/research/:id", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = updateAdminResearchSchema.parse(req.body);
      const research = await storage.updateAdminResearch(req.params.id, validatedData);
      res.json(research);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path[0]
        });
      }
      console.error("Error updating admin research:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/admin/research/:id", requireAdminAuth, async (req, res) => {
    try {
      await storage.deleteAdminResearch(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting admin research:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/admin/assistant", requireAdminAuth, async (req, res) => {
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
  app2.get("/api/admin/suggestions", requireAdminAuth, async (req, res) => {
    try {
      const suggestions = await storage.getAllResearchSuggestions();
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/admin/suggestions/:id", requireAdminAuth, async (req, res) => {
    try {
      await storage.deleteResearchSuggestion(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting suggestion:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

// server/gemini.ts
import { GoogleGenAI as GoogleGenAI2 } from "@google/genai";
var ai2 = new GoogleGenAI2({ apiKey: process.env.GEMINI_API_KEY || "" });
function generateAdvancedSystemPrompt(mode, context) {
  const baseIdentity = `You are Ria, an advanced NASA space biology research AI assistant with deep expertise in space life sciences, microgravity research, and astrobiology.`;
  const capabilities = `
CORE EXPERTISE:
\u2022 Space biology research methodologies and experimental design
\u2022 Microgravity effects on biological systems (cellular, molecular, physiological levels)
\u2022 Radiation biology and space environment impacts
\u2022 Plant biology in space environments and space agriculture
\u2022 Human health and performance in space (cardiovascular, musculoskeletal, neurological)
\u2022 Astrobiology and extremophile research
\u2022 Space life support systems and closed-loop ecosystems
\u2022 NASA OSDR database knowledge and research trends

ADVANCED CAPABILITIES:
\u2022 Real-time access to NASA OSDR research database
\u2022 Study comparison and analysis across multiple datasets
\u2022 Research pathway recommendations based on user interests
\u2022 Methodology critique and experimental design suggestions
\u2022 Data interpretation and statistical analysis guidance
\u2022 Citation and reference management for scientific accuracy`;
  let modeSpecificPrompt = "";
  switch (mode) {
    case "research_assistant" /* RESEARCH_ASSISTANT */:
      modeSpecificPrompt = `
MODE: Research Assistant
\u2022 Help users discover and understand relevant studies
\u2022 Provide research guidance and methodology advice
\u2022 Suggest new research directions and collaborations
\u2022 Explain complex concepts in accessible language`;
      break;
    case "study_analyzer" /* STUDY_ANALYZER */:
      modeSpecificPrompt = `
MODE: Study Analyzer
\u2022 Provide detailed analysis of research papers and datasets
\u2022 Compare methodologies across studies
\u2022 Identify strengths, limitations, and areas for improvement
\u2022 Suggest follow-up research questions`;
      break;
    case "data_explorer" /* DATA_EXPLORER */:
      modeSpecificPrompt = `
MODE: Data Explorer
\u2022 Help users navigate and query NASA OSDR datasets
\u2022 Perform real-time data searches and filtering
\u2022 Identify patterns and trends across research areas
\u2022 Generate data visualizations and insights`;
      break;
    case "methodology_expert" /* METHODOLOGY_EXPERT */:
      modeSpecificPrompt = `
MODE: Methodology Expert
\u2022 Provide expert guidance on experimental design
\u2022 Suggest appropriate controls and statistical approaches
\u2022 Help troubleshoot methodological challenges
\u2022 Recommend best practices for space biology research`;
      break;
  }
  const contextualInfo = buildContextualPrompt(context);
  return `${baseIdentity}

${capabilities}

${modeSpecificPrompt}

${contextualInfo}

INTERACTION GUIDELINES:
\u2022 Provide scientifically accurate, evidence-based responses
\u2022 Always cite relevant NASA studies and OSDR data when available
\u2022 Use clear, professional language appropriate for researchers
\u2022 Acknowledge limitations and suggest resources for further information
\u2022 Proactively suggest related studies, methodologies, or research areas
\u2022 Integrate user's research interests and context into recommendations
\u2022 Use proper scientific terminology while ensuring clarity`;
}
function buildContextualPrompt(context) {
  let contextPrompt = "\nCURRENT RESEARCH CONTEXT:\n";
  if (context.currentStudy) {
    contextPrompt += `\u2022 Currently viewing study: "${context.currentStudy.title}" (${context.currentStudy.id})
`;
    contextPrompt += `\u2022 Study focus: ${context.currentStudy.abstract?.substring(0, 200)}...
`;
  }
  if (context.userInterests && context.userInterests.length > 0) {
    contextPrompt += `\u2022 User research interests: ${context.userInterests.join(", ")}
`;
  }
  if (context.recentSearches && context.recentSearches.length > 0) {
    contextPrompt += `\u2022 Recent searches: ${context.recentSearches.slice(0, 3).join(", ")}
`;
  }
  if (context.currentPage) {
    contextPrompt += `\u2022 Current page: ${context.currentPage}
`;
  }
  if (context.favoriteStudies && context.favoriteStudies.length > 0) {
    contextPrompt += `\u2022 User has ${context.favoriteStudies.length} favorited studies in areas: ${context.favoriteStudies.map((s) => s.studyTitle).slice(0, 3).join(", ")}
`;
  }
  return contextPrompt;
}
function getTemperatureForMode(mode) {
  switch (mode) {
    case "research_assistant" /* RESEARCH_ASSISTANT */:
      return 0.7;
    case "study_analyzer" /* STUDY_ANALYZER */:
      return 0.5;
    case "data_explorer" /* DATA_EXPLORER */:
      return 0.6;
    case "methodology_expert" /* METHODOLOGY_EXPERT */:
      return 0.4;
    default:
      return 0.7;
  }
}
async function enhanceMessageWithNASAData(message, context) {
  const dataQueryPatterns = [
    /find studies about|search for studies|what studies|research on|papers about/i,
    /recent research|latest studies|new findings/i,
    /compare studies|similar research|related work/i,
    /data on|dataset|experimental data/i
  ];
  const isDataQuery = dataQueryPatterns.some((pattern) => pattern.test(message));
  if (isDataQuery) {
    try {
      const searchTerms = extractSearchTerms(message);
      if (searchTerms) {
        const relevantStudies = await nasaOSDRService.searchStudies(searchTerms, 5);
        if (relevantStudies.length > 0) {
          const studyContext = relevantStudies.map(
            (study) => `\u2022 ${study.title} (${study.id}): ${study.abstract?.substring(0, 150)}...`
          ).join("\n");
          return `${message}

RELEVANT NASA OSDR STUDIES:
${studyContext}`;
        }
      }
    } catch (error) {
      console.log("Could not fetch NASA data for enhancement:", error);
    }
  }
  return message;
}
function extractSearchTerms(message) {
  const terms = message.toLowerCase().replace(/find studies about|search for studies|what studies|research on|papers about|recent research|latest studies|new findings|data on/gi, "").replace(/[^\w\s]/g, " ").split(/\s+/).filter((term) => term.length > 2 && !["the", "and", "for", "with", "are", "have", "that", "this"].includes(term)).slice(0, 3).join(" ");
  return terms.trim() || null;
}
async function enhanceResponseWithCitations(response, context) {
  if (context.currentStudy) {
    const currentStudyRef = `

\u{1F4D6} **Current Study Reference:**
[${context.currentStudy.title}](${context.currentStudy.url})`;
    response += currentStudyRef;
  }
  if (context.userInterests && context.userInterests.length > 0) {
    try {
      const recommendations = await generatePersonalizedRecommendations(context.userInterests);
      if (recommendations.length > 0) {
        response += `

\u{1F3AF} **Personalized Study Recommendations:**
${recommendations.slice(0, 2).map((r) => `\u2022 [${r.title}](${r.url})`).join("\n")}`;
      }
    } catch (error) {
      console.log("Could not generate recommendations:", error);
    }
  }
  return response;
}
async function generatePersonalizedRecommendations(interests) {
  const recommendations = [];
  for (const interest of interests.slice(0, 2)) {
    try {
      const studies = await nasaOSDRService.getStudiesByInterest(interest);
      recommendations.push(...studies.slice(0, 1));
    } catch (error) {
      console.log(`Could not fetch recommendations for ${interest}:`, error);
    }
  }
  return recommendations;
}
async function generateChatResponse(userMessage, context = {}, chatHistory = [], mode = "research_assistant" /* RESEARCH_ASSISTANT */) {
  try {
    const systemPrompt = generateAdvancedSystemPrompt(mode, context);
    const conversationHistory = chatHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));
    const enhancedMessage = await enhanceMessageWithNASAData(userMessage, context);
    const response = await ai2.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: enhancedMessage }]
        }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: getTemperatureForMode(mode),
        maxOutputTokens: 1500
      }
    });
    let responseText = response.text || "I'm sorry, I couldn't generate a response. Please try again.";
    responseText = await enhanceResponseWithCitations(responseText, context);
    return responseText;
  } catch (error) {
    console.error("Error generating chat response:", error);
    return "I'm experiencing technical difficulties. Please try again later.";
  }
}
async function summarizeStudy(studyText) {
  try {
    const prompt = `As an advanced space biology research AI, provide a comprehensive yet concise summary of this NASA research study. Structure your response with:

1. **Research Objective**: What was the primary goal?
2. **Methodology**: How was the study conducted?
3. **Key Findings**: What were the main discoveries?
4. **Implications**: Why is this important for space biology/missions?
5. **Future Directions**: What research should follow?

Study to analyze:
${studyText}

Keep each section to 1-2 sentences for clarity.`;
    const response = await ai2.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.5,
        maxOutputTokens: 800
      }
    });
    return response.text || "Unable to generate summary.";
  } catch (error) {
    console.error("Error summarizing study:", error);
    return "Summary unavailable.";
  }
}
async function generateSearchSuggestions(query) {
  try {
    const prompt = `As a NASA space biology research expert, suggest 5 highly relevant search terms for the query "${query}". Focus on:
- Specific research methodologies
- Related biological systems or processes  
- Space-specific conditions (microgravity, radiation, etc.)
- Model organisms commonly used
- Complementary research areas

Return only the search terms, one per line, without numbers or bullets.`;
    const response = await ai2.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.6,
        maxOutputTokens: 200
      }
    });
    const suggestions = response.text?.split("\n").filter((s) => s.trim()).slice(0, 5) || [];
    return suggestions;
  } catch (error) {
    console.error("Error generating search suggestions:", error);
    return [];
  }
}
async function analyzeStudyComparison(studies) {
  try {
    const studyData = studies.map(
      (study) => `Title: ${study.title}
Abstract: ${study.abstract?.substring(0, 300)}...
Methodology: ${study.assayType || "Not specified"}`
    ).join("\n\n---\n\n");
    const prompt = `As a space biology methodology expert, compare these NASA studies and provide:

1. **Common Themes**: What research areas do they share?
2. **Methodological Differences**: How do their approaches differ?
3. **Complementary Insights**: How do their findings complement each other?
4. **Research Gaps**: What areas need further investigation?
5. **Synthesis**: What broader conclusions can be drawn?

Studies to compare:
${studyData}`;
    const response = await ai2.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.6,
        maxOutputTokens: 1200
      }
    });
    return response.text || "Unable to generate comparison analysis.";
  } catch (error) {
    console.error("Error analyzing study comparison:", error);
    return "Analysis unavailable.";
  }
}
async function generateResearchPathway(interests, currentKnowledge) {
  try {
    const prompt = `As a NASA space biology research strategist, create a personalized research learning pathway for someone interested in: ${interests.join(", ")}.

Current knowledge level: ${currentKnowledge}

Provide:
1. **Foundation Studies**: 3-4 essential papers to start with
2. **Progressive Learning**: Next level topics to explore
3. **Advanced Research**: Cutting-edge areas to eventually pursue
4. **Practical Experience**: Suggested methodologies to learn
5. **Career Development**: How this knowledge applies to space biology careers

Structure as a clear, actionable learning plan.`;
    const response = await ai2.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1e3
      }
    });
    return response.text || "Unable to generate research pathway.";
  } catch (error) {
    console.error("Error generating research pathway:", error);
    return "Pathway unavailable.";
  }
}

// server/routes.ts
import { z as z4 } from "zod";
var advancedFiltersSchema = z4.object({
  yearRange: z4.string().optional().default("All Years"),
  organism: z4.array(z4.string()).optional().default([]),
  experimentType: z4.array(z4.string()).optional().default([]),
  mission: z4.array(z4.string()).optional().default([]),
  tissueType: z4.array(z4.string()).optional().default([]),
  researchArea: z4.array(z4.string()).optional().default([]),
  publicationStatus: z4.string().optional().default("All Status"),
  customDateRange: z4.object({
    start: z4.string().optional().default(""),
    end: z4.string().optional().default("")
  }).optional().default({ start: "", end: "" }),
  keywords: z4.array(z4.string()).optional().default([]),
  osdStudyNumber: z4.string().optional().default("")
});
var sortOptionsSchema = z4.object({
  sortBy: z4.enum(["relevance", "date", "title", "author", "citations"]).optional().default("relevance"),
  sortOrder: z4.enum(["asc", "desc"]).optional().default("desc"),
  secondarySort: z4.enum(["relevance", "date", "title", "author", "citations"]).optional()
});
var searchRequestSchema = z4.object({
  query: z4.string().optional().default(""),
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
  interests: z4.array(z4.string()).optional()
});
function isAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}
function transformAdminResearchToStudyFormat(research) {
  const authorsArray = research.authors ? research.authors.split(",").map((a) => a.trim()).filter(Boolean) : ["BioGalactic Admin"];
  const validUrl = research.nasaOsdrLinks && research.nasaOsdrLinks.length > 0 ? research.nasaOsdrLinks[0] : `https://osdr.nasa.gov/bio/repo/search?q=${encodeURIComponent(research.title)}`;
  return {
    id: `admin-${research.id}`,
    title: research.title,
    abstract: research.description,
    authors: authorsArray,
    institution: research.institution || "BioGalactic Research",
    tags: research.tags || [],
    url: validUrl,
    year: research.year ? parseInt(research.year) : new Date(research.createdAt).getFullYear(),
    isAdminCreated: true,
    customFields: research.customFields,
    nasaOsdrLinks: research.nasaOsdrLinks || [],
    osdStudyNumber: research.osdStudyNumber || null,
    published: research.published || false
  };
}
function searchInCustomFields(customFields, searchTerm) {
  if (!customFields || typeof customFields !== "object") {
    return false;
  }
  const searchLower = searchTerm.toLowerCase();
  for (const value of Object.values(customFields)) {
    if (typeof value === "string" && value.toLowerCase().includes(searchLower)) {
      return true;
    } else if (Array.isArray(value)) {
      if (value.some(
        (item) => typeof item === "string" && item.toLowerCase().includes(searchLower)
      )) {
        return true;
      }
    }
  }
  return false;
}
async function generateInterestBasedResults(interests) {
  try {
    const allResults = [];
    for (const interest of interests) {
      const studies = await nasaOSDRService.getStudiesByInterest(interest, 5);
      allResults.push(...studies);
    }
    if (allResults.length === 0) {
      const recentStudies = await nasaOSDRService.getRecentStudies(10);
      allResults.push(...recentStudies);
    }
    const adminResearch2 = await storage.getAllAdminResearch(true);
    const filteredAdminResearch = adminResearch2.filter((research) => {
      if (!research.tags || !Array.isArray(research.tags) || research.tags.length === 0) {
        return false;
      }
      return research.tags.some(
        (tag) => interests.some(
          (interest) => tag.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(tag.toLowerCase())
        )
      );
    });
    const transformedAdminResearch = filteredAdminResearch.map(transformAdminResearchToStudyFormat);
    allResults.push(...transformedAdminResearch);
    const uniqueResults = allResults.filter(
      (study, index, self) => index === self.findIndex((s) => s.id === study.id)
    );
    return uniqueResults.slice(0, 20);
  } catch (error) {
    console.error("Error generating interest-based results:", error);
    try {
      return await nasaOSDRService.getRecentStudies(10);
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      return [];
    }
  }
}
async function registerRoutes(app2) {
  setupAuth(app2);
  setupAdminAuth(app2);
  setupAdminRoutes(app2);
  await initializeDefaultAdmin();
  app2.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const validatedData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.user.id, validatedData);
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Profile update error:", error);
      if (error instanceof z4.ZodError) {
        return res.status(400).json({
          message: "Invalid profile data",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app2.put("/api/user/password", requireAuth, async (req, res) => {
    try {
      const validatedData = updatePasswordSchema.parse(req.body);
      const { currentPassword, newPassword } = validatedData;
      await storage.updateUserPassword(req.user.id, currentPassword, newPassword);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update error:", error);
      if (error instanceof z4.ZodError) {
        return res.status(400).json({
          message: "Invalid password data",
          errors: error.errors
        });
      }
      if (error instanceof Error) {
        if (error.message === "Current password is incorrect") {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ message: "User not found" });
        }
      }
      res.status(500).json({ message: "Failed to update password" });
    }
  });
  app2.put("/api/user/username", requireAuth, async (req, res) => {
    try {
      const validatedData = updateUsernameSchema.parse(req.body);
      const { username: newUsername, password } = validatedData;
      const updatedUser = await storage.updateUserUsername(req.user.id, newUsername, password);
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ message: "Username updated successfully", user: userWithoutPassword });
    } catch (error) {
      console.error("Username update error:", error);
      if (error instanceof z4.ZodError) {
        return res.status(400).json({
          message: "Invalid username data",
          errors: error.errors
        });
      }
      if (error instanceof Error) {
        if (error.message === "Password is incorrect") {
          return res.status(400).json({ message: "Password is incorrect" });
        }
        if (error.message === "Username is already taken") {
          return res.status(409).json({ message: "Username is already taken" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ message: "User not found" });
        }
      }
      res.status(500).json({ message: "Failed to update username" });
    }
  });
  app2.get("/api/study/:studyId/metadata", requireAuth, async (req, res) => {
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
      console.error("Error fetching study metadata:", error);
      res.status(500).json({ message: "Failed to fetch study metadata" });
    }
  });
  app2.post("/api/search", requireAuth, async (req, res) => {
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
          totalCount: interestBasedResults.length
        });
      }
      const searchFilters = {
        query: query && query.trim() ? query.trim() : void 0,
        organism: filters.organism && filters.organism.length > 0 ? filters.organism : void 0,
        assayType: filters.experimentType && filters.experimentType.length > 0 ? filters.experimentType : void 0,
        mission: filters.mission && filters.mission.length > 0 ? filters.mission : void 0,
        tissueType: filters.tissueType && filters.tissueType.length > 0 ? filters.tissueType : void 0,
        yearRange: void 0,
        dataType: void 0,
        limit: 30
      };
      let osdrResults = [];
      try {
        if (searchFilters.organism || searchFilters.assayType || searchFilters.mission || searchFilters.tissueType) {
          osdrResults = await nasaOSDRService.searchStudiesAdvanced(searchFilters);
        } else if (query && query.trim()) {
          osdrResults = await nasaOSDRService.searchStudies(query.trim(), 30);
        } else {
          osdrResults = await nasaOSDRService.getRecentStudies(30);
        }
      } catch (nasaError) {
        console.error("NASA OSDR API error, continuing with admin research only:", nasaError);
        osdrResults = [];
      }
      const adminResearch2 = await storage.getAllAdminResearch(false);
      const transformedAdminResearch = adminResearch2.map(transformAdminResearchToStudyFormat);
      const allResults = [...osdrResults, ...transformedAdminResearch];
      let filteredResults = allResults;
      if (filters.yearRange && filters.yearRange !== "All Years") {
        if (filters.yearRange === "2020-2024") {
          filteredResults = filteredResults.filter(
            (study) => study.year >= 2020 && study.year <= 2024
          );
        } else if (filters.yearRange === "2015-2019") {
          filteredResults = filteredResults.filter(
            (study) => study.year >= 2015 && study.year <= 2019
          );
        } else if (filters.yearRange === "2010-2014") {
          filteredResults = filteredResults.filter(
            (study) => study.year >= 2010 && study.year <= 2014
          );
        } else if (filters.yearRange === "2005-2009") {
          filteredResults = filteredResults.filter(
            (study) => study.year >= 2005 && study.year <= 2009
          );
        } else if (filters.yearRange === "2000-2004") {
          filteredResults = filteredResults.filter(
            (study) => study.year >= 2e3 && study.year <= 2004
          );
        }
      }
      if (filters.customDateRange?.start || filters.customDateRange?.end) {
        const startYear = filters.customDateRange.start ? parseInt(filters.customDateRange.start.split("-")[0]) : 0;
        const endYear = filters.customDateRange.end ? parseInt(filters.customDateRange.end.split("-")[0]) : 9999;
        filteredResults = filteredResults.filter(
          (study) => study.year >= startYear && study.year <= endYear
        );
      }
      if (filters.organism && Array.isArray(filters.organism) && filters.organism.length > 0) {
        filteredResults = filteredResults.filter(
          (study) => filters.organism.some(
            (org) => study.organism?.toLowerCase().includes(org.toLowerCase()) || study.tags?.some((tag) => tag.toLowerCase().includes(org.toLowerCase())) || study.title?.toLowerCase().includes(org.toLowerCase()) || study.abstract?.toLowerCase().includes(org.toLowerCase()) || study.isAdminCreated && searchInCustomFields(study.customFields, org)
          )
        );
      }
      if (filters.experimentType && Array.isArray(filters.experimentType) && filters.experimentType.length > 0) {
        filteredResults = filteredResults.filter(
          (study) => filters.experimentType.some(
            (type) => study.assayType?.toLowerCase().includes(type.toLowerCase()) || study.tags?.some((tag) => tag.toLowerCase().includes(type.toLowerCase())) || study.title?.toLowerCase().includes(type.toLowerCase()) || study.abstract?.toLowerCase().includes(type.toLowerCase()) || study.isAdminCreated && searchInCustomFields(study.customFields, type)
          )
        );
      }
      if (filters.researchArea && Array.isArray(filters.researchArea) && filters.researchArea.length > 0) {
        filteredResults = filteredResults.filter(
          (study) => filters.researchArea.some(
            (area) => study.title?.toLowerCase().includes(area.toLowerCase()) || study.abstract?.toLowerCase().includes(area.toLowerCase()) || study.tags?.some((tag) => tag.toLowerCase().includes(area.toLowerCase())) || study.isAdminCreated && searchInCustomFields(study.customFields, area)
          )
        );
      }
      if (filters.mission && Array.isArray(filters.mission) && filters.mission.length > 0) {
        filteredResults = filteredResults.filter(
          (study) => filters.mission.some(
            (mission) => study.missionName?.toLowerCase().includes(mission.toLowerCase()) || study.title?.toLowerCase().includes(mission.toLowerCase()) || study.abstract?.toLowerCase().includes(mission.toLowerCase()) || study.isAdminCreated && searchInCustomFields(study.customFields, mission)
          )
        );
      }
      if (filters.tissueType && Array.isArray(filters.tissueType) && filters.tissueType.length > 0) {
        filteredResults = filteredResults.filter(
          (study) => filters.tissueType.some(
            (tissue) => study.tissueType?.toLowerCase().includes(tissue.toLowerCase()) || study.tags?.some((tag) => tag.toLowerCase().includes(tissue.toLowerCase())) || study.title?.toLowerCase().includes(tissue.toLowerCase()) || study.abstract?.toLowerCase().includes(tissue.toLowerCase()) || study.isAdminCreated && searchInCustomFields(study.customFields, tissue)
          )
        );
      }
      if (query && query.trim()) {
        const searchQuery = query.toLowerCase().trim();
        filteredResults = filteredResults.filter(
          (study) => study.title?.toLowerCase().includes(searchQuery) || study.abstract?.toLowerCase().includes(searchQuery) || study.tags?.some((tag) => tag.toLowerCase().includes(searchQuery)) || study.authors?.some((author) => author.toLowerCase().includes(searchQuery)) || study.institution?.toLowerCase().includes(searchQuery) || study.year?.toString().includes(searchQuery) || study.nasaOsdrLinks?.some((link) => link.toLowerCase().includes(searchQuery)) || study.isAdminCreated && searchInCustomFields(study.customFields, searchQuery)
        );
      }
      if (filters.keywords && Array.isArray(filters.keywords) && filters.keywords.length > 0) {
        filteredResults = filteredResults.filter(
          (study) => filters.keywords.some(
            (keyword) => study.title?.toLowerCase().includes(keyword.toLowerCase()) || study.abstract?.toLowerCase().includes(keyword.toLowerCase()) || study.tags?.some((tag) => tag.toLowerCase().includes(keyword.toLowerCase())) || study.authors?.some((author) => author.toLowerCase().includes(keyword.toLowerCase())) || study.institution?.toLowerCase().includes(keyword.toLowerCase()) || study.year?.toString().includes(keyword.toLowerCase()) || study.nasaOsdrLinks?.some((link) => link.toLowerCase().includes(keyword.toLowerCase())) || study.isAdminCreated && searchInCustomFields(study.customFields, keyword)
          )
        );
      }
      if (filters.osdStudyNumber && filters.osdStudyNumber.trim()) {
        const osdNumber = filters.osdStudyNumber.trim().toUpperCase();
        filteredResults = filteredResults.filter(
          (study) => study.osdStudyNumber?.toUpperCase().includes(osdNumber) || study.id?.toUpperCase().includes(osdNumber) || study.title?.toUpperCase().includes(osdNumber)
        );
      }
      if (filters.publicationStatus && filters.publicationStatus !== "All Status") {
        if (filters.publicationStatus === "Published") {
          filteredResults = filteredResults.filter(
            (study) => !study.isAdminCreated || study.isAdminCreated && study.published
          );
        } else if (filters.publicationStatus === "Unpublished") {
          filteredResults = filteredResults.filter(
            (study) => study.isAdminCreated && !study.published
          );
        }
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
      await storage.createSearch(req.user.id, query, filters, filteredResults);
      res.json({
        query,
        filters,
        results: filteredResults,
        totalCount: filteredResults.length
      });
    } catch (error) {
      console.error("Search error:", error);
      if (error instanceof z4.ZodError) {
        return res.status(400).json({
          message: "Invalid search parameters",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Search failed" });
    }
  });
  app2.get("/api/search/suggestions", isAuthenticated, async (req, res) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.json([]);
      }
      const suggestions = await generateSearchSuggestions(query);
      res.json(suggestions);
    } catch (error) {
      console.error("Suggestions error:", error);
      res.json([]);
    }
  });
  app2.post("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const { studyId, studyTitle, studyData } = req.body;
      const favorite = await storage.createFavorite(req.user.id, studyId, studyTitle, studyData);
      res.json(favorite);
    } catch (error) {
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });
  app2.get("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const favorites2 = await storage.getUserFavorites(req.user.id);
      res.json(favorites2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });
  app2.delete("/api/favorites/:studyId", isAuthenticated, async (req, res) => {
    try {
      await storage.removeFavorite(req.user.id, req.params.studyId);
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });
  app2.post("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const {
        message,
        context = {},
        mode = "research_assistant" /* RESEARCH_ASSISTANT */,
        currentStudy,
        currentPage
      } = req.body;
      const user = await storage.getUser(req.user.id);
      const favorites2 = await storage.getUserFavorites(req.user.id);
      const allSearches = await storage.getUserSearches(req.user.id);
      const recentSearches = allSearches.slice(0, 5);
      const enhancedContext = {
        currentStudy,
        userInterests: user?.interests || [],
        recentSearches: recentSearches.map((s) => s.query).filter(Boolean),
        currentPage,
        favoriteStudies: favorites2,
        researchGoals: [],
        ...context
      };
      let chatSession = await storage.getChatSession(req.user.id);
      const chatHistory = chatSession?.messages || [];
      const response = await generateChatResponse(message, enhancedContext, chatHistory, mode);
      const newMessages = [
        ...chatHistory,
        { role: "user", content: message, timestamp: (/* @__PURE__ */ new Date()).toISOString() },
        { role: "assistant", content: response, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
      ];
      chatSession = await storage.updateChatSession(req.user.id, newMessages);
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
  app2.get("/api/chat/history", isAuthenticated, async (req, res) => {
    try {
      const chatSession = await storage.getChatSession(req.user.id);
      res.json(chatSession?.messages || []);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });
  app2.post("/api/study/summarize", isAuthenticated, async (req, res) => {
    try {
      const { studyText } = req.body;
      const summary = await summarizeStudy(studyText);
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });
  app2.post("/api/studies/compare", isAuthenticated, async (req, res) => {
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
  app2.post("/api/research/pathway", isAuthenticated, async (req, res) => {
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
  app2.post("/api/search/advanced-suggestions", isAuthenticated, async (req, res) => {
    try {
      const { query, context = {} } = req.body;
      if (!query) {
        return res.json([]);
      }
      const user = await storage.getUser(req.user.id);
      const enhancedQuery = `${query} (User interests: ${user?.interests?.join(", ") || "general space biology"})`;
      const suggestions = await generateSearchSuggestions(enhancedQuery);
      res.json(suggestions);
    } catch (error) {
      console.error("Advanced suggestions error:", error);
      res.json([]);
    }
  });
  app2.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      let osdrStats;
      try {
        osdrStats = await nasaOSDRService.getStatistics();
      } catch (osdrError) {
        console.error("NASA OSDR statistics error, using empty stats:", osdrError);
        osdrStats = {
          totalStudies: 0,
          categoryStats: {},
          yearlyTrends: {},
          recentStudiesCount: 0,
          monthlyData: [],
          researchTrends: {}
        };
      }
      const adminResearch2 = await storage.getAllAdminResearch(true);
      const categoryStats = { ...osdrStats.categoryStats };
      adminResearch2.forEach((research) => {
        if (research.tags && Array.isArray(research.tags)) {
          research.tags.forEach((tag) => {
            if (!categoryStats[tag]) {
              categoryStats[tag] = 0;
            }
            categoryStats[tag]++;
          });
        }
      });
      const yearlyTrends = { ...osdrStats.yearlyTrends };
      adminResearch2.forEach((research) => {
        if (research.year) {
          if (!yearlyTrends[research.year]) {
            yearlyTrends[research.year] = 0;
          }
          yearlyTrends[research.year]++;
        }
      });
      const currentMonth = (/* @__PURE__ */ new Date()).getMonth();
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyData = [];
      for (let i = Math.max(0, currentMonth - 6); i <= currentMonth; i++) {
        const monthName = months[i];
        const osdrStudies = Math.floor((osdrStats.recentStudiesCount || 0) / 7);
        const adminMonthlyCount = adminResearch2.filter((research) => {
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
      const currentYearResearch = adminResearch2.filter((research) => {
        return research.year === currentYear.toString() || research.createdAt && new Date(research.createdAt).getFullYear() === currentYear;
      }).length;
      const publicationStatus = {
        published: adminResearch2.filter((r) => r.published).length,
        unpublished: adminResearch2.filter((r) => !r.published).length
      };
      const institutionStats = {};
      adminResearch2.forEach((research) => {
        if (research.institution) {
          if (!institutionStats[research.institution]) {
            institutionStats[research.institution] = 0;
          }
          institutionStats[research.institution]++;
        }
      });
      const topResearchAreas = Object.entries(categoryStats).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, value]) => ({ name, value }));
      const monthlyDataEnhanced = monthlyData.map((month) => {
        const adminCount = adminResearch2.filter((research) => {
          if (!research.createdAt) return false;
          const researchDate = new Date(research.createdAt);
          const monthIndex = months.indexOf(month.month);
          return researchDate.getMonth() === monthIndex && researchDate.getFullYear() === currentYear;
        }).length;
        const nasaCount = month.studies - adminCount;
        return {
          ...month,
          nasa: Math.max(0, nasaCount),
          admin: adminCount,
          total: month.studies
        };
      });
      res.json({
        totalPapers: osdrStats.totalStudies + adminResearch2.length,
        recentStudies: osdrStats.recentStudiesCount + currentYearResearch,
        activeProjects: Math.floor((osdrStats.totalStudies + adminResearch2.length) / 25),
        categoryStats,
        monthlyData: monthlyDataEnhanced,
        researchTrends: yearlyTrends,
        publicationStatus,
        institutionStats,
        topResearchAreas,
        adminResearchCount: adminResearch2.length,
        nasaResearchCount: osdrStats.totalStudies
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  app2.get("/api/filter-options", isAuthenticated, async (req, res) => {
    try {
      const adminResearch2 = await storage.getAllAdminResearch(true);
      const allTags = /* @__PURE__ */ new Set();
      const customFieldValues = /* @__PURE__ */ new Set();
      adminResearch2.forEach((research) => {
        if (research.tags && Array.isArray(research.tags)) {
          research.tags.forEach((tag) => allTags.add(tag));
        }
        if (research.customFields && typeof research.customFields === "object") {
          Object.values(research.customFields).forEach((value) => {
            if (typeof value === "string" && value.trim()) {
              customFieldValues.add(value.trim());
            } else if (Array.isArray(value)) {
              value.forEach((item) => {
                if (typeof item === "string" && item.trim()) {
                  customFieldValues.add(item.trim());
                }
              });
            }
          });
        }
      });
      const organismKeywords = ["human", "arabidopsis", "mouse", "rat", "drosophila", "elegans", "coli", "yeast", "cell culture", "mammalian", "plant", "microbial", "organism"];
      const missionKeywords = ["iss", "spacex", "artemis", "apollo", "shuttle", "skylab", "mir", "dragon", "crew", "mission", "spaceflight", "expedition"];
      const researchAreaKeywords = ["health", "biology", "microbiology", "radiation", "neuroscience", "bone", "food", "sleep", "cardiovascular", "culture", "genetics", "biotechnology", "medicine", "physiology"];
      const experimentTypeKeywords = ["rna-seq", "proteomics", "metabolomics", "imaging", "behavioral", "physiology", "transcriptomics", "genomics", "assay", "sequencing"];
      const tissueTypeKeywords = ["muscle", "bone", "blood", "tissue", "organ", "cell", "brain", "heart", "liver", "kidney"];
      const allSearchableValues = /* @__PURE__ */ new Set([...Array.from(allTags), ...Array.from(customFieldValues)]);
      const filterOptions = {
        organisms: Array.from(allSearchableValues).filter(
          (tag) => organismKeywords.some((keyword) => tag.toLowerCase().includes(keyword))
        ),
        missions: Array.from(allSearchableValues).filter(
          (tag) => missionKeywords.some((keyword) => tag.toLowerCase().includes(keyword))
        ),
        researchAreas: Array.from(allSearchableValues).filter(
          (tag) => researchAreaKeywords.some((keyword) => tag.toLowerCase().includes(keyword))
        ),
        experimentTypes: Array.from(allSearchableValues).filter(
          (tag) => experimentTypeKeywords.some((keyword) => tag.toLowerCase().includes(keyword))
        ),
        tissueTypes: Array.from(allSearchableValues).filter(
          (tag) => tissueTypeKeywords.some((keyword) => tag.toLowerCase().includes(keyword))
        ),
        allTags: Array.from(allTags)
      };
      res.json(filterOptions);
    } catch (error) {
      console.error("Filter options error:", error);
      res.status(500).json({ message: "Failed to fetch filter options" });
    }
  });
  app2.get("/api/research/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      if (id.startsWith("admin-")) {
        const actualId = id.replace("admin-", "");
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
  app2.post("/api/suggestions", isAuthenticated, async (req, res) => {
    try {
      const { researchId, type, message } = req.body;
      if (!researchId || !type || !message) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const suggestion = await storage.createResearchSuggestion({
        researchId,
        userId: req.user.id,
        type,
        message
      });
      res.json(suggestion);
    } catch (error) {
      console.error("Create suggestion error:", error);
      res.status(500).json({ message: "Failed to create suggestion" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use(
  session3({
    secret: process.env.SESSION_SECRET || "biolifespace-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1e3 * 60 * 60 * 24 * 7,
      // 7 days
      sameSite: "lax"
    }
  })
);
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
