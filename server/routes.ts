import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertSolarCalculationSchema, insertConsultationSchema } from "@shared/schema";
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
      
      // Log the consultation request for tracking
      console.log("📅 CONSULTATION SCHEDULED:", {
        id: consultation.id,
        leadId: consultation.leadId,
        status: consultation.status,
        notes: consultation.notes,
        timestamp: new Date().toISOString(),
      });
      
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

  const httpServer = createServer(app);
  return httpServer;
}
