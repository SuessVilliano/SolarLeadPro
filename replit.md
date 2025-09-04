# Overview

LIV8Solar is a solar energy consulting platform that connects homeowners with solar installation opportunities through the DOE's Project Hestia framework. The application features a modern React frontend with Express.js backend, designed to capture leads, calculate solar savings, and facilitate consultations for residential and commercial solar installations. The platform emphasizes $0 down installations and government funding opportunities, positioning itself as a pure consulting service that connects customers with vetted installation partners rather than manufacturing panels directly.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite for fast development and optimized production builds
- **Routing**: Wouter for client-side routing with simple path-based navigation
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: React Query (TanStack Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form processing
- **Styling**: Tailwind CSS with custom solar-themed color palette and responsive design

## Backend Architecture
- **Runtime**: Node.js with Express.js framework using TypeScript and ES modules
- **Database ORM**: Drizzle ORM configured for PostgreSQL with type-safe database operations
- **Schema Validation**: Zod schemas shared between frontend and backend for consistent data validation
- **Storage Strategy**: Dual storage approach with in-memory storage for development and PostgreSQL for production
- **API Design**: RESTful endpoints for lead management, solar calculations, and consultation scheduling

## Data Storage
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM Configuration**: Drizzle with automatic migrations and type generation
- **Schema Design**: Three main entities - leads, solar calculations, and consultations with proper foreign key relationships
- **Development Fallback**: In-memory storage implementation for environments without database access

## Lead Management System
- **Lead Capture**: Multi-step qualification forms with exit-intent modals and interactive calculators
- **Data Collection**: Contact information, property details, energy usage, and qualification criteria
- **Lead Tracking**: Status progression from initial contact through consultation and conversion
- **Admin Dashboard**: Real-time lead monitoring with detailed lead information and interaction history

## Interactive Features
- **Solar Calculator**: Dynamic savings calculations based on monthly bills, home size, and roof type
- **Qualification Modal**: Multi-step process to assess eligibility for Project Hestia funding
- **Exit Intent Detection**: Mouse leave detection to capture abandoning visitors with targeted offers
- **Responsive Design**: Mobile-first approach with optimized layouts for all device sizes

# External Dependencies

## Third-Party Services
- **Neon Database**: Serverless PostgreSQL hosting for production data storage
- **SendGrid**: Email service integration for lead notifications and follow-up communications
- **Push Lap API**: Affiliate tracking system for referral management and commission tracking
- **UtilityAPI**: Planned integration for secure utility bill upload and analysis
- **AnyChat**: Embedded chatbot widget for customer support and lead qualification

## Development Tools
- **Vite**: Build tool with hot module replacement and optimized production builds
- **Replit Integration**: Development environment plugins for live editing and deployment
- **ESBuild**: Fast JavaScript bundler for server-side code compilation
- **Drizzle Kit**: Database migration and schema management tooling

## UI and Styling
- **Radix UI**: Headless component library for accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography throughout the application
- **Google Fonts**: Inter and Poppins font families for professional typography

## Form and Validation
- **React Hook Form**: Performance-optimized form library with minimal re-renders
- **Zod**: Runtime type validation for both client and server-side data validation
- **Hookform Resolvers**: Integration layer between React Hook Form and Zod validation

## External Integrations
- **Social Media**: Facebook, Twitter, LinkedIn, and YouTube integration for marketing presence
- **Analytics**: Google Tag Manager support for tracking and conversion optimization
- **Maps**: Unsplash integration for high-quality solar installation imagery
- **Phone/Email**: Direct communication links for immediate customer contact