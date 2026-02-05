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

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create lead
app.post("/api/leads", async (req: Request, res: Response) => {
  try {
    const leadData = insertLeadSchema.parse(req.body);
    const lead = await storage.createLead(leadData);

    console.log("NEW LEAD SUBMITTED:", { id: lead.id, name: `${lead.firstName} ${lead.lastName}` });

    // Send email notification
    const emailTemplate = emailTemplates.newLead(lead);
    await sendEmail({
      to: 'info@liv8solar.com',
      from: 'noreply@liv8solar.com',
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    // Track Push Lap referral
    const pushLapAPI = getPushLapAPI();
    if (pushLapAPI) {
      const affiliateId = extractAffiliateId(req);
      await pushLapAPI.trackReferral({
        affiliateId,
        name: `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        referredUserExternalId: lead.id.toString(),
        plan: 'solar_lead',
        status: 'new_referral',
      });
    }

    // Send to Google Sheets
    const sheetsData = formatLeadForGoogleSheets(lead);
    await sendToGoogleSheets(sheetsData);

    // Send to TaskMagic webhook
    const taskMagicData = formatLeadForTaskMagic(lead, 'lead_submission');
    await sendToTaskMagic(taskMagicData);

    // Auto-create prospect in OpenSolar
    let openSolarProjectId: string | undefined;
    if (isOpenSolarConfigured()) {
      try {
        const osProject = await createProspect({
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          address: lead.address || undefined,
          monthlyBill: lead.monthlyBill?.toString(),
          homeSize: lead.homeSize || undefined,
          roofType: lead.roofType || undefined,
          leadSource: lead.leadSource || 'LIV8 Solar Website',
        });
        openSolarProjectId = osProject.id.toString();
      } catch (osError) {
        console.error('OpenSolar prospect creation failed:', osError);
      }
    }

    res.json({ ...lead, openSolarProjectId });
  } catch (error) {
    console.error("Failed to create lead:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid lead data", errors: error.errors });
    } else {
      res.status(500).json({ message: "Failed to create lead" });
    }
  }
});

// Get all leads
app.get("/api/leads", async (_req: Request, res: Response) => {
  try {
    const leads = await storage.getLeads();
    const leadsWithDetails = await Promise.all(
      leads.map(async (lead) => {
        const calculations = await storage.getCalculationsByLeadId(lead.id);
        const consultations = await storage.getConsultationsByLeadId(lead.id);
        return { ...lead, calculations, consultations };
      })
    );
    res.json(leadsWithDetails);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch leads" });
  }
});

// Get lead by ID
app.get("/api/leads/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const lead = await storage.getLeadById(id);
    if (!lead) { res.status(404).json({ message: "Lead not found" }); return; }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch lead" });
  }
});

// Create solar calculation
app.post("/api/solar-calculations", async (req: Request, res: Response) => {
  try {
    const calculationData = insertSolarCalculationSchema.parse(req.body);
    const monthlyBill = parseFloat(calculationData.monthlyBill || "0");

    const monthlySavings = Math.round(monthlyBill * 0.85);
    const yearOneSavings = monthlySavings * 12;
    const twentyYearSavings = yearOneSavings * 18;
    const annualBill = monthlyBill * 12;
    const annualKwh = annualBill / 0.12;
    const systemKw = Math.round((annualKwh / 1400) * 10) / 10;
    const systemSize = `${systemKw}kW`;

    const calculationWithResults = {
      ...calculationData,
      monthlySavings: monthlySavings.toString(),
      yearOneSavings: yearOneSavings.toString(),
      twentyYearSavings: twentyYearSavings.toString(),
      systemSize,
    };

    const calculation = await storage.createSolarCalculation(calculationWithResults);

    const emailTemplate = emailTemplates.solarCalculation(calculation);
    await sendEmail({
      to: 'info@liv8solar.com',
      from: 'noreply@liv8solar.com',
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    const taskMagicCalcData = formatLeadForTaskMagic(
      { id: 0, firstName: 'Anonymous', lastName: 'User', email: 'unknown@email.com', phone: 'unknown', createdAt: new Date().toISOString() },
      'solar_calculation', calculation
    );
    await sendToTaskMagic(taskMagicCalcData);

    res.json(calculation);
  } catch (error) {
    console.error("Failed to create solar calculation:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid calculation data", errors: error.errors });
    } else {
      res.status(500).json({ message: "Failed to create calculation" });
    }
  }
});

// Schedule consultation
app.post("/api/consultations", async (req: Request, res: Response) => {
  try {
    const consultationData = insertConsultationSchema.parse(req.body);
    const consultation = await storage.createConsultation(consultationData);
    const lead = consultation.leadId ? await storage.getLeadById(consultation.leadId) : null;

    if (lead) {
      const emailTemplate = emailTemplates.consultation(consultation, lead);
      await sendEmail({
        to: 'info@liv8solar.com',
        from: 'noreply@liv8solar.com',
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
      const taskMagicConsultData = formatLeadForTaskMagic(lead, 'consultation_scheduled', null);
      await sendToTaskMagic(taskMagicConsultData);
    }

    res.json(consultation);
  } catch (error) {
    console.error("Failed to schedule consultation:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid consultation data", errors: error.errors });
    } else {
      res.status(500).json({ message: "Failed to schedule consultation" });
    }
  }
});

// User management
app.get('/api/users', async (_req: Request, res: Response) => {
  try { res.json(await storage.getUsersByRole('')); }
  catch (error) { res.status(500).json({ message: 'Failed to fetch users' }); }
});

app.patch('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await storage.updateUser(parseInt(req.params.id), req.body);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json(user);
  } catch (error) { res.status(500).json({ message: 'Failed to update user' }); }
});

// Projects
app.get('/api/projects/client/:clientId', async (req: Request, res: Response) => {
  try { res.json(await storage.getProjectsByClientId(parseInt(req.params.clientId))); }
  catch (error) { res.status(500).json({ message: 'Failed to fetch client projects' }); }
});

app.get('/api/projects/rep/:repId', async (req: Request, res: Response) => {
  try { res.json(await storage.getProjectsByRepId(parseInt(req.params.repId))); }
  catch (error) { res.status(500).json({ message: 'Failed to fetch rep projects' }); }
});

app.patch('/api/projects/:id', async (req: Request, res: Response) => {
  try {
    const project = await storage.updateProject(parseInt(req.params.id), req.body);
    if (!project) { res.status(404).json({ message: 'Project not found' }); return; }
    res.json(project);
  } catch (error) { res.status(500).json({ message: 'Failed to update project' }); }
});

// Tasks
app.post('/api/tasks', async (req: Request, res: Response) => {
  try { res.json(await storage.createTask(req.body)); }
  catch (error) { res.status(500).json({ message: 'Failed to create task' }); }
});

app.get('/api/tasks/rep/:repId', async (req: Request, res: Response) => {
  try { res.json(await storage.getTasksByRepId(parseInt(req.params.repId))); }
  catch (error) { res.status(500).json({ message: 'Failed to fetch tasks' }); }
});

app.patch('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const task = await storage.updateTask(parseInt(req.params.id), req.body);
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    res.json(task);
  } catch (error) { res.status(500).json({ message: 'Failed to update task' }); }
});

// Installation updates
app.post('/api/installation-updates', async (req: Request, res: Response) => {
  try { res.json(await storage.createInstallationUpdate(req.body)); }
  catch (error) { res.status(500).json({ message: 'Failed to create installation update' }); }
});

app.get('/api/installation-updates/project/:projectId', async (req: Request, res: Response) => {
  try { res.json(await storage.getInstallationUpdatesByProjectId(parseInt(req.params.projectId))); }
  catch (error) { res.status(500).json({ message: 'Failed to fetch installation updates' }); }
});

// Project completion
app.post('/api/projects/:id/complete', async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const { totalValue } = req.body;
    const project = await storage.updateProject(projectId, {
      installationStatus: 'completed',
      installationProgress: 100,
      actualCompletionDate: new Date(),
    });
    if (!project) { res.status(404).json({ message: 'Project not found' }); return; }

    const lead = project.leadId ? await storage.getLeadById(project.leadId) : null;
    if (lead && totalValue) {
      await trackProjectSale(lead.email, totalValue, projectId.toString());
    }
    res.json({ message: 'Project marked as complete', project });
  } catch (error) { res.status(500).json({ message: 'Failed to complete project' }); }
});

// Admin stats
app.get('/api/admin/stats', async (_req: Request, res: Response) => {
  try {
    const leads = await storage.getLeads();
    const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
    const leadsThisMonth = leads.filter(lead => new Date(lead.createdAt) >= thisMonth).length;
    res.json({
      totalLeads: leads.length, leadsThisMonth,
      totalRevenue: leads.length * 25000, activeProjects: Math.floor(leads.length * 0.3),
      conversionRate: leads.length ? 30 : 0, revenueThisMonth: leadsThisMonth * 25000,
    });
  } catch (error) { res.status(500).json({ message: 'Failed to fetch stats' }); }
});

app.post('/api/admin/export-to-sheets', async (req: Request, res: Response) => {
  try {
    const sheetsData = formatLeadForGoogleSheets(req.body);
    const success = await sendToGoogleSheets(sheetsData);
    if (success) { res.json({ message: 'Exported successfully' }); }
    else { res.status(500).json({ message: 'Failed to export' }); }
  } catch (error) { res.status(500).json({ message: 'Export failed' }); }
});

// Messages
app.post('/api/messages', async (req: Request, res: Response) => {
  try { res.json(await storage.createMessage(req.body)); }
  catch (error) { res.status(500).json({ message: 'Failed to send message' }); }
});

app.get('/api/messages/project/:projectId', async (req: Request, res: Response) => {
  try { res.json(await storage.getMessagesByProjectId(parseInt(req.params.projectId))); }
  catch (error) { res.status(500).json({ message: 'Failed to fetch messages' }); }
});

// Google Solar API
app.post('/api/solar-insights', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;
    if (!address) { res.status(400).json({ message: 'Address is required' }); return; }
    if (!isGoogleSolarConfigured()) { res.status(503).json({ message: 'Google Solar API not configured', configured: false }); return; }
    res.json(await getSolarInsightsForAddress(address));
  } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to get solar insights' }); }
});

app.post('/api/solar-insights/bill-match', async (req: Request, res: Response) => {
  try {
    const { address, monthlyBill } = req.body;
    if (!address) { res.status(400).json({ message: 'Address is required' }); return; }
    if (!monthlyBill || isNaN(Number(monthlyBill))) { res.status(400).json({ message: 'Valid monthly bill required' }); return; }
    if (!isGoogleSolarConfigured()) { res.status(503).json({ message: 'Google Solar API not configured', configured: false }); return; }
    res.json(await getSolarInsightsForBill(address, Number(monthlyBill)));
  } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to get solar insights' }); }
});

app.get('/api/solar-insights/status', (_req: Request, res: Response) => {
  res.json({ configured: isGoogleSolarConfigured() });
});

// OpenSolar API
app.get('/api/opensolar/status', (_req: Request, res: Response) => {
  res.json({ configured: isOpenSolarConfigured() });
});

app.get('/api/opensolar/projects/:projectId', async (req: Request, res: Response) => {
  try {
    if (!isOpenSolarConfigured()) { res.status(503).json({ message: 'OpenSolar not configured' }); return; }
    res.json(await getProject(parseInt(req.params.projectId)));
  } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to fetch project' }); }
});

app.get('/api/opensolar/projects/:projectId/summary', async (req: Request, res: Response) => {
  try {
    if (!isOpenSolarConfigured()) { res.status(503).json({ message: 'OpenSolar not configured' }); return; }
    res.json(await getProjectSummary(parseInt(req.params.projectId)));
  } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to fetch project summary' }); }
});

app.get('/api/opensolar/projects/:projectId/systems', async (req: Request, res: Response) => {
  try {
    if (!isOpenSolarConfigured()) { res.status(503).json({ message: 'OpenSolar not configured' }); return; }
    res.json(await getSystemDetails(parseInt(req.params.projectId)));
  } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to fetch systems' }); }
});

app.get('/api/opensolar/projects', async (_req: Request, res: Response) => {
  try {
    if (!isOpenSolarConfigured()) { res.status(503).json({ message: 'OpenSolar not configured' }); return; }
    res.json(await listProjects());
  } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to list projects' }); }
});

app.post('/api/opensolar/prospects', async (req: Request, res: Response) => {
  try {
    if (!isOpenSolarConfigured()) { res.status(503).json({ message: 'OpenSolar not configured' }); return; }
    const lead = await storage.getLeadById(parseInt(req.body.leadId));
    if (!lead) { res.status(404).json({ message: 'Lead not found' }); return; }
    const osProject = await createProspect({
      firstName: lead.firstName, lastName: lead.lastName,
      email: lead.email, phone: lead.phone,
      address: lead.address || undefined,
      monthlyBill: lead.monthlyBill?.toString(),
      homeSize: lead.homeSize || undefined,
      roofType: lead.roofType || undefined,
      leadSource: lead.leadSource || 'LIV8 Solar Website',
    });
    res.json({ openSolarProjectId: osProject.id, openSolarIdentifier: osProject.identifier, leadId: lead.id });
  } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to create prospect' }); }
});

app.post('/api/webhooks/opensolar', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    console.log('OpenSolar webhook received:', JSON.stringify(payload).substring(0, 200));
    if (payload.model_name === 'project' && payload.event_type === 'UPDATE') {
      const osProjectId = payload.model_pk?.toString();
      if (osProjectId) {
        const taskMagicData = formatLeadForTaskMagic(
          { id: 0, firstName: 'OpenSolar', lastName: 'Update', email: '', phone: '', createdAt: new Date().toISOString() },
          'opensolar_project_update', { openSolarProjectId: osProjectId, ...payload }
        );
        await sendToTaskMagic(taskMagicData);
      }
    }
    res.json({ received: true });
  } catch (error) { res.status(500).json({ message: 'Webhook processing failed' }); }
});

export default app;
