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

  // User management
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      leadId: insertUser.leadId || null,
      repId: insertUser.repId || null,
      isActive: insertUser.isActive ?? true,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    if (!role) return Array.from(this.users.values());
    return Array.from(this.users.values()).filter(u => u.role === role);
  }

  // Project management
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = {
      ...insertProject,
      leadId: insertProject.leadId || null,
      clientId: insertProject.clientId || null,
      repId: insertProject.repId || null,
      systemSize: insertProject.systemSize || null,
      estimatedValue: insertProject.estimatedValue || null,
      contractSignedDate: insertProject.contractSignedDate || null,
      installationStatus: insertProject.installationStatus || "pending",
      installationProgress: insertProject.installationProgress || 0,
      expectedCompletionDate: insertProject.expectedCompletionDate || null,
      actualCompletionDate: insertProject.actualCompletionDate || null,
      openSolarProjectId: insertProject.openSolarProjectId || null,
      notes: insertProject.notes || null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByClientId(clientId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.clientId === clientId);
  }

  async getProjectsByRepId(repId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.repId === repId);
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    const updated = { ...project, ...updates, updatedAt: new Date() };
    this.projects.set(id, updated);
    return updated;
  }

  // Installation updates
  async createInstallationUpdate(insertUpdate: InsertInstallationUpdate): Promise<InstallationUpdate> {
    const id = this.currentInstallationUpdateId++;
    const update: InstallationUpdate = {
      ...insertUpdate,
      updatedBy: insertUpdate.updatedBy || null,
      message: insertUpdate.message || null,
      id,
      createdAt: new Date(),
    };
    this.installationUpdates.set(id, update);
    return update;
  }

  async getInstallationUpdatesByProjectId(projectId: number): Promise<InstallationUpdate[]> {
    return Array.from(this.installationUpdates.values()).filter(u => u.projectId === projectId);
  }

  // Contracts
  async createContract(insertContract: InsertContract): Promise<Contract> {
    const id = this.currentContractId++;
    const contract: Contract = {
      ...insertContract,
      documentUrl: insertContract.documentUrl || null,
      signedDate: insertContract.signedDate || null,
      status: insertContract.status || "pending",
      totalAmount: insertContract.totalAmount || null,
      id,
      createdAt: new Date(),
    };
    this.contracts.set(id, contract);
    return contract;
  }

  async getContractsByProjectId(projectId: number): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(c => c.projectId === projectId);
  }

  // Tasks
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = {
      ...insertTask,
      repId: insertTask.repId || null,
      leadId: insertTask.leadId || null,
      projectId: insertTask.projectId || null,
      description: insertTask.description || null,
      priority: insertTask.priority || "medium",
      status: insertTask.status || "pending",
      dueDate: insertTask.dueDate || null,
      completedAt: insertTask.completedAt || null,
      id,
      createdAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async getTasksByRepId(repId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.repId === repId);
  }

  async getTasksByLeadId(leadId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.leadId === leadId);
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const updated = { ...task, ...updates };
    this.tasks.set(id, updated);
    return updated;
  }

  // Messages
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      senderId: insertMessage.senderId || null,
      receiverId: insertMessage.receiverId || null,
      projectId: insertMessage.projectId || null,
      subject: insertMessage.subject || null,
      isRead: insertMessage.isRead ?? false,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByProjectId(projectId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(m => m.projectId === projectId);
  }

  async getMessagesBetweenUsers(senderId: number, receiverId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      m => (m.senderId === senderId && m.receiverId === receiverId) ||
           (m.senderId === receiverId && m.receiverId === senderId)
    );
  }
}

export const storage = new MemStorage();
