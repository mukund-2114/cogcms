# Overview

The Community of Guardians CMS & Task Platform is a multi-tenant project management and task tracking system built for the Community of Guardians community. It serves as a Jira alternative with SDG (Sustainable Development Goals) alignment, featuring role-based access control, gamification elements, and collaborative project management capabilities.

The platform enables community members to create projects, manage Kanban-style boards, track tasks, earn points and badges for contributions, and align their work with UN Sustainable Development Goals. It includes administrative features for user management, badge systems, and community oversight.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built with React 18 using TypeScript and follows a component-based architecture:

- **UI Framework**: React with Vite as the build tool and development server
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Replit Auth integration with session-based authentication

The frontend structure separates concerns into:
- `/pages` - Route components and page layouts
- `/components` - Reusable UI components organized by domain (layout, task, modals, gamification)
- `/hooks` - Custom React hooks for data fetching and state logic
- `/lib` - Utility functions, API client, and shared configurations

## Backend Architecture

The backend uses Express.js with TypeScript in an ESM module setup:

- **Framework**: Express.js server with middleware for logging, error handling, and authentication
- **Authentication**: Replit OpenID Connect (OIDC) integration with Passport.js strategy
- **Session Management**: Express sessions stored in PostgreSQL with connect-pg-simple
- **API Design**: RESTful endpoints organized by resource (projects, tasks, boards, users)

The server architecture includes:
- Route handlers in `/server/routes.ts` with authentication middleware
- Storage abstraction layer in `/server/storage.ts` for database operations
- Vite integration for development with HMR support

## Data Storage

The system uses PostgreSQL as the primary database with Drizzle ORM:

- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with type-safe queries and schema definitions
- **Schema**: Comprehensive schema supporting users, projects, boards, tasks, badges, and activity tracking
- **Migrations**: Drizzle Kit for schema migrations and database management

Key data models include:
- Users with role-based permissions (super_admin, admin, project_manager, member, guest)
- Projects with visibility controls and SDG tagging
- Kanban boards with customizable task statuses
- Tasks with types, priorities, assignments, and reward points
- Gamification system with badges and point tracking

## Authentication & Authorization

Multi-layered security approach:

- **Authentication**: Replit OIDC integration with JWT tokens
- **Session Management**: Secure HTTP-only cookies with PostgreSQL storage
- **Authorization**: Role-based access control (RBAC) with hierarchical permissions
- **Multi-tenancy**: Organization-level isolation with user role scoping

The system supports five user roles with escalating permissions:
- Guest: Read-only access to public projects
- Member: Create tasks, comment, basic project participation
- Project Manager: Create projects/boards, assign tasks, manage workflows
- Admin: User management, badge administration, content moderation
- Super Admin: Full system control, organization management

## External Dependencies

- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Authentication**: OpenID Connect provider for user authentication and SSO
- **Radix UI**: Headless UI components for accessible, customizable interfaces
- **Vercel**: Recommended deployment platform (inferred from build configuration)
- **External Fonts**: Google Fonts integration (Inter, DM Sans, Architect's Daughter)

The platform is designed to integrate with external services like GitHub and Slack through API tokens, with provisions for webhook-based activity tracking and notifications.