import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
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
  interests: jsonb("interests").$type<string[]>().default([]),
  chatbotName: text("chatbot_name").default("Ria"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const searches = pgTable("searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  query: text("query").notNull(),
  filters: jsonb("filters").$type<{
    yearRange?: string;
    organism?: string;
    experimentType?: string;
  }>(),
  results: jsonb("results").$type<any[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  studyId: text("study_id").notNull(),
  studyTitle: text("study_title").notNull(),
  studyData: jsonb("study_data").$type<any>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  messages: jsonb("messages").$type<Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userInteractions = pgTable("user_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  studyId: text("study_id").notNull(),
  interactionType: text("interaction_type").notNull(), // 'view', 'favorite', 'download', 'chat_discuss'
  duration: text("duration"), // How long they viewed the study
  metadata: jsonb("metadata").$type<{
    searchQuery?: string;
    filters?: any;
    chatContext?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studyRecommendations = pgTable("study_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  studyId: text("study_id").notNull(),
  recommendationType: text("recommendation_type").notNull(), // 'interest_based', 'behavior_based', 'ai_suggested'
  score: text("score").notNull(), // Recommendation strength (0-1)
  reasoning: text("reasoning"), // Why this was recommended
  studyData: jsonb("study_data").$type<any>(),
  isViewed: boolean("is_viewed").default(false),
  isFavorited: boolean("is_favorited").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminResearch = pgTable("admin_research", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  nasaOsdrLinks: jsonb("nasa_osdr_links").$type<string[]>().default([]),
  customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}),
  published: boolean("published").default(false),
  createdBy: varchar("created_by").references(() => admins.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  displayName: true,
  profilePicture: true,
  coverImage: true,
  bio: true,
  interests: true,
  chatbotName: true,
}).partial();

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const updateUsernameSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters"),
  password: z.string().min(1, "Password is required for security")
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminResearchSchema = createInsertSchema(adminResearch).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAdminResearchSchema = createInsertSchema(adminResearch).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpdatePassword = z.infer<typeof updatePasswordSchema>;
export type UpdateUsername = z.infer<typeof updateUsernameSchema>;
export type User = typeof users.$inferSelect;
export type Search = typeof searches.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type AdminResearch = typeof adminResearch.$inferSelect;
export type InsertAdminResearch = z.infer<typeof insertAdminResearchSchema>;
export type UpdateAdminResearch = z.infer<typeof updateAdminResearchSchema>;
