import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, X, Send, Zap, ClipboardList, Sun, Lightbulb } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickActions = [
  { label: "Check OpenSolar status", icon: Sun, action: "opensolar-status" },
  { label: "View lead summary", icon: ClipboardList, action: "lead-summary" },
  { label: "Solar API status", icon: Zap, action: "solar-status" },
  { label: "System tips", icon: Lightbulb, action: "tips" },
];

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your LIV8 Solar AI assistant. I can help you with OpenSolar projects, lead management, system status, and quick answers. What do you need?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const handler = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggle-ai-assistant", handler);
    return () => window.removeEventListener("toggle-ai-assistant", handler);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role, content, timestamp: new Date() },
    ]);
  };

  const handleQuickAction = async (action: string) => {
    setIsProcessing(true);
    try {
      switch (action) {
        case "opensolar-status": {
          addMessage("user", "Check OpenSolar integration status");
          const res = await fetch("/api/opensolar/status", { credentials: "include" });
          const data = await res.json();
          addMessage("assistant", data.configured
            ? "OpenSolar is connected and ready. You can create prospects, view projects, and pull system details automatically."
            : "OpenSolar is not configured yet. Add OPENSOLAR_USERNAME, OPENSOLAR_PASSWORD, and OPENSOLAR_ORG_ID to your environment variables to enable the integration."
          );
          break;
        }
        case "solar-status": {
          addMessage("user", "Check Google Solar API status");
          const res = await fetch("/api/solar-insights/status", { credentials: "include" });
          const data = await res.json();
          addMessage("assistant", data.configured
            ? "Google Solar API is active. Address-based roof analysis, sunshine hours, panel counts, and financial projections are all available."
            : "Google Solar API is not configured. Add GOOGLE_SOLAR_API_KEY to enable satellite roof analysis and accurate solar calculations."
          );
          break;
        }
        case "lead-summary": {
          addMessage("user", "Show me a lead summary");
          try {
            const res = await fetch("/api/admin/stats", { credentials: "include" });
            const stats = await res.json();
            addMessage("assistant",
              `Here's your lead summary:\n- Total Leads: ${stats.totalLeads}\n- This Month: ${stats.leadsThisMonth}\n- Active Projects: ${stats.activeProjects}\n- Conversion Rate: ${stats.conversionRate}%\n- Estimated Revenue: $${stats.totalRevenue?.toLocaleString()}`
            );
          } catch {
            addMessage("assistant", "I couldn't fetch the lead summary. Make sure you have the right permissions.");
          }
          break;
        }
        case "tips": {
          addMessage("user", "Give me some system tips");
          addMessage("assistant",
            "Here are some tips for using LIV8 Solar:\n\n" +
            "1. **Auto-prospect**: Every lead submitted through the website automatically creates a prospect in OpenSolar.\n\n" +
            "2. **Google Roof Analysis**: When leads enter their address, we pull real satellite data - panel count, sunshine hours, and savings estimates.\n\n" +
            "3. **TaskMagic Sync**: All form submissions are sent to your TaskMagic webhook for automation.\n\n" +
            "4. **Client Portal**: Clients can see their project status, system details (panels, inverters, batteries), and documents - all pulled from OpenSolar.\n\n" +
            "5. **Keyboard shortcuts**: Press Ctrl+B to toggle the sidebar."
          );
          break;
        }
      }
    } catch (err) {
      addMessage("assistant", "Sorry, I encountered an error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    const question = input.trim();
    setInput("");
    addMessage("user", question);
    setIsProcessing(true);

    // Simple keyword-based responses
    const lowerQ = question.toLowerCase();
    let response = "";

    if (lowerQ.includes("opensolar") || lowerQ.includes("open solar")) {
      response = "OpenSolar is our solar design and proposal platform. Through our API integration, leads are automatically created as prospects. You can view project details, system designs (panels, inverters, batteries), and pricing - all synced to the client dashboard. Use the quick action buttons to check the connection status.";
    } else if (lowerQ.includes("lead") || lowerQ.includes("prospect")) {
      response = "Leads flow through the system like this:\n1. Customer fills out a form on the website\n2. Lead is saved to our database\n3. Email notification sent via SendGrid\n4. Data pushed to TaskMagic webhook\n5. Prospect auto-created in OpenSolar\n6. Lead tracked in Google Sheets\n\nAll of this happens automatically on every form submission.";
    } else if (lowerQ.includes("solar") && (lowerQ.includes("api") || lowerQ.includes("google"))) {
      response = "We use the Google Solar API to get real satellite data for any address:\n- Roof area and usable space\n- Max panel count\n- Annual sunshine hours\n- Energy production estimates\n- Financial analysis (payback, incentives, savings)\n\nThis data shows up in the calculator when a customer enters their address.";
    } else if (lowerQ.includes("task") || lowerQ.includes("todo")) {
      response = "Tasks can be managed from the Tasks section in the sidebar. You can create tasks for yourself or assign them to team members. Each task can be linked to a lead or project. Use the rep dashboard to track your pending, in-progress, and completed tasks.";
    } else if (lowerQ.includes("help") || lowerQ.includes("how")) {
      response = "Check out the Help Docs in the sidebar for detailed guides on:\n- Getting started with the platform\n- Managing leads and prospects\n- Understanding the OpenSolar integration\n- Using the solar calculator\n- Client portal features\n\nOr just ask me a specific question!";
    } else if (lowerQ.includes("ghl") || lowerQ.includes("go high level") || lowerQ.includes("highlevel")) {
      response = "GHL (GoHighLevel) integration works alongside our system. TaskMagic webhooks can forward data to GHL workflows. The key touchpoints:\n- Lead data sent via webhook on form submission\n- OpenSolar project updates forwarded to TaskMagic\n- You can set up GHL agents to handle follow-ups\n\nThe webhook endpoint for all forms is already configured.";
    } else {
      response = "I'm not sure about that specific topic, but I can help with:\n- OpenSolar project details and status\n- Google Solar API and roof analysis\n- Lead management and pipeline\n- Task and project tracking\n- System configuration\n\nTry one of the quick action buttons below, or ask about any of these topics!";
    }

    setTimeout(() => {
      addMessage("assistant", response);
      setIsProcessing(false);
    }, 500);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 z-50"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-5rem)] shadow-2xl z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-sm">LIV8 AI Assistant</CardTitle>
            <p className="text-xs text-muted-foreground">Solar team helper</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="px-3 py-2 border-t flex-shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {quickActions.map((qa) => (
            <Badge
              key={qa.action}
              variant="outline"
              className="cursor-pointer hover:bg-muted whitespace-nowrap flex-shrink-0 text-xs"
              onClick={() => handleQuickAction(qa.action)}
            >
              <qa.icon className="h-3 w-3 mr-1" />
              {qa.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Input */}
      <CardContent className="p-3 border-t flex-shrink-0">
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          <Input
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="text-sm"
            disabled={isProcessing}
          />
          <Button type="submit" size="icon" disabled={isProcessing || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
