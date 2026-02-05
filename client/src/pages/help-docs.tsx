import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  Search, LayoutDashboard, Users, Zap, MessageCircle, ClipboardList,
  Settings, FileText, Shield, HelpCircle, ChevronDown, ChevronRight,
  Sun, Bot,
} from "lucide-react";

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  roles: string[];
  content: string;
}

const helpArticles: HelpArticle[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    category: "Basics",
    icon: LayoutDashboard,
    roles: ["admin", "rep", "client"],
    content: `Welcome to LIV8 Solar! Here's how to get started:\n\n1. **Login** - Use the credentials provided to you or create an account from the Sign Up page.\n2. **Dashboard** - Your dashboard shows an overview of your projects, leads, and tasks based on your role.\n3. **Navigation** - Use the collapsible sidebar on the left to navigate between sections.\n4. **Theme** - Toggle between light and dark mode using the button in the sidebar footer.\n5. **AI Assistant** - Click the chat bubble in the bottom right for quick help.`,
  },
  {
    id: "lead-management",
    title: "Managing Leads",
    category: "Leads",
    icon: Users,
    roles: ["admin", "rep"],
    content: `Leads flow into the system automatically from the website:\n\n1. **Auto-capture** - When a customer fills out any form (qualification, consultation, calculator), a lead is created automatically.\n2. **Notifications** - Email notifications are sent via SendGrid for each new lead.\n3. **TaskMagic Sync** - All lead data is forwarded to TaskMagic for your automation workflows.\n4. **Google Sheets** - Leads are also backed up to Google Sheets if configured.\n5. **OpenSolar** - A prospect is automatically created in OpenSolar for each new lead.\n\nAs a rep, you'll see your assigned leads in "My Leads". Admins can see all leads.`,
  },
  {
    id: "opensolar-integration",
    title: "OpenSolar Integration",
    category: "Integrations",
    icon: Zap,
    roles: ["admin", "rep"],
    content: `LIV8 Solar integrates directly with OpenSolar for automated project management:\n\n1. **Auto-Prospect Creation** - New leads are automatically created as prospects in OpenSolar.\n2. **Project Sync** - Project details, system designs, and pricing are pulled from OpenSolar.\n3. **System Details** - Panel counts, inverter specs, and battery info come directly from OpenSolar designs.\n4. **Client Portal** - Clients can see their project details pulled from OpenSolar in real-time.\n\nTo configure: Set OPENSOLAR_USERNAME, OPENSOLAR_PASSWORD, and OPENSOLAR_ORG_ID in environment variables.`,
  },
  {
    id: "google-solar-api",
    title: "Google Solar API & Roof Analysis",
    category: "Integrations",
    icon: Sun,
    roles: ["admin", "rep"],
    content: `The Google Solar API provides satellite-based roof analysis:\n\n1. **Automatic Analysis** - When a lead enters their address, we fetch real satellite data.\n2. **Roof Data** - Usable roof area, max panel count, and sunshine hours.\n3. **Energy Estimates** - Projected annual energy production based on actual roof conditions.\n4. **Financial Analysis** - Estimated savings, payback period, and federal tax credit info.\n5. **Sunroof Link** - Each analysis includes a link to Google Sunroof for visual exploration.\n\nTo configure: Set GOOGLE_SOLAR_API_KEY in environment variables.`,
  },
  {
    id: "client-portal",
    title: "Using the Client Portal",
    category: "Basics",
    icon: FileText,
    roles: ["client"],
    content: `Your client portal gives you full visibility into your solar project:\n\n1. **Project Status** - See where your installation is in the process (design, permits, installation, etc.).\n2. **Solar Details** - View your system specs: panel count, type, inverter, and battery information.\n3. **Documents** - Access contracts, proposals, and other project documents.\n4. **Messages** - Communicate directly with your solar rep.\n5. **Timeline** - Track progress with installation milestones and updates.`,
  },
  {
    id: "task-management",
    title: "Task & CRM Features",
    category: "Productivity",
    icon: ClipboardList,
    roles: ["admin", "rep"],
    content: `Stay organized with built-in task management:\n\n1. **Create Tasks** - Add tasks linked to specific leads or projects.\n2. **Priority Levels** - Set tasks as low, medium, or high priority.\n3. **Status Tracking** - Move tasks between pending, in-progress, and completed.\n4. **Due Dates** - Set deadlines to stay on track.\n5. **Team View** - Admins can see tasks across all reps.`,
  },
  {
    id: "messaging",
    title: "Messaging System",
    category: "Communication",
    icon: MessageCircle,
    roles: ["admin", "rep", "client"],
    content: `Keep all communication organized:\n\n1. **Project Messages** - Messages are linked to specific projects for context.\n2. **Read Receipts** - See when your messages have been read.\n3. **All Roles** - Reps, admins, and clients can all communicate through the system.\n4. **Notifications** - Get notified of new messages.`,
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    category: "Productivity",
    icon: Bot,
    roles: ["admin", "rep"],
    content: `The AI Assistant helps you work faster:\n\n1. **Quick Actions** - Check OpenSolar status, view lead summaries, and more with one click.\n2. **Solar API Status** - Instantly verify that integrations are connected.\n3. **System Tips** - Get helpful tips about using the platform.\n4. **Natural Language** - Ask questions about OpenSolar, leads, the Google Solar API, and more.\n5. **Access** - Click the chat bubble in the bottom right, or use the sidebar link.`,
  },
  {
    id: "settings-security",
    title: "Settings & Security",
    category: "Account",
    icon: Shield,
    roles: ["admin", "rep", "client"],
    content: `Keep your account secure:\n\n1. **Password** - Use a strong, unique password for your account.\n2. **Roles** - Admin, Rep, and Client roles have different access levels.\n3. **Sessions** - Sessions expire after 24 hours of inactivity.\n4. **Logout** - Always log out when using shared computers.\n5. **Admin Controls** - Admins can manage user accounts and permissions.`,
  },
];

export default function HelpDocs() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>("getting-started");

  const filteredArticles = helpArticles.filter((article) => {
    const matchesRole = !user || article.roles.includes(user.role);
    const matchesSearch = !search ||
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.content.toLowerCase().includes(search.toLowerCase()) ||
      article.category.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const categories = [...new Set(filteredArticles.map((a) => a.category))];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Help & Documentation</h1>
        <p className="text-muted-foreground">Everything you need to know about using LIV8 Solar</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search help articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {categories.map((category) => (
        <div key={category} className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {category}
            <Badge variant="secondary" className="text-xs">
              {filteredArticles.filter((a) => a.category === category).length}
            </Badge>
          </h2>

          {filteredArticles
            .filter((a) => a.category === category)
            .map((article) => {
              const isExpanded = expandedArticle === article.id;
              return (
                <Card key={article.id} className="cursor-pointer" onClick={() => setExpandedArticle(isExpanded ? null : article.id)}>
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <article.icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{article.title}</CardTitle>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-0 pb-4">
                      <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                        {article.content.split('\n').map((line, i) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <strong key={i} className="text-foreground">{line.replace(/\*\*/g, '')}</strong>;
                          }
                          // Handle bold within text
                          const parts = line.split(/(\*\*[^*]+\*\*)/g);
                          return (
                            <span key={i}>
                              {parts.map((part, j) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return <strong key={j} className="text-foreground">{part.replace(/\*\*/g, '')}</strong>;
                                }
                                return <span key={j}>{part}</span>;
                              })}
                            </span>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
        </div>
      ))}

      {filteredArticles.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No articles found matching "{search}"</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search term or use the AI Assistant for help</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
