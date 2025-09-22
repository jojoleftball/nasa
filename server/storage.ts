import { 
  users, 
  searches, 
  favorites, 
  chatSessions,
  type User, 
  type InsertUser, 
  type UpdateUser,
  type Search,
  type Favorite,
  type ChatSession
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: UpdateUser): Promise<User>;
  
  createSearch(userId: string, query: string, filters: any, results: any[]): Promise<Search>;
  getUserSearches(userId: string): Promise<Search[]>;
  
  createFavorite(userId: string, studyId: string, studyTitle: string, studyData: any): Promise<Favorite>;
  getUserFavorites(userId: string): Promise<Favorite[]>;
  removeFavorite(userId: string, studyId: string): Promise<void>;
  
  getChatSession(userId: string): Promise<ChatSession | undefined>;
  updateChatSession(userId: string, messages: any[]): Promise<ChatSession>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool: pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: UpdateUser): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        interests: updates.interests,
        chatbotName: updates.chatbotName,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createSearch(userId: string, query: string, filters: any, results: any[]): Promise<Search> {
    const [search] = await db
      .insert(searches)
      .values({ userId, query, filters, results })
      .returning();
    return search;
  }

  async getUserSearches(userId: string): Promise<Search[]> {
    return await db.select().from(searches).where(eq(searches.userId, userId));
  }

  async createFavorite(userId: string, studyId: string, studyTitle: string, studyData: any): Promise<Favorite> {
    const [favorite] = await db
      .insert(favorites)
      .values({ userId, studyId, studyTitle, studyData })
      .returning();
    return favorite;
  }

  async getUserFavorites(userId: string): Promise<Favorite[]> {
    return await db.select().from(favorites).where(eq(favorites.userId, userId));
  }

  async removeFavorite(userId: string, studyId: string): Promise<void> {
    await db.delete(favorites)
      .where(eq(favorites.userId, userId) && eq(favorites.studyId, studyId));
  }

  async getChatSession(userId: string): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.userId, userId));
    return session || undefined;
  }

  async updateChatSession(userId: string, messages: any[]): Promise<ChatSession> {
    const existingSession = await this.getChatSession(userId);
    
    if (existingSession) {
      const [session] = await db
        .update(chatSessions)
        .set({ messages, updatedAt: new Date() })
        .where(eq(chatSessions.userId, userId))
        .returning();
      return session;
    } else {
      const [session] = await db
        .insert(chatSessions)
        .values({ userId, messages })
        .returning();
      return session;
    }
  }
}

export const storage = new DatabaseStorage();
