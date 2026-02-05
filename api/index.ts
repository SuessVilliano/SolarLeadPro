import express from "express";
import type { Request, Response } from "express";
import { storage } from "../server/storage";
import { insertLeadSchema, insertSolarCalculationSchema, insertConsultationSchema } from "../shared/schema";
import { sendEmail, emailTemplates } from "../server/sendgrid";
import { getPushLapAPI, extractAffiliateId, trackProjectSale } from "../server/pushLap";
import { sendToGoogleSheets, formatLeadForGoogleSheets } from "../server/googleSheets";
import { sendToTaskMagic, formatLeadForTaskMagic } from "../server/taskMagicWebhook";
import { getSolarInsightsForAddress, getSolarInsightsForBill, isGoogleSolarConfigured } from "../server/googleSolarApi";
import { createProspect, getProject, getProjectSummary, getSystemDetails, isOpenSolarConfigured, listProjects } from "../server/openSolarApi";
import { z } from "zod";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "liv8-solar-jwt-secret-change-in-production";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function createToken(user: { id: number; email: string; firstName: string; lastName: string; role: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function verifyToken(token: string): any | null {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

// Auto-seed admin (runs every cold start since MemStorage resets)
async function ensureAdminExists() {
  try {
    const existing = await storage.getUserByEmail("admin@liv8solar.com");
    if (!existing) {
      await storage.createUser({
        email: "admin@liv8solar.com",
        hashedPassword: hashPassword("admin123"),
        firstName: "LIV8",
        lastName: "Admin",
        role: "admin",
      });
    }
  } catch (e) { console.error("Failed to seed admin:", e); }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Auto-seed admin on startup
ensureAdminExists();

// Auth routes (JWT-based, stateless for Vercel serverless)
app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ message: "All fields are required" }); return;
    }
    await ensureAdminExists();
    const existing = await storage.getUserByEmail(email);
    if (existing) { res.status(409).json({ message: "Email already registered" }); return; }
    const allowedRoles = ["client", "rep"];
    const userRole = allowedRoles.includes(role) ? role : "rep";
    const user = await storage.createUser({ email, firstName, lastName, role: userRole, hashedPassword: hashPassword(password), isActive: true });
    const token = createToken(user);
    res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, token });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ message: "Email and password are required" }); return; }
    await ensureAdminExists();
    const user = await storage.getUserByEmail(email);
    if (!user) { res.status(401).json({ message: "Invalid credentials" }); return; }
    const hashed = hashPassword(password);
    if (user.hashedPassword !== hashed) { res.status(401).json({ message: "Invalid credentials" }); return; }
    const token = createToken(user);
    res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

app.post("/api/auth/logout", (_req: Request, res: Response) => {
  res.json({ message: "Logged out" });
});

app.get("/api/auth/me", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Not authenticated" }); return;
  }
  const payload = verifyToken(authHeader.split(" ")[1]);
  if (!payload) { res.status(401).json({ message: "Invalid or expired token" }); return; }
  res.json({ id: payload.id, email: payload.email, firstName: payload.firstName, lastName: payload.lastName, role: payload.role });
});

app.post("/api/auth/seed-admin", async (_req: Request, res: Response) => {
  try { await ensureAdminExists(); res.json({ message: "Admin ready" }); }
  catch (error) { res.status(500).json({ message: "Failed to seed admin" }); }
});

