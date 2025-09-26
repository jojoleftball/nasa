import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  interests: true,
  chatbotName: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;
export type Search = typeof searches.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
