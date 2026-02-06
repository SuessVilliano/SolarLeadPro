# LIV8 Solar - Complete Application Specification

> Full rebuild reference for Base44 or any platform. Contains every feature, API integration, data model, page, component, and business logic.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Environment Variables](#3-environment-variables)
4. [Database Schema](#4-database-schema)
5. [API Endpoints](#5-api-endpoints)
6. [Authentication System](#6-authentication-system)
7. [External Integrations](#7-external-integrations)
8. [Frontend Pages & Components](#8-frontend-pages--components)
9. [Data Flow](#9-data-flow)
10. [Business Logic](#10-business-logic)
11. [UI/UX Design Spec](#11-uiux-design-spec)

---

## 1. Overview

LIV8 Solar is a solar energy consulting platform that:
- **Captures leads** via qualification forms, solar calculators, and consultation booking
- **Sends lead data** to OpenSolar (prospect creation), Google Sheets, TaskMagic, SendGrid email, and PushLap affiliate tracking
- **Provides dashboards** for admins (manage leads/users/analytics), solar reps (CRM/tasks/projects), and clients (project tracking)
- **Uses Google Solar API** for real roof data (panel count, sunshine hours, savings estimates)
- **Integrates with OpenSolar** for full solar project design, system details, pricing

### Brand
- **Name**: LIV8 Solar / LIV8Solar
- **Tagline**: "Smart Energy Consulting | Solar, Storage & Off-Grid Solutions"
- **Phone**: 813-441-9686
- **Email**: info@liv8solar.com
- **Domain**: www.liv8solar.com
- **Colors**: Teal primary (`hsl(174, 75%, 24%)`), turquoise accents, dark blue secondary
- **Fonts**: Inter (body), Poppins (headings)

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Routing | wouter (lightweight) |
| State/Data | TanStack React Query |
| UI Components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Backend | Express.js (Node.js) |
| Database | PostgreSQL (Neon serverless) via Drizzle ORM |
| Auth | JWT tokens (jsonwebtoken) |
| Email | SendGrid |
| Build | Vite (frontend) + esbuild (server) |

### For Base44 rebuild:
Replace the backend with Base44's built-in backend/database. The frontend components and business logic below are platform-agnostic.

---

## 3. Environment Variables

```
# Required for OpenSolar integration
OPENSOLAR_USERNAME=your_opensolar_email
OPENSOLAR_PASSWORD=your_opensolar_password
OPENSOLAR_ORG_ID=your_org_id

# Required for Google Solar API (real roof data)
GOOGLE_SOLAR_API_KEY=your_google_api_key
# OR
GOOGLE_API_KEY=your_google_api_key

# Optional integrations
SENDGRID_API_KEY=your_sendgrid_key
PUSHLAP_API_KEY=your_pushlap_key
GOOGLE_SHEETS_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...
JWT_SECRET=a_random_secret_string
DATABASE_URL=postgresql://...
```

---

## 4. Database Schema

### 4.1 Leads Table
The core table. Every form submission creates a lead.

```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  monthly_bill DECIMAL,
  home_size INTEGER,
  roof_type TEXT,
  energy_goals TEXT,
  lead_source TEXT DEFAULT 'website',  -- 'qualification', 'calculator', 'consultation', 'website'
  status TEXT DEFAULT 'new',           -- 'new', 'contacted', 'qualified', 'converted'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 Solar Calculations Table
Stores calculator results linked to leads.

```sql
CREATE TABLE solar_calculations (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  monthly_bill DECIMAL NOT NULL,
  home_size INTEGER NOT NULL,
  roof_type TEXT NOT NULL,
  monthly_savings DECIMAL,
  year_one_savings DECIMAL,
  twenty_year_savings DECIMAL,
  system_size TEXT,              -- e.g. "8.5kW"
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.3 Consultations Table
Tracks consultation bookings.

```sql
CREATE TABLE consultations (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  scheduled_date TIMESTAMP,
  status TEXT DEFAULT 'scheduled',  -- 'scheduled', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.4 Users Table
Dashboard access for admins, reps, and clients.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client',  -- 'admin', 'rep', 'client'
  hashed_password TEXT NOT NULL,
  lead_id INTEGER REFERENCES leads(id),
  rep_id INTEGER REFERENCES leads(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4.5 Projects Table
Tracks solar installations, links to OpenSolar.

```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  client_id INTEGER REFERENCES users(id),
  rep_id INTEGER REFERENCES users(id),
  project_name TEXT NOT NULL,
  system_size TEXT,
  estimated_value DECIMAL,
  contract_signed_date TIMESTAMP,
  installation_status TEXT DEFAULT 'pending',  -- 'pending','approved','design','permits','installation','completed'
  installation_progress INTEGER DEFAULT 0,     -- 0-100
  expected_completion_date TIMESTAMP,
  actual_completion_date TIMESTAMP,
  opensolar_project_id TEXT,                   -- Links to OpenSolar
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4.6 Installation Updates Table
Timeline of project progress.

```sql
CREATE TABLE installation_updates (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  status TEXT NOT NULL,
  progress INTEGER NOT NULL,  -- 0-100
  message TEXT,
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.7 Contracts Table

```sql
CREATE TABLE contracts (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  contract_type TEXT NOT NULL,  -- 'installation', 'purchase', 'lease'
  document_url TEXT,
  signed_date TIMESTAMP,
  status TEXT DEFAULT 'pending',  -- 'pending', 'signed', 'completed'
  total_amount DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.8 Tasks Table (CRM)

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  rep_id INTEGER REFERENCES users(id),
  lead_id INTEGER REFERENCES leads(id),
  project_id INTEGER REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',  -- 'low', 'medium', 'high'
  status TEXT DEFAULT 'pending',   -- 'pending', 'in_progress', 'completed'
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.9 Messages Table

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id),
  receiver_id INTEGER REFERENCES users(id),
  project_id INTEGER REFERENCES projects(id),
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. API Endpoints

### 5.1 Lead Management
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/leads` | Create a lead (triggers all integrations) |
| GET | `/api/leads` | Get all leads with calculations & consultations |
| GET | `/api/leads/:id` | Get single lead by ID |

**POST /api/leads** - This is the most important endpoint. On creation it:
1. Validates input with Zod schema
2. Saves lead to database
3. Sends email notification via SendGrid (non-blocking)
4. Tracks referral via PushLap (non-blocking)
5. Exports to Google Sheets (non-blocking)
6. Sends to TaskMagic webhook (non-blocking)
7. Creates prospect in OpenSolar (non-blocking)
8. Returns lead + optional openSolarProjectId

**Required fields**: firstName, lastName, email, phone
**Optional fields**: address, monthlyBill, homeSize, roofType, energyGoals, leadSource, status

### 5.2 Solar Calculations
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/solar-calculations` | Run solar savings calculation |

**Calculation logic:**
```
monthlySavings = monthlyBill * 0.85 (85% savings estimate)
yearOneSavings = monthlySavings * 12
twentyYearSavings = yearOneSavings * 18 (accounts for rate increases)
annualKwh = (monthlyBill * 12) / 0.12 (avg $0.12/kWh)
systemSizeKw = annualKwh / 1400 (1400 kWh per kW national avg)
```

### 5.3 Consultations
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/consultations` | Schedule consultation |

### 5.4 Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account (rep or client) |
| POST | `/api/auth/login` | Login (checks demo accounts first, then DB) |
| POST | `/api/auth/logout` | Logout (client clears token) |
| GET | `/api/auth/me` | Get current user from JWT |

**Demo accounts (hardcoded, always work):**
- admin@liv8solar.com / admin123 (Admin)
- demo@liv8solar.com / demo123 (Solar Rep)
- client@liv8solar.com / client123 (Client)

**Client-side demo login**: Also supports zero-API-call demo login where the client stores user directly in localStorage without hitting the server.

### 5.5 User Management
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | Get all users |
| PATCH | `/api/users/:id` | Update user (role, active status) |

### 5.6 Project Management
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/client/:clientId` | Get client's projects |
| GET | `/api/projects/rep/:repId` | Get rep's projects |
| PATCH | `/api/projects/:id` | Update project |
| POST | `/api/projects/:id/complete` | Mark project complete (triggers PushLap sale) |

### 5.7 Tasks (CRM)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/rep/:repId` | Get rep's tasks |
| PATCH | `/api/tasks/:id` | Update task |

### 5.8 Installation Updates
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/installation-updates` | Create update |
| GET | `/api/installation-updates/project/:projectId` | Get project updates |

### 5.9 Messages
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/messages` | Send message |
| GET | `/api/messages/project/:projectId` | Get messages for project |

### 5.10 Google Solar API
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/solar-insights` | Get solar data for an address |
| POST | `/api/solar-insights/bill-match` | Get solar data matched to monthly bill |
| GET | `/api/solar-insights/status` | Check if Google Solar API configured |

### 5.11 OpenSolar API
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/opensolar/status` | Check if OpenSolar configured |
| GET | `/api/opensolar/projects/:id` | Get OpenSolar project |
| GET | `/api/opensolar/projects/:id/summary` | Get full project summary |
| GET | `/api/opensolar/projects/:id/systems` | Get system details |
| GET | `/api/opensolar/projects` | List all OpenSolar projects |
| POST | `/api/opensolar/prospects` | Create prospect from existing lead |
| POST | `/api/webhooks/opensolar` | Receive OpenSolar webhook updates |

### 5.12 Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| POST | `/api/admin/export-to-sheets` | Export lead to Google Sheets |

---

## 6. Authentication System

### JWT-based (stateless)
- On login/register, server returns a JWT token (expires in 7 days)
- Client stores token in localStorage (`liv8_auth_token`)
- Client stores user object in localStorage (`liv8_auth_user`)
- Token sent via `Authorization: Bearer <token>` header
- Password hashing: SHA-256

### Demo Login (client-side, no API call)
For guaranteed login even when server is down:
```typescript
const DEMO_USERS = {
  admin:  { id: 9001, email: "admin@liv8solar.com",  firstName: "LIV8", lastName: "Admin",  role: "admin" },
  rep:    { id: 9002, email: "demo@liv8solar.com",   firstName: "Demo", lastName: "Rep",    role: "rep" },
  client: { id: 9003, email: "client@liv8solar.com", firstName: "Demo", lastName: "Client", role: "client" },
};
```
The `demoLogin(role)` function sets user directly in React state + localStorage.

### Role-based access
- **admin**: Full access - leads, users, analytics, settings
- **rep**: CRM - leads, tasks, projects, messages
- **client**: Portal - project status, solar details, documents, messages

---

## 7. External Integrations

### 7.1 OpenSolar API
**Purpose**: Automatically create prospects/projects in OpenSolar when leads come in.

**Authentication**: POST to `https://api.opensolar.com/api-token-auth/` with username/password. Returns bearer token (cached for 6 days).

**Key operations**:
- `createProspect()` - Creates a project in OpenSolar with contact info, address, notes
- `getProject(id)` - Fetch project details
- `getProjectSummary(id)` - Full summary with systems, panels, batteries, pricing
- `getSystemDetails(id)` - Panel specs, inverters, batteries, pricing
- `listProjects()` - All projects in the org
- `createWebhook()` - Register webhook for project updates

**Prospect creation payload**:
```json
{
  "identifier": "LIV8-{timestamp}",
  "is_residential": "1",
  "lead_source": "LIV8 Solar Website",
  "notes": "Monthly bill: $X\nHome size: X sq ft\nRoof type: X",
  "address": "123 Main St",
  "country_iso2": "US",
  "contacts_new": [{
    "first_name": "John",
    "family_name": "Smith",
    "email": "john@example.com",
    "phone": "555-0123"
  }]
}
```

### 7.2 Google Solar API
**Purpose**: Get real roof data for any address - panel count, sunshine hours, savings estimates.

**Two-step process**:
1. Geocode address -> lat/lng via Google Geocoding API
2. Get building insights via `https://solar.googleapis.com/v1/buildingInsights:findClosest`

**Returns** (summarized):
- Max panel count, max array area (sq ft)
- Max sunshine hours/year
- Recommended system size (kW)
- Yearly energy production (kWh)
- Financial analysis: cash purchase (upfront cost, payback years, 20yr savings), financing (loan payment, interest rate), leasing
- Federal/state incentives
- Net metering availability
- Google Sunroof URL

**Bill-matching**: Can find the best panel configuration that matches a specific monthly electric bill amount.

### 7.3 SendGrid Email
**Purpose**: Send email notifications to info@liv8solar.com on new leads, calculations, and consultations.

**Templates** (HTML emails):
1. **New Lead** - Name, email, phone, address, bill, home size, roof type, source
2. **Solar Calculation** - Bill amount, savings estimates, system size
3. **Consultation Scheduled** - Client name, email, phone, notes

### 7.4 TaskMagic Webhook
**Purpose**: Send all form data to TaskMagic for automation.

**URL**: `https://apps.taskmagic.com/api/v1/webhooks/wYHfzIM5VmcUMO2T5iWhn`

**Payload includes**: leadId, name, email, phone, address, monthlyBill, homeSize, roofType, energyGoals, leadSource, status, formType (consultation/qualification/calculator/opensolar_project_update), calculationData

### 7.5 PushLap Affiliate Tracking
**Purpose**: Track referrals and sales for affiliate payouts.

**Client-side**: Script in index.html tracks form submissions and affiliates.
**Server-side**:
- `trackReferral()` on lead creation
- `trackSale()` on project completion (10% commission)
- Extracts affiliate ID from URL params (`?ref=`), headers, or cookies

### 7.6 Google Sheets Webhook
**Purpose**: Export lead data to Google Sheets via webhook URL.

**Triggered**: On lead creation + manual export from admin dashboard.

### 7.7 AnyChat Widget
Chatbot widget embedded in index.html:
```html
<script src="https://api.anychat.one/widget/b7dd7318-c52c-31a9-ba39-b0b2955633af"></script>
```

---

## 8. Frontend Pages & Components

### 8.1 Home Page (`/`)
The main marketing landing page with these sections (in order):

1. **Navigation Bar** - Logo, nav links (How It Works, Calculator, Services, Why Us, Contact), "Get Qualified" CTA button, Login button
2. **Hero Section** - Big headline about $0 down solar, "Check If You Qualify" and "Calculate Savings" buttons
3. **How It Works** - 3-step process cards
4. **Solar Calculator** - Multi-step form: monthly bill slider -> home size -> roof type -> address -> results with savings. If Google Solar API is configured, also shows real roof data.
5. **Services Overview** - Solar, Storage, Off-Grid solution cards
6. **Why Choose Us** - Feature cards (DOE Project Hestia, $0 Down, etc.) with "Schedule Free Consultation" button
7. **Testimonials** - Customer review cards
8. **Solar Rep Opportunity** - Recruitment section for solar reps
9. **Contact/Consultation Section** - Name, email, phone, energy goals form -> creates lead + schedules consultation
10. **Footer** - Links, contact info, social links, login link

**Modals**:
- **Qualification Modal** - Multi-step: monthly bill -> home ownership -> credit score -> contact info. Creates lead on submit.
- **Exit Intent Modal** - Shows when mouse leaves viewport. "Wait! Before you go..." with "Check If You Qualify" CTA.

### 8.2 Auth Page (`/login`)
- Sign In tab: Email + password form, demo login buttons (Admin, Rep, Client)
- Sign Up tab: First/last name, email, password, role (Rep/Client)
- Demo buttons use client-side login (no API call) for guaranteed access

### 8.3 Dashboard (`/dashboard/*`)
Protected route - redirects to `/login` if not authenticated. Shows role-appropriate dashboard.

**Layout**: Collapsible sidebar + main content area
- Sidebar: Role-based navigation links, theme toggle (light/dark), user menu (settings, help, sign out)
- Top bar: Sidebar toggle + breadcrumb

**Admin sidebar links**: Overview, Leads, Projects, Team, Analytics, Settings, Help Docs, AI Assistant
**Rep sidebar links**: Dashboard, My Leads, My Projects, Tasks, Messages, Help, AI Assistant
**Client sidebar links**: My Project, Solar Details, Documents, Messages, Help, AI Assistant

### 8.4 Admin Dashboard
**Tabs** (synced with URL - `/dashboard/leads`, `/dashboard/team`, `/dashboard/analytics`, `/dashboard/settings`):

1. **Leads Tab** (`/dashboard/leads`)
   - Stats cards: Total Leads, Revenue Pipeline, Active Projects, Conversion Rate, Active Users, This Month
   - Lead list with: name, status badge, source badge, email, phone, address, monthly bill, home size, roof type, date, calculation results
   - Export CSV button (all leads), per-lead Export CSV and "To Sheets" buttons

2. **Users Tab** (`/dashboard/team`)
   - User list with name, email, role badge, active status, created date
   - Role change dropdown (Client/Rep/Admin)

3. **Analytics Tab** (`/dashboard/analytics`)
   - Placeholder for analytics charts

4. **Settings Tab** (`/dashboard/settings`)
   - Google Sheets webhook URL configuration
   - Email/PushLap status indicators

### 8.5 Rep Dashboard
**Tabs** (URL-synced - `/dashboard/leads`, `/dashboard/tasks`, `/dashboard/projects`, `/dashboard/messages`):

1. **Leads** - Stats cards (Total Leads, Pending Tasks, Active Projects, Pipeline Value) + lead list with contact buttons
2. **Tasks** - Task list with priority/status badges, "New Task" button opens dialog (title, description, priority)
3. **Projects** - Project cards with status, progress %, value, completion date, "Update Status" button
4. **Messages** - Placeholder for messaging

### 8.6 Client Dashboard
**Tabs** (URL-synced - `/dashboard`, `/dashboard/solar`, `/dashboard/documents`, `/dashboard/messages`):

1. **Overview** - Welcome card, project status, quick actions
2. **Solar Details** - System specs from OpenSolar (if connected): capacity, panels, inverter, battery, annual production, price
3. **Progress** - Installation timeline with progress bar and status updates
4. **Documents** - Contract list with download links
5. **Messages** - Communication with rep

### 8.7 Help Docs (`/dashboard/help`)
Accordion-based help documentation:
- Getting Started, Lead Management, Solar Calculator, Dashboard Navigation, OpenSolar Integration, Google Solar API, Settings, Mobile App

### 8.8 Additional Components

**AI Assistant** - Floating chat button in bottom-right corner of dashboard. Opens a slide-over panel. Currently a UI placeholder.

**Onboarding Tutorial** - First-time user overlay that highlights key dashboard features. Shows on first login (tracked via localStorage `liv8_onboarding_complete`).

**Installation Progress** - Visual progress tracker component showing installation stages:
1. Contract Signed
2. Design Complete
3. Permits Approved
4. Installation Scheduled
5. Installation Complete
6. System Activated

---

## 9. Data Flow

### Lead Submission (the critical path)

```
User fills form (Qualification / Calculator / Consultation)
  ↓
Frontend POSTs to /api/leads
  ↓
Server validates with Zod schema
  ↓
Save lead to database
  ↓ (all below are non-blocking, wrapped in try/catch)
├── SendGrid: Email notification to info@liv8solar.com
├── PushLap: Track referral with affiliate ID
├── Google Sheets: Export lead data via webhook
├── TaskMagic: Send to automation webhook
└── OpenSolar: Create prospect with contact + address + notes
  ↓
Return lead data + openSolarProjectId to frontend
  ↓
Frontend shows success message
```

### Dashboard Data Flow

```
User logs in (demo or API)
  → JWT token stored in localStorage
  → User object stored in React state + localStorage
  ↓
Dashboard loads
  → React Query fetches /api/leads, /api/admin/stats, /api/users
  → Data displayed in tabs
  ↓
Sidebar navigation
  → wouter updates URL (e.g. /dashboard/leads)
  → Dashboard component reads URL, sets active tab
  → Tab content shows corresponding data
```

### OpenSolar Integration Flow

```
Lead created with openSolarProjectId
  ↓
Admin/Rep can view OpenSolar data:
  GET /api/opensolar/projects/:id/summary
  ↓
Returns: project details, system specs, panel info, pricing
  ↓
Client dashboard shows: capacity, panels, inverter, battery, price
```

---

## 10. Business Logic

### Solar Savings Calculation
```
Input: monthlyBill, homeSize, roofType
Output: monthlySavings, yearOneSavings, twentyYearSavings, systemSize

monthlySavings = monthlyBill × 0.85
yearOneSavings = monthlySavings × 12
twentyYearSavings = yearOneSavings × 18
systemSizeKw = (monthlyBill × 12 / 0.12) / 1400
```

### Qualification Logic (client-side)
The qualification modal checks:
1. Monthly bill >= $100 (qualified if yes)
2. Home ownership = "own" (must own)
3. Credit score >= 650 (preferred, but alternatives available)

If not fully qualified, shows alternative options (community solar, energy audit).

### Admin Stats
```
totalLeads = count of all leads
leadsThisMonth = leads where createdAt >= first of month
totalRevenue = totalLeads × $25,000 (estimated per lead)
activeProjects = totalLeads × 0.3 (30% conversion estimate)
conversionRate = 30% (or actual if consultations exist)
```

### Project Completion + Affiliate Payout
When a project is marked complete:
1. Update project status to 'completed', progress to 100%
2. If lead has a tracked affiliate, call PushLap trackSale with 10% commission

---

## 11. UI/UX Design Spec

### Color Palette
```css
--primary: hsl(174, 75%, 24%)          /* Teal - main brand */
--primary-foreground: hsl(174, 100%, 95%)
--solar-teal: hsl(174, 85%, 24%)
--solar-turquoise: hsl(174, 72%, 56%)
--solar-blue: hsl(223, 84%, 33%)
--solar-green: hsl(158, 64%, 52%)
--solar-orange: hsl(38, 92%, 50%)
--solar-gray: hsl(218, 11%, 28%)
--background: hsl(0, 0%, 100%)         /* Light mode */
--foreground: hsl(20, 14.3%, 4.1%)
```

### Dark Mode
Full dark mode support with `.dark` class on `<html>`:
```css
.dark {
  --background: hsl(240, 10%, 3.9%);
  --foreground: hsl(0, 0%, 98%);
  /* ... all tokens have dark variants */
}
```

### Typography
- **Body**: Inter, 300-700 weights
- **Headings**: Poppins, 400-800 weights
- Font loading via Google Fonts

### Responsive Design
- Mobile-first approach
- Breakpoints: `md:768px`, `lg:1024px`
- Collapsible sidebar on mobile
- Grid layouts adapt from 1 col (mobile) to 2-6 cols (desktop)

### Component Library (shadcn/ui)
Uses these components: Accordion, Avatar, Badge, Button, Card, Checkbox, Collapsible, Command, Dialog, Dropdown Menu, Form, Input, Label, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Switch, Table, Tabs, Textarea, Toast, Toggle, Tooltip

### Icons
Lucide React icons throughout. Key icons:
- Sun (brand), Shield (admin), Briefcase (rep), User (client)
- Users, TrendingUp, DollarSign, Calendar, Download, Settings, Phone, Mail, MapPin, BarChart3

### Third-Party Embeds
- **AnyChat**: Chatbot widget (bottom-right corner)
- **PushLap**: Affiliate tracker script
- **Google Fonts**: Inter + Poppins

---

## Appendix A: Form Fields Reference

### Qualification Form
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| monthlyBill | string | Yes | Slider or input |
| homeOwnership | "own"/"rent" | Yes | Radio |
| creditScore | string | Yes | Select |
| firstName | string | Yes | |
| lastName | string | Yes | |
| email | string | Yes | |
| phone | string | Yes | |
| address | string | Yes | |

### Solar Calculator Form
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| monthlyBill | number | Yes | Slider 50-500+ |
| homeSize | number | Yes | Input |
| roofType | string | Yes | Select: asphalt/tile/metal/flat |
| address | string | For Google Solar | Enables real roof data |
| firstName | string | Yes (step 2) | Lead capture |
| lastName | string | Yes (step 2) | |
| email | string | Yes (step 2) | |
| phone | string | Yes (step 2) | |

### Consultation Form
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| firstName | string | Yes | |
| lastName | string | Yes | |
| email | string | Yes | |
| phone | string | Yes | |
| energyGoals | string | No | Textarea |

---

## Appendix B: OpenSolar API Reference

### Authentication
```
POST https://api.opensolar.com/api-token-auth/
Body: { "username": "...", "password": "..." }
Response: { "token": "..." }
```

### Create Project (Prospect)
```
POST https://api.opensolar.com/api/orgs/{orgId}/projects/
Authorization: Bearer {token}
Body: {
  "identifier": "LIV8-{timestamp}",
  "is_residential": "1",
  "lead_source": "LIV8 Solar Website",
  "notes": "...",
  "address": "...",
  "contacts_new": [{ "first_name": "...", "family_name": "...", "email": "...", "phone": "..." }]
}
```

### Get Project Summary
```
GET https://api.opensolar.com/api/orgs/{orgId}/projects/{id}/
GET https://api.opensolar.com/api/orgs/{orgId}/projects/{id}/systems/details/
```

### Create Webhook
```
POST https://api.opensolar.com/api/orgs/{orgId}/webhooks/
Body: {
  "endpoint": "https://yourdomain.com/api/webhooks/opensolar",
  "enabled": true,
  "trigger_fields": ["project.stage"],
  "payload_fields": ["project.address", "project.contacts_data", "project.systems.price_including_tax", ...]
}
```

---

## Appendix C: Google Solar API Reference

### Geocoding
```
GET https://maps.googleapis.com/maps/api/geocode/json?address={encoded_address}&key={key}
```

### Building Insights
```
GET https://solar.googleapis.com/v1/buildingInsights:findClosest
  ?location.latitude={lat}
  &location.longitude={lng}
  &requiredQuality=HIGH
  &key={key}
```

Falls back to `requiredQuality=MEDIUM` if HIGH returns 404.

### Response includes:
- `solarPotential.maxArrayPanelsCount` - Max panels that fit on roof
- `solarPotential.maxSunshineHoursPerYear` - Peak sun hours
- `solarPotential.solarPanelConfigs[]` - Array of panel configurations
- `solarPotential.financialAnalyses[]` - Financial analysis per bill amount
- Each financial analysis includes cash purchase, financing, and leasing options with savings projections

---

## Appendix D: Key URLs for Rebuild

| Service | URL |
|---------|-----|
| OpenSolar API | https://api.opensolar.com |
| OpenSolar Docs | https://developers.opensolar.com |
| Google Solar API | https://solar.googleapis.com/v1/buildingInsights:findClosest |
| Google Geocoding | https://maps.googleapis.com/maps/api/geocode/json |
| Google Sunroof | https://sunroof.withgoogle.com |
| TaskMagic Webhook | https://apps.taskmagic.com/api/v1/webhooks/wYHfzIM5VmcUMO2T5iWhn |
| PushLap | https://www.pushlapgrowth.com/api/v1 |
| AnyChat Widget | https://api.anychat.one/widget/b7dd7318-c52c-31a9-ba39-b0b2955633af |
| PushLap Tracker | https://pushlapgrowth.com/affiliate-tracker.js (program: 9acd7ded-50dc-4b98-b698-c78edc0481b3) |

---

*Generated from SolarLeadPro codebase. All business logic, API integrations, and UI specifications are documented above for complete rebuild on any platform.*