// Create lead
app.post("/api/leads", async (req: Request, res: Response) => {
  try {
    const leadData = insertLeadSchema.parse(req.body);
    const lead = await storage.createLead(leadData);

    console.log("NEW LEAD SUBMITTED:", { id: lead.id, name: `${lead.firstName} ${lead.lastName}` });

    // === All external integrations below are non-blocking ===
    try {
      const emailTemplate = emailTemplates.newLead(lead);
      await sendEmail({ to: 'info@liv8solar.com', from: 'noreply@liv8solar.com', subject: emailTemplate.subject, html: emailTemplate.html, text: emailTemplate.text });
    } catch (e) { console.error('Email failed (non-blocking):', e); }

    try {
      const pushLapAPI = getPushLapAPI();
      if (pushLapAPI) {
        const affiliateId = extractAffiliateId(req);
        await pushLapAPI.trackReferral({ affiliateId, name: `${lead.firstName} ${lead.lastName}`, email: lead.email, referredUserExternalId: lead.id.toString(), plan: 'solar_lead', status: 'new_referral' });
      }
    } catch (e) { console.error('PushLap failed (non-blocking):', e); }

    try { await sendToGoogleSheets(formatLeadForGoogleSheets(lead)); } catch (e) { console.error('Sheets failed:', e); }
    try { await sendToTaskMagic(formatLeadForTaskMagic(lead, 'lead_submission')); } catch (e) { console.error('TaskMagic failed:', e); }

    let openSolarProjectId: string | undefined;
    try {
      if (isOpenSolarConfigured()) {
        const osProject = await createProspect({ firstName: lead.firstName, lastName: lead.lastName, email: lead.email, phone: lead.phone, address: lead.address || undefined, monthlyBill: lead.monthlyBill?.toString(), homeSize: lead.homeSize || undefined, roofType: lead.roofType || undefined, leadSource: lead.leadSource || 'LIV8 Solar Website' });
        openSolarProjectId = osProject.id.toString();
      }
    } catch (e) { console.error('OpenSolar failed:', e); }

    res.json({ ...lead, openSolarProjectId });
  } catch (error) {
    console.error("Failed to create lead:", error);
    if (error instanceof z.ZodError) { res.status(400).json({ message: "Invalid lead data", errors: error.errors }); }
    else { res.status(500).json({ message: "Failed to create lead" }); }
  }
});

// Get all leads
app.get("/api/leads", async (_req: Request, res: Response) => {
  try {
    const leads = await storage.getLeads();
    const leadsWithDetails = await Promise.all(leads.map(async (lead) => {
      const calculations = await storage.getCalculationsByLeadId(lead.id);
      const consultations = await storage.getConsultationsByLeadId(lead.id);
      return { ...lead, calculations, consultations };
    }));
    res.json(leadsWithDetails);
  } catch (error) { res.status(500).json({ message: "Failed to fetch leads" }); }
});

app.get("/api/leads/:id", async (req: Request, res: Response) => {
  try {
    const lead = await storage.getLeadById(parseInt(req.params.id));
    if (!lead) { res.status(404).json({ message: "Lead not found" }); return; }
    res.json(lead);
  } catch (error) { res.status(500).json({ message: "Failed to fetch lead" }); }
});

// Solar calculations
app.post("/api/solar-calculations", async (req: Request, res: Response) => {
  try {
    const calculationData = insertSolarCalculationSchema.parse(req.body);
    const monthlyBill = parseFloat(calculationData.monthlyBill || "0");
    const monthlySavings = Math.round(monthlyBill * 0.85);
    const yearOneSavings = monthlySavings * 12;
    const twentyYearSavings = yearOneSavings * 18;
    const systemKw = Math.round(((monthlyBill * 12 / 0.12) / 1400) * 10) / 10;
    const calculation = await storage.createSolarCalculation({
      ...calculationData, monthlySavings: monthlySavings.toString(), yearOneSavings: yearOneSavings.toString(),
      twentyYearSavings: twentyYearSavings.toString(), systemSize: `${systemKw}kW`,
    });
    try { await sendEmail({ to: 'info@liv8solar.com', from: 'noreply@liv8solar.com', ...emailTemplates.solarCalculation(calculation) }); } catch {}
    try { await sendToTaskMagic(formatLeadForTaskMagic({ id: 0, firstName: 'Anonymous', lastName: 'User', email: 'unknown@email.com', phone: 'unknown', createdAt: new Date().toISOString() }, 'solar_calculation', calculation)); } catch {}
    res.json(calculation);
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ message: "Invalid calculation data", errors: error.errors }); }
    else { res.status(500).json({ message: "Failed to create calculation" }); }
  }
});

