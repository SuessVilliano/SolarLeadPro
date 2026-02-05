import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertSolarCalculationSchema, insertConsultationSchema } from "@shared/schema";
import { sendEmail, emailTemplates } from "./sendgrid";
import { getPushLapAPI, extractAffiliateId, trackProjectSale } from "./pushLap";
import { sendToGoogleSheets, formatLeadForGoogleSheets } from "./googleSheets";
import { sendToTaskMagic, formatLeadForTaskMagic } from "./taskMagicWebhook";
import { getSolarInsightsForAddress, getSolarInsightsForBill, isGoogleSolarConfigured } from "./googleSolarApi";
import { createProspect, getProject, getProjectSummary, getSystemDetails, isOpenSolarConfigured, listProjects } from "./openSolarApi";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create lead
  app.post("/api/leads", async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      
      // Log the new lead submission for tracking
      console.log("🌟 NEW LEAD SUBMITTED:", {
        id: lead.id,
        name: `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        phone: lead.phone,
        source: lead.leadSource,
        timestamp: new Date().toISOString(),
      });
      
      // Send email notification
      const emailTemplate = emailTemplates.newLead(lead);
      await sendEmail({
        to: 'info@liv8solar.com', // Replace with your notification email
        from: 'noreply@liv8solar.com', // Replace with your from email
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
      
      // Track Push Lap referral with affiliate ID from request
      const pushLapAPI = getPushLapAPI();
      if (pushLapAPI) {
        const affiliateId = extractAffiliateId(req);
        await pushLapAPI.trackReferral({
          affiliateId: affiliateId,
          name: `${lead.firstName} ${lead.lastName}`,
          email: lead.email,
          referredUserExternalId: lead.id.toString(),
          plan: 'solar_lead',
          status: 'new_referral',
        });
        
        // Log referral attempt for debugging
        console.log('🔗 Push Lap referral tracked:', {
          affiliateId,
          leadEmail: lead.email,
          leadId: lead.id
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
          console.log('OpenSolar prospect created:', { openSolarId: osProject.id, leadId: lead.id });
        } catch (osError) {
          console.error('OpenSolar prospect creation failed (non-blocking):', osError);
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

  // Get all leads (for admin access)
  app.get("/api/leads", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      // Include calculations and consultations for each lead
      const leadsWithDetails = await Promise.all(
        leads.map(async (lead) => {
          const calculations = await storage.getCalculationsByLeadId(lead.id);
          const consultations = await storage.getConsultationsByLeadId(lead.id);
          return {
            ...lead,
            calculations,
            consultations,
          };
        })
      );
      res.json(leadsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // Get lead by ID
  app.get("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.getLeadById(id);
      if (!lead) {
        res.status(404).json({ message: "Lead not found" });
        return;
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  // Create solar calculation
  app.post("/api/solar-calculations", async (req, res) => {
    try {
      const calculationData = insertSolarCalculationSchema.parse(req.body);
      
      // Simple solar calculation logic
      const monthlyBill = parseFloat(calculationData.monthlyBill || "0");
      const homeSize = calculationData.homeSize || 2000;
      
      // Improved solar calculation formulas
      const monthlySavings = Math.round(monthlyBill * 0.85); // 85% savings estimate
      const yearOneSavings = monthlySavings * 12;
      const twentyYearSavings = yearOneSavings * 18; // Account for rate increases
      
      // More accurate system sizing based on home size, location, and energy usage
      const annualBill = monthlyBill * 12;
      const annualKwh = annualBill / 0.12; // Assume $0.12/kWh average rate
      const systemKw = Math.round((annualKwh / 1400) * 10) / 10; // 1400 kWh per kW annually (national average)
      const systemSize = `${systemKw}kW`;
      
      const calculationWithResults = {
        ...calculationData,
        monthlySavings: monthlySavings.toString(),
        yearOneSavings: yearOneSavings.toString(),
        twentyYearSavings: twentyYearSavings.toString(),
        systemSize,
      };
      
      const calculation = await storage.createSolarCalculation(calculationWithResults);
      
      // Log the solar calculation for tracking
      console.log("💡 SOLAR CALCULATION PERFORMED:", {
        id: calculation.id,
        monthlyBill: monthlyBill,
        monthlySavings: monthlySavings,
        yearOneSavings: yearOneSavings,
        systemSize: systemSize,
        timestamp: new Date().toISOString(),
      });
      
      // Send email notification for calculation
      const emailTemplate = emailTemplates.solarCalculation(calculation);
      await sendEmail({
        to: 'info@liv8solar.com', // Replace with your notification email
        from: 'noreply@liv8solar.com', // Replace with your from email
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
      
      // Send calculation to TaskMagic webhook
      const taskMagicCalcData = formatLeadForTaskMagic({ id: 0, firstName: 'Anonymous', lastName: 'User', email: 'unknown@email.com', phone: 'unknown', createdAt: new Date().toISOString() }, 'solar_calculation', calculation);
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
  app.post("/api/consultations", async (req, res) => {
    try {
      const consultationData = insertConsultationSchema.parse(req.body);
      const consultation = await storage.createConsultation(consultationData);
      
      // Get the lead data for the email
      const lead = consultation.leadId ? await storage.getLeadById(consultation.leadId) : null;
      
      // Log the consultation request for tracking
      console.log("📅 CONSULTATION SCHEDULED:", {
        id: consultation.id,
        leadId: consultation.leadId,
        status: consultation.status,
        notes: consultation.notes,
        timestamp: new Date().toISOString(),
      });
      
      // Send email notification for consultation
      if (lead) {
        const emailTemplate = emailTemplates.consultation(consultation, lead);
        await sendEmail({
          to: 'info@liv8solar.com', // Replace with your notification email
          from: 'noreply@liv8solar.com', // Replace with your from email
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });
        
        // Send consultation to TaskMagic webhook
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

  // Dashboard API routes for multi-role access
  
  // User management routes
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getUsersByRole(''); // Get all users
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.patch('/api/users/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Project management routes
  app.get('/api/projects/client/:clientId', async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const projects = await storage.getProjectsByClientId(clientId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch client projects' });
    }
  });

  app.get('/api/projects/rep/:repId', async (req, res) => {
    try {
      const repId = parseInt(req.params.repId);
      const projects = await storage.getProjectsByRepId(repId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch rep projects' });
    }
  });

  app.patch('/api/projects/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const project = await storage.updateProject(id, updates);
      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update project' });
    }
  });

  // Task management routes (CRM)
  app.post('/api/tasks', async (req, res) => {
    try {
      const taskData = req.body;
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create task' });
    }
  });

  app.get('/api/tasks/rep/:repId', async (req, res) => {
    try {
      const repId = parseInt(req.params.repId);
      const tasks = await storage.getTasksByRepId(repId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tasks' });
    }
  });

  app.patch('/api/tasks/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const task = await storage.updateTask(id, updates);
      if (!task) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update task' });
    }
  });

  // Installation updates routes
  app.post('/api/installation-updates', async (req, res) => {
    try {
      const updateData = req.body;
      const update = await storage.createInstallationUpdate(updateData);
      res.json(update);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create installation update' });
    }
  });

  app.get('/api/installation-updates/project/:projectId', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const updates = await storage.getInstallationUpdatesByProjectId(projectId);
      res.json(updates);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch installation updates' });
    }
  });

  // Project sale tracking for Push Lap payouts
  app.post('/api/projects/:id/complete', async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { totalValue } = req.body;
      
      const project = await storage.updateProject(projectId, {
        installationStatus: 'completed',
        installationProgress: 100,
        actualCompletionDate: new Date(),
      });
      
      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }
      
      // Get the lead associated with this project for Push Lap tracking
      const lead = project.leadId ? await storage.getLeadById(project.leadId) : null;
      
      if (lead && totalValue) {
        // Track the sale/completion for affiliate payout
        const saleTracked = await trackProjectSale(
          lead.email,
          totalValue,
          projectId.toString()
        );
        
        console.log('💰 Project completion tracked for affiliate payout:', {
          projectId,
          leadEmail: lead.email,
          totalValue,
          saleTracked
        });
      }
      
      res.json({ message: 'Project marked as complete', project });
    } catch (error) {
      res.status(500).json({ message: 'Failed to complete project' });
    }
  });

  // Admin-specific routes
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const leads = await storage.getLeads();
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const leadsThisMonth = leads.filter(lead => 
        new Date(lead.createdAt) >= thisMonth
      ).length;
      
      const stats = {
        totalLeads: leads.length,
        leadsThisMonth,
        totalRevenue: leads.length * 25000, // Estimated revenue per lead
        activeProjects: Math.floor(leads.length * 0.3), // 30% conversion estimate
        conversionRate: leads.length ? 30 : 0,
        revenueThisMonth: leadsThisMonth * 25000,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  app.post('/api/admin/export-to-sheets', async (req, res) => {
    try {
      const leadData = req.body;
      const sheetsData = formatLeadForGoogleSheets(leadData);
      const success = await sendToGoogleSheets(sheetsData);
      
      if (success) {
        res.json({ message: 'Data exported to Google Sheets successfully' });
      } else {
        res.status(500).json({ message: 'Failed to export to Google Sheets' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Export failed' });
    }
  });

  // Message/Communication routes
  app.post('/api/messages', async (req, res) => {
    try {
      const messageData = req.body;
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  app.get('/api/messages/project/:projectId', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const messages = await storage.getMessagesByProjectId(projectId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  // ============================================
  // Google Solar API Routes
  // ============================================

  // Get solar insights for an address (uses Google Solar API + Geocoding)
  app.post('/api/solar-insights', async (req, res) => {
    try {
      const { address } = req.body;
      if (!address || typeof address !== 'string') {
        res.status(400).json({ message: 'Address is required' });
        return;
      }

      if (!isGoogleSolarConfigured()) {
        res.status(503).json({ message: 'Google Solar API not configured', configured: false });
        return;
      }

      const insights = await getSolarInsightsForAddress(address);
      res.json(insights);
    } catch (error: any) {
      console.error('Solar insights error:', error);
      res.status(500).json({ message: error.message || 'Failed to get solar insights' });
    }
  });

  // Get solar insights matched to a specific monthly bill amount
  app.post('/api/solar-insights/bill-match', async (req, res) => {
    try {
      const { address, monthlyBill } = req.body;
      if (!address || typeof address !== 'string') {
        res.status(400).json({ message: 'Address is required' });
        return;
      }
      if (!monthlyBill || isNaN(Number(monthlyBill))) {
        res.status(400).json({ message: 'Valid monthly bill amount is required' });
        return;
      }

      if (!isGoogleSolarConfigured()) {
        res.status(503).json({ message: 'Google Solar API not configured', configured: false });
        return;
      }

      const insights = await getSolarInsightsForBill(address, Number(monthlyBill));
      res.json(insights);
    } catch (error: any) {
      console.error('Solar bill-match insights error:', error);
      res.status(500).json({ message: error.message || 'Failed to get solar insights' });
    }
  });

  // Check if Google Solar API is available
  app.get('/api/solar-insights/status', (_req, res) => {
    res.json({ configured: isGoogleSolarConfigured() });
  });

  // ============================================
  // OpenSolar API Routes
  // ============================================

  // Check OpenSolar integration status
  app.get('/api/opensolar/status', (_req, res) => {
    res.json({ configured: isOpenSolarConfigured() });
  });

  // Get OpenSolar project details by opensolar project ID
  app.get('/api/opensolar/projects/:projectId', async (req, res) => {
    try {
      if (!isOpenSolarConfigured()) {
        res.status(503).json({ message: 'OpenSolar not configured', configured: false });
        return;
      }

      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        res.status(400).json({ message: 'Invalid project ID' });
        return;
      }

      const project = await getProject(projectId);
      res.json(project);
    } catch (error: any) {
      console.error('OpenSolar get project error:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch OpenSolar project' });
    }
  });

  // Get full project summary with systems, panels, batteries, etc.
  app.get('/api/opensolar/projects/:projectId/summary', async (req, res) => {
    try {
      if (!isOpenSolarConfigured()) {
        res.status(503).json({ message: 'OpenSolar not configured', configured: false });
        return;
      }

      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        res.status(400).json({ message: 'Invalid project ID' });
        return;
      }

      const summary = await getProjectSummary(projectId);
      res.json(summary);
    } catch (error: any) {
      console.error('OpenSolar project summary error:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch project summary' });
    }
  });

  // Get system details for an OpenSolar project
  app.get('/api/opensolar/projects/:projectId/systems', async (req, res) => {
    try {
      if (!isOpenSolarConfigured()) {
        res.status(503).json({ message: 'OpenSolar not configured', configured: false });
        return;
      }

      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        res.status(400).json({ message: 'Invalid project ID' });
        return;
      }

      const systems = await getSystemDetails(projectId);
      res.json(systems);
    } catch (error: any) {
      console.error('OpenSolar systems error:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch system details' });
    }
  });

  // List all OpenSolar projects (admin)
  app.get('/api/opensolar/projects', async (_req, res) => {
    try {
      if (!isOpenSolarConfigured()) {
        res.status(503).json({ message: 'OpenSolar not configured', configured: false });
        return;
      }

      const projects = await listProjects();
      res.json(projects);
    } catch (error: any) {
      console.error('OpenSolar list projects error:', error);
      res.status(500).json({ message: error.message || 'Failed to list OpenSolar projects' });
    }
  });

  // Manually create an OpenSolar prospect from an existing lead
  app.post('/api/opensolar/prospects', async (req, res) => {
    try {
      if (!isOpenSolarConfigured()) {
        res.status(503).json({ message: 'OpenSolar not configured', configured: false });
        return;
      }

      const { leadId } = req.body;
      if (!leadId) {
        res.status(400).json({ message: 'leadId is required' });
        return;
      }

      const lead = await storage.getLeadById(parseInt(leadId));
      if (!lead) {
        res.status(404).json({ message: 'Lead not found' });
        return;
      }

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

      res.json({
        message: 'OpenSolar prospect created',
        openSolarProjectId: osProject.id,
        openSolarIdentifier: osProject.identifier,
        leadId: lead.id,
      });
    } catch (error: any) {
      console.error('OpenSolar manual prospect creation error:', error);
      res.status(500).json({ message: error.message || 'Failed to create OpenSolar prospect' });
    }
  });

  // OpenSolar webhook receiver (for receiving updates FROM OpenSolar)
  app.post('/api/webhooks/opensolar', async (req, res) => {
    try {
      const payload = req.body;
      console.log('OpenSolar webhook received:', JSON.stringify(payload).substring(0, 200));

      // Process different event types from OpenSolar
      const eventType = payload.event_type;
      const modelName = payload.model_name;

      if (modelName === 'project' && eventType === 'UPDATE') {
        // Sync project status updates back to our system
        const osProjectId = payload.model_pk?.toString();
        if (osProjectId) {
          // Find matching local project and update it
          const taskMagicData = formatLeadForTaskMagic(
            { id: 0, firstName: 'OpenSolar', lastName: 'Update', email: '', phone: '', createdAt: new Date().toISOString() },
            'opensolar_project_update',
            { openSolarProjectId: osProjectId, ...payload }
          );
          await sendToTaskMagic(taskMagicData);
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('OpenSolar webhook processing error:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
