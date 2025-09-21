# Overview

This is a web-based card battle game inspired by "Slay the Spire", built as a text-based implementation. The application allows players to engage in turn-based combat using cards with different effects, manage resources like health and energy, and progress through combat encounters. The game features a clean, modern UI with a terminal-inspired aesthetic using a dark theme with green accents.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client uses a modern React-based architecture with TypeScript:

- **React 18** with functional components and hooks for state management
- **Vite** as the build tool and development server for fast hot module replacement
- **Wouter** for lightweight client-side routing instead of React Router
- **TanStack Query** for server state management, caching, and API interactions
- **Tailwind CSS** for utility-first styling with custom CSS variables for theming
- **Shadcn/ui** component library built on Radix UI primitives for accessible, customizable components

The frontend follows a component-based architecture with clear separation of concerns:
- Game logic components in `client/src/components/game/`
- Reusable UI components from Shadcn/ui in `client/src/components/ui/`
- Pages and routing in `client/src/pages/`
- Shared utilities and configurations in `client/src/lib/`

## Backend Architecture

The server uses a lightweight Express.js setup:

- **Express.js** as the web framework with TypeScript support
- **ESM modules** for modern JavaScript module syntax
- **Memory-based storage** using a simple in-memory Map for game sessions (no persistent database)
- **RESTful API** design with endpoints for game creation, state retrieval, and game actions
- **Shared schema** between client and server using Zod for type validation

Game state management is handled entirely in memory, making the application stateless and suitable for development/demo purposes. The game logic includes:
- Turn-based combat system
- Card playing mechanics with energy costs
- Enemy AI with predetermined actions
- Player progression through different game phases

## Data Storage Solutions

The application uses a multi-layered approach to data management:

- **In-memory storage** for active game sessions using a TypeScript Map
- **Drizzle ORM** configured for PostgreSQL (though currently using memory storage)
- **Zod schemas** for runtime type validation and data integrity
- **React Query** for client-side caching and state synchronization

The storage abstraction allows for easy migration from memory storage to a persistent database when needed, with the infrastructure already in place for PostgreSQL integration.

## Authentication and Authorization

Currently, the application does not implement user authentication or authorization. Game sessions are identified by UUID and can be accessed by anyone with the session ID. This design choice keeps the implementation simple for demonstration purposes.

## UI/UX Design Patterns

The application follows a consistent design system:

- **Dark theme** with terminal/cyberpunk aesthetic using CSS custom properties
- **Responsive grid layouts** that adapt to different screen sizes
- **Component composition** using Radix UI primitives for accessibility
- **Consistent spacing and typography** through Tailwind's design system
- **Interactive feedback** with hover states, loading indicators, and toast notifications

# External Dependencies

## Core Framework Dependencies

- **@vitejs/plugin-react** - Vite plugin for React support with fast refresh
- **@tanstack/react-query** - Server state management and caching library
- **wouter** - Lightweight routing library for React applications
- **express** - Node.js web application framework

## UI and Styling

- **@radix-ui/*** - Collection of accessible, unstyled UI primitives (accordion, dialog, dropdown, etc.)
- **tailwindcss** - Utility-first CSS framework
- **class-variance-authority** - Tool for creating type-safe, variant-based component APIs
- **clsx** - Utility for constructing className strings conditionally

## Data Management and Validation

- **drizzle-orm** - TypeScript ORM for SQL databases
- **drizzle-kit** - CLI companion for Drizzle ORM
- **@neondatabase/serverless** - Serverless PostgreSQL driver for Neon
- **zod** - TypeScript-first schema validation library
- **drizzle-zod** - Integration between Drizzle ORM and Zod

## Development and Build Tools

- **vite** - Fast build tool and development server
- **typescript** - Static type checking for JavaScript
- **tsx** - TypeScript execution environment for Node.js
- **esbuild** - Fast JavaScript bundler for production builds

## Form and Input Handling

- **react-hook-form** - Performant forms library with minimal re-renders
- **@hookform/resolvers** - Validation resolvers for react-hook-form

## Date and Utility Libraries

- **date-fns** - Modern JavaScript date utility library
- **nanoid** - URL-safe unique string ID generator
- **cmdk** - Command palette component for React