// Consultations
app.post("/api/consultations", async (req: Request, res: Response) => {
  try {
    const consultation = await storage.createConsultation(insertConsultationSchema.parse(req.body));
    const lead = consultation.leadId ? await storage.getLeadById(consultation.leadId) : null;
    if (lead) {
      try { await sendEmail({ to: 'info@liv8solar.com', from: 'noreply@liv8solar.com', ...emailTemplates.consultation(consultation, lead) }); } catch {}
      try { await sendToTaskMagic(formatLeadForTaskMagic(lead, 'consultation_scheduled', null)); } catch {}
    }
    res.json(consultation);
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ message: "Invalid consultation data", errors: error.errors }); }
    else { res.status(500).json({ message: "Failed to schedule consultation" }); }
  }
});

// User management
app.get('/api/users', async (_req, res) => { try { res.json(await storage.getUsersByRole('')); } catch { res.status(500).json({ message: 'Failed' }); } });
app.patch('/api/users/:id', async (req, res) => { try { const u = await storage.updateUser(parseInt(req.params.id), req.body); if (!u) { res.status(404).json({ message: 'Not found' }); return; } res.json(u); } catch { res.status(500).json({ message: 'Failed' }); } });

// Projects
app.get('/api/projects/client/:clientId', async (req, res) => { try { res.json(await storage.getProjectsByClientId(parseInt(req.params.clientId))); } catch { res.status(500).json({ message: 'Failed' }); } });
app.get('/api/projects/rep/:repId', async (req, res) => { try { res.json(await storage.getProjectsByRepId(parseInt(req.params.repId))); } catch { res.status(500).json({ message: 'Failed' }); } });
app.patch('/api/projects/:id', async (req, res) => { try { const p = await storage.updateProject(parseInt(req.params.id), req.body); if (!p) { res.status(404).json({ message: 'Not found' }); return; } res.json(p); } catch { res.status(500).json({ message: 'Failed' }); } });

// Tasks
app.post('/api/tasks', async (req, res) => { try { res.json(await storage.createTask(req.body)); } catch { res.status(500).json({ message: 'Failed' }); } });
app.get('/api/tasks/rep/:repId', async (req, res) => { try { res.json(await storage.getTasksByRepId(parseInt(req.params.repId))); } catch { res.status(500).json({ message: 'Failed' }); } });
app.patch('/api/tasks/:id', async (req, res) => { try { const t = await storage.updateTask(parseInt(req.params.id), req.body); if (!t) { res.status(404).json({ message: 'Not found' }); return; } res.json(t); } catch { res.status(500).json({ message: 'Failed' }); } });

// Installation updates
app.post('/api/installation-updates', async (req, res) => { try { res.json(await storage.createInstallationUpdate(req.body)); } catch { res.status(500).json({ message: 'Failed' }); } });
app.get('/api/installation-updates/project/:projectId', async (req, res) => { try { res.json(await storage.getInstallationUpdatesByProjectId(parseInt(req.params.projectId))); } catch { res.status(500).json({ message: 'Failed' }); } });

