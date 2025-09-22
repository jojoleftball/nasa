# Overview

Biogalactic is a full-stack web application designed for exploring NASA's space biology research database with AI-powered insights. The application provides researchers and students with an intuitive platform to search, visualize, and interact with space biology data through a cosmic-themed interface. Key features include an AI chatbot assistant named "Ria" that helps interpret research data, advanced search and filtering capabilities for NASA datasets, data visualization tools, and user personalization through research interests.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
Built with React 18 and TypeScript using Vite as the build tool. The UI is constructed with shadcn/ui components built on top of Radix UI primitives, providing a consistent and accessible design system. The application uses Wouter for client-side routing, offering a lightweight alternative to React Router. State management is handled through TanStack Query (React Query) for server state and React hooks for local state. The design system implements a cosmic theme with dark purple/blue tones, galaxy gradients, and glass morphism effects using Tailwind CSS with custom CSS variables for theming.

## Backend Architecture
Express.js server with TypeScript providing RESTful API endpoints. Authentication is implemented using Passport.js with local strategy and session-based authentication. The server handles user management, research data search, AI chat interactions, and favorites management. Session storage uses PostgreSQL-backed sessions through connect-pg-simple for scalability and persistence.

## Data Storage
PostgreSQL database with Drizzle ORM for type-safe database interactions. The database schema includes users table with authentication and preferences, searches table for search history, favorites table for bookmarked research, and chat_sessions table for AI conversation persistence. Drizzle Kit handles database migrations and schema management. The application is configured to work with Neon Database as the PostgreSQL provider.

## Authentication & Authorization
Session-based authentication using Passport.js local strategy with bcryptjs for password hashing. Sessions are stored in PostgreSQL for persistence across server restarts. Protected routes ensure authenticated access to the main application features. User passwords are hashed using scrypt with salt for security.

## AI Integration
Google Gemini AI integration for the chatbot assistant "Ria" that provides space biology research assistance. The AI has context about NASA research and can explain complex concepts, suggest research areas, and help interpret scientific data. Chat history is persisted per user to maintain conversation context across sessions.

# External Dependencies

- **Database**: PostgreSQL via Neon Database (@neondatabase/serverless)
- **AI Service**: Google Gemini AI (@google/genai) for chatbot functionality
- **Authentication**: Passport.js for session-based auth with PostgreSQL session store
- **UI Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration for development and production
- **Styling**: Tailwind CSS with shadcn/ui component library built on Radix UI
- **State Management**: TanStack Query for server state management
- **Database ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualizations
- **Icons**: Lucide React for consistent iconography
- **Routing**: Wouter for lightweight client-side routing