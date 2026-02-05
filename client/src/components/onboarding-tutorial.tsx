import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Users, Zap, MessageCircle, ClipboardList,
  Sun, ArrowRight, ArrowLeft, CheckCircle, BookOpen, Bot,
} from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ElementType;
  tips: string[];
}

const adminSteps: OnboardingStep[] = [
  {
    title: "Welcome to LIV8 Solar Admin",
    description: "As an admin, you have full access to manage leads, projects, team members, and analytics.",
    icon: LayoutDashboard,
    tips: [
      "View all leads and their status from the Leads page",
      "Monitor team performance in Analytics",
      "Manage solar rep accounts in the Team section",
    ],
  },
  {
    title: "Lead Management",
    description: "All website form submissions automatically create leads in your system.",
    icon: Users,
    tips: [
      "Leads are auto-synced to OpenSolar as prospects",
      "TaskMagic receives all form data via webhook",
      "Google Sheets integration keeps a backup of all leads",
    ],
  },
  {
    title: "OpenSolar Integration",
    description: "Your system is connected to OpenSolar for automated project management.",
    icon: Zap,
    tips: [
      "Prospects are auto-created when leads come in",
      "Project details, system designs, and pricing sync automatically",
      "Clients can see their solar details in the portal",
    ],
  },
];

const repSteps: OnboardingStep[] = [
  {
    title: "Welcome, Solar Rep!",
    description: "Your dashboard is your command center for managing leads and closing deals.",
    icon: LayoutDashboard,
    tips: [
      "Check your assigned leads in My Leads",
      "Track project progress from My Projects",
      "Use the AI Assistant for quick answers",
    ],
  },
  {
    title: "Task Management",
    description: "Stay organized with your task list and follow-up reminders.",
    icon: ClipboardList,
    tips: [
      "Create tasks for yourself linked to leads or projects",
      "Mark tasks as completed when done",
      "Use priority levels to focus on what matters",
    ],
  },
  {
    title: "Communication",
    description: "Stay in touch with clients and your team through the messaging system.",
    icon: MessageCircle,
    tips: [
      "Send messages linked to specific projects",
      "Keep all communication in one place",
      "Clients see their messages in their portal",
    ],
  },
];

const clientSteps: OnboardingStep[] = [
  {
    title: "Welcome to Your Solar Portal",
    description: "Track your solar project from start to finish right here.",
    icon: Sun,
    tips: [
      "View your project status and timeline",
      "See your solar system details and equipment",
      "Access all documents and contracts",
    ],
  },
  {
    title: "Solar Details",
    description: "See exactly what's being installed on your roof.",
    icon: Zap,
    tips: [
      "Panel count, type, and manufacturer info",
      "Battery storage details if applicable",
      "Estimated annual energy production",
    ],
  },
  {
    title: "Need Help?",
    description: "We're here for you every step of the way.",
    icon: BookOpen,
    tips: [
      "Use the AI Assistant (bottom right) for quick answers",
      "Check Help Docs for detailed guides",
      "Send a message to your solar rep anytime",
    ],
  },
];

export default function OnboardingTutorial() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const storageKey = `onboarding-completed-${user?.id}`;

  useEffect(() => {
    if (user && !localStorage.getItem(storageKey)) {
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [user, storageKey]);

  const steps = user?.role === "admin" ? adminSteps : user?.role === "rep" ? repSteps : clientSteps;
  const step = steps[currentStep];

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleComplete(); }}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                {step && <step.icon className="h-8 w-8 text-primary" />}
              </div>
            </div>
            <div className="flex justify-center gap-1.5 mb-4">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep ? "w-8 bg-primary" : i < currentStep ? "w-4 bg-primary/50" : "w-4 bg-muted"
                  }`}
                />
              ))}
            </div>
            <CardTitle className="text-xl">{step?.title}</CardTitle>
            <CardDescription className="text-base">{step?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {step?.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              <Badge variant="secondary" className="text-xs">
                {currentStep + 1} of {steps.length}
              </Badge>

              <Button size="sm" onClick={handleNext}>
                {currentStep === steps.length - 1 ? (
                  "Get Started"
                ) : (
                  <>Next <ArrowRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </div>

            {currentStep < steps.length - 1 && (
              <div className="text-center">
                <button
                  onClick={handleComplete}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Skip tutorial
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