// Project completion
app.post('/api/projects/:id/complete', async (req, res) => {
  try {
    const project = await storage.updateProject(parseInt(req.params.id), { installationStatus: 'completed', installationProgress: 100, actualCompletionDate: new Date() });
    if (!project) { res.status(404).json({ message: 'Not found' }); return; }
    const lead = project.leadId ? await storage.getLeadById(project.leadId) : null;
    if (lead && req.body.totalValue) { await trackProjectSale(lead.email, req.body.totalValue, req.params.id); }
    res.json({ message: 'Complete', project });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// Admin stats
app.get('/api/admin/stats', async (_req, res) => {
  try {
    const leads = await storage.getLeads();
    const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
    const leadsThisMonth = leads.filter(l => new Date(l.createdAt) >= thisMonth).length;
    res.json({ totalLeads: leads.length, leadsThisMonth, totalRevenue: leads.length * 25000, activeProjects: Math.floor(leads.length * 0.3), conversionRate: leads.length ? 30 : 0, revenueThisMonth: leadsThisMonth * 25000 });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

app.post('/api/admin/export-to-sheets', async (req, res) => {
  try { const ok = await sendToGoogleSheets(formatLeadForGoogleSheets(req.body)); if (ok) res.json({ message: 'OK' }); else res.status(500).json({ message: 'Failed' }); }
  catch { res.status(500).json({ message: 'Failed' }); }
});

// Messages
app.post('/api/messages', async (req, res) => { try { res.json(await storage.createMessage(req.body)); } catch { res.status(500).json({ message: 'Failed' }); } });
app.get('/api/messages/project/:projectId', async (req, res) => { try { res.json(await storage.getMessagesByProjectId(parseInt(req.params.projectId))); } catch { res.status(500).json({ message: 'Failed' }); } });

// Google Solar API
app.post('/api/solar-insights', async (req, res) => {
  try { if (!req.body.address) { res.status(400).json({ message: 'Address required' }); return; } if (!isGoogleSolarConfigured()) { res.status(503).json({ configured: false }); return; } res.json(await getSolarInsightsForAddress(req.body.address)); }
  catch (e: any) { res.status(500).json({ message: e.message || 'Failed' }); }
});
app.post('/api/solar-insights/bill-match', async (req, res) => {
  try { if (!req.body.address || !req.body.monthlyBill) { res.status(400).json({ message: 'Address and bill required' }); return; } if (!isGoogleSolarConfigured()) { res.status(503).json({ configured: false }); return; } res.json(await getSolarInsightsForBill(req.body.address, Number(req.body.monthlyBill))); }
  catch (e: any) { res.status(500).json({ message: e.message || 'Failed' }); }
});
app.get('/api/solar-insights/status', (_req, res) => { res.json({ configured: isGoogleSolarConfigured() }); });

// OpenSolar API
app.get('/api/opensolar/status', (_req, res) => { res.json({ configured: isOpenSolarConfigured() }); });
app.get('/api/opensolar/projects/:projectId', async (req, res) => { try { if (!isOpenSolarConfigured()) { res.status(503).json({ message: 'Not configured' }); return; } res.json(await getProject(parseInt(req.params.projectId))); } catch (e: any) { res.status(500).json({ message: e.message || 'Failed' }); } });
app.get('/api/opensolar/projects/:projectId/summary', async (req, res) => { try { if (!isOpenSolarConfigured()) { res.status(503).json({ message: 'Not configured' }); return; } res.json(await getProjectSummary(parseInt(req.params.projectId))); } catch (e: any) { res.status(500).json({ message: e.message || 'Failed' }); } });
app.get('/api/opensolar/projects/:projectId/systems', async (req, res) => { try { if (!isOpenSolarConfigured()) { res.status(503).json({ message: 'Not configured' }); return; } res.json(await getSystemDetails(parseInt(req.params.projectId))); } catch (e: any) { res.status(500).json({ message: e.message || 'Failed' }); } });
app.get('/api/opensolar/projects', async (_req, res) => { try { if (!isOpenSolarConfigured()) { res.status(503).json({ message: 'Not configured' }); return; } res.json(await listProjects()); } catch (e: any) { res.status(500).json({ message: e.message || 'Failed' }); } });
app.post('/api/opensolar/prospects', async (req, res) => {
  try { if (!isOpenSolarConfigured()) { res.status(503).json({ message: 'Not configured' }); return; } const lead = await storage.getLeadById(parseInt(req.body.leadId)); if (!lead) { res.status(404).json({ message: 'Lead not found' }); return; }
  const p = await createProspect({ firstName: lead.firstName, lastName: lead.lastName, email: lead.email, phone: lead.phone, address: lead.address || undefined, monthlyBill: lead.monthlyBill?.toString(), homeSize: lead.homeSize || undefined, roofType: lead.roofType || undefined, leadSource: lead.leadSource || 'LIV8 Solar Website' });
  res.json({ openSolarProjectId: p.id, leadId: lead.id }); } catch (e: any) { res.status(500).json({ message: e.message || 'Failed' }); }
});
app.post('/api/webhooks/opensolar', async (req, res) => {
  try { const p = req.body; if (p.model_name === 'project' && p.event_type === 'UPDATE' && p.model_pk) { await sendToTaskMagic(formatLeadForTaskMagic({ id: 0, firstName: 'OpenSolar', lastName: 'Update', email: '', phone: '', createdAt: new Date().toISOString() }, 'opensolar_project_update', { openSolarProjectId: p.model_pk.toString(), ...p })); } res.json({ received: true }); }
  catch { res.status(500).json({ message: 'Failed' }); }
});

export default app;
