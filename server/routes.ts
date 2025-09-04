import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertSolarCalculationSchema, insertConsultationSchema } from "@shared/schema";
import { sendEmail, emailTemplates } from "./sendgrid";
import { getPushLapAPI } from "./pushLap";
import { sendToGoogleSheets, formatLeadForGoogleSheets } from "./googleSheets";
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
      
      // Track Push Lap referral
      const pushLapAPI = getPushLapAPI();
      if (pushLapAPI) {
        await pushLapAPI.trackReferral({
          name: `${lead.firstName} ${lead.lastName}`,
          email: lead.email,
          referredUserExternalId: lead.id.toString(),
          plan: 'solar_lead',
          status: 'new',
        });
      }
      
      // Send to Google Sheets
      const sheetsData = formatLeadForGoogleSheets(lead);
      await sendToGoogleSheets(sheetsData);
      
      res.json(lead);
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
      
      // Basic calculation formulas (simplified)
      const monthlySavings = Math.round(monthlyBill * 0.85); // 85% savings estimate
      const yearOneSavings = monthlySavings * 12;
      const twentyYearSavings = yearOneSavings * 18; // Account for rate increases
      const systemSize = `${Math.ceil((monthlyBill * 12) / 1200)}kW`; // Rough estimate
      
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

  const httpServer = createServer(app);
  return httpServer;
}
