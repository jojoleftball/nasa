import { 
  users, 
  searches, 
  favorites, 
  chatSessions,
  type User, 
  type InsertUser, 
  type UpdateUser,
  type UpdatePassword,
  type UpdateUsername,
  type Search,
  type Favorite,
  type ChatSession
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

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

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: UpdateUser): Promise<User>;
  updateUserPassword(id: string, currentPassword: string, newPassword: string): Promise<User>;
  updateUserUsername(id: string, newUsername: string, password: string): Promise<User>;
  
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
    const updateData: any = { updatedAt: new Date() };
    
    // Handle all profile fields
    if (updates.firstName !== undefined) {
      updateData.firstName = updates.firstName;
    }
    if (updates.lastName !== undefined) {
      updateData.lastName = updates.lastName;
    }
    if (updates.displayName !== undefined) {
      updateData.displayName = updates.displayName;
    }
    if (updates.profilePicture !== undefined) {
      updateData.profilePicture = updates.profilePicture;
    }
    if (updates.coverImage !== undefined) {
      updateData.coverImage = updates.coverImage;
    }
    if (updates.bio !== undefined) {
      updateData.bio = updates.bio;
    }
    if (updates.interests !== undefined) {
      updateData.interests = updates.interests;
    }
    if (updates.chatbotName !== undefined) {
      updateData.chatbotName = updates.chatbotName;
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: string, currentPassword: string, newPassword: string): Promise<User> {
    // First verify the current password
    const user = await this.getUser(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    const isCurrentPasswordValid = await comparePasswords(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash the new password using the same method as auth.ts
    const hashedNewPassword = await hashPassword(newPassword);
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        password: hashedNewPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async updateUserUsername(id: string, newUsername: string, password: string): Promise<User> {
    // First verify the password for security
    const user = await this.getUser(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Password is incorrect');
    }
    
    // Check if username is already taken
    const existingUser = await this.getUserByUsername(newUsername);
    if (existingUser && existingUser.id !== id) {
      throw new Error('Username is already taken');
    }
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        username: newUsername,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
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
      .where(and(eq(favorites.userId, userId), eq(favorites.studyId, studyId)));
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
