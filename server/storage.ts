import { leads, consultations, solarCalculations, users, projects, installationUpdates, contracts, tasks, messages, type Lead, type InsertLead, type SolarCalculation, type InsertSolarCalculation, type Consultation, type InsertConsultation, type User, type InsertUser, type Project, type InsertProject, type InstallationUpdate, type InsertInstallationUpdate, type Contract, type InsertContract, type Task, type InsertTask, type Message, type InsertMessage } from "../shared/schema";

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
  
  // User management
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Project management
  createProject(project: InsertProject): Promise<Project>;
  getProjectById(id: number): Promise<Project | undefined>;
  getProjectsByClientId(clientId: number): Promise<Project[]>;
  getProjectsByRepId(repId: number): Promise<Project[]>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined>;
  
  // Installation updates
  createInstallationUpdate(update: InsertInstallationUpdate): Promise<InstallationUpdate>;
  getInstallationUpdatesByProjectId(projectId: number): Promise<InstallationUpdate[]>;
  
  // Contracts
  createContract(contract: InsertContract): Promise<Contract>;
  getContractsByProjectId(projectId: number): Promise<Contract[]>;
  
  // Tasks (CRM)
  createTask(task: InsertTask): Promise<Task>;
  getTasksByRepId(repId: number): Promise<Task[]>;
  getTasksByLeadId(leadId: number): Promise<Task[]>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByProjectId(projectId: number): Promise<Message[]>;
  getMessagesBetweenUsers(senderId: number, receiverId: number): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private leads: Map<number, Lead>;
  private solarCalculations: Map<number, SolarCalculation>;
  private consultations: Map<number, Consultation>;
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private installationUpdates: Map<number, InstallationUpdate>;
  private contracts: Map<number, Contract>;
  private tasks: Map<number, Task>;
  private messages: Map<number, Message>;
  private currentLeadId: number;
  private currentCalculationId: number;
  private currentConsultationId: number;
  private currentUserId: number;
  private currentProjectId: number;
  private currentInstallationUpdateId: number;
  private currentContractId: number;
  private currentTaskId: number;
  private currentMessageId: number;

  constructor() {
    this.leads = new Map();
    this.solarCalculations = new Map();
    this.consultations = new Map();
    this.users = new Map();
    this.projects = new Map();
    this.installationUpdates = new Map();
    this.contracts = new Map();
    this.tasks = new Map();
    this.messages = new Map();
    this.currentLeadId = 1;
    this.currentCalculationId = 1;
    this.currentConsultationId = 1;
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentInstallationUpdateId = 1;
    this.currentContractId = 1;
    this.currentTaskId = 1;
    this.currentMessageId = 1;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.currentLeadId++;
    const lead: Lead = { 
      ...insertLead,
      address: insertLead.address || null,
      monthlyBill: insertLead.monthlyBill || null,
      homeSize: insertLead.homeSize || null,
      roofType: insertLead.roofType || null,
      energyGoals: insertLead.energyGoals || null,
      leadSource: insertLead.leadSource || null,
      status: insertLead.status || null,
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
      leadId: insertCalculation.leadId || null,
      monthlySavings: insertCalculation.monthlySavings || null,
      yearOneSavings: insertCalculation.yearOneSavings || null,
      twentyYearSavings: insertCalculation.twentyYearSavings || null,
      systemSize: insertCalculation.systemSize || null,
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
      leadId: insertConsultation.leadId || null,
      scheduledDate: insertConsultation.scheduledDate || null,
      status: insertConsultation.status || null,
      notes: insertConsultation.notes || null,
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
