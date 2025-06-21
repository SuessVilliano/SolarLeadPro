import { leads, consultations, solarCalculations, type Lead, type InsertLead, type SolarCalculation, type InsertSolarCalculation, type Consultation, type InsertConsultation } from "@shared/schema";

export interface IStorage {
  // Lead management
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(): Promise<Lead[]>;
  getLeadById(id: number): Promise<Lead | undefined>;
  
  // Solar calculations
  createSolarCalculation(calculation: InsertSolarCalculation): Promise<SolarCalculation>;
  getCalculationsByLeadId(leadId: number): Promise<SolarCalculation[]>;
  
  // Consultations
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  getConsultationsByLeadId(leadId: number): Promise<Consultation[]>;
}

export class MemStorage implements IStorage {
  private leads: Map<number, Lead>;
  private solarCalculations: Map<number, SolarCalculation>;
  private consultations: Map<number, Consultation>;
  private currentLeadId: number;
  private currentCalculationId: number;
  private currentConsultationId: number;

  constructor() {
    this.leads = new Map();
    this.solarCalculations = new Map();
    this.consultations = new Map();
    this.currentLeadId = 1;
    this.currentCalculationId = 1;
    this.currentConsultationId = 1;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.currentLeadId++;
    const lead: Lead = { 
      ...insertLead, 
      id,
      createdAt: new Date(),
    };
    this.leads.set(id, lead);
    return lead;
  }

  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  async getLeadById(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createSolarCalculation(insertCalculation: InsertSolarCalculation): Promise<SolarCalculation> {
    const id = this.currentCalculationId++;
    const calculation: SolarCalculation = {
      ...insertCalculation,
      id,
      createdAt: new Date(),
    };
    this.solarCalculations.set(id, calculation);
    return calculation;
  }

  async getCalculationsByLeadId(leadId: number): Promise<SolarCalculation[]> {
    return Array.from(this.solarCalculations.values()).filter(
      calc => calc.leadId === leadId
    );
  }

  async createConsultation(insertConsultation: InsertConsultation): Promise<Consultation> {
    const id = this.currentConsultationId++;
    const consultation: Consultation = {
      ...insertConsultation,
      id,
      createdAt: new Date(),
    };
    this.consultations.set(id, consultation);
    return consultation;
  }

  async getConsultationsByLeadId(leadId: number): Promise<Consultation[]> {
    return Array.from(this.consultations.values()).filter(
      consultation => consultation.leadId === leadId
    );
  }
}

export const storage = new MemStorage();
