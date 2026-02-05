import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import AdminDashboard from "@/pages/admin-dashboard";
import RepDashboard from "@/pages/rep-dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import HelpDocs from "@/pages/help-docs";
import DashboardLayout from "@/components/dashboard-layout";
import AIAssistant from "@/components/ai-assistant";
import OnboardingTutorial from "@/components/onboarding-tutorial";

function ProtectedDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  const DashboardContent = user.role === "admin" ? AdminDashboard
    : user.role === "rep" ? RepDashboard
    : ClientDashboard;

  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard/help" component={HelpDocs} />
        <Route path="/dashboard/:rest*" component={DashboardContent} />
        <Route path="/dashboard" component={DashboardContent} />
      </Switch>
      <AIAssistant />
      <OnboardingTutorial />
    </DashboardLayout>
  );
}

function LoginGuard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return <AuthPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginGuard} />
      <Route path="/dashboard/:rest*" component={ProtectedDashboard} />
      <Route path="/dashboard" component={ProtectedDashboard} />
      {/* Legacy routes redirect to new dashboard */}
      <Route path="/admin">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/admin-dashboard">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/rep-dashboard">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/client-dashboard">
        <Redirect to="/dashboard" />
      </Route>
      <Route component={Home} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
