import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  monthlyBill: decimal("monthly_bill"),
  homeSize: integer("home_size"),
  roofType: text("roof_type"),
  energyGoals: text("energy_goals"),
  leadSource: text("lead_source").default("website"),
  status: text("status").default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const solarCalculations = pgTable("solar_calculations", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  monthlyBill: decimal("monthly_bill").notNull(),
  homeSize: integer("home_size").notNull(),
  roofType: text("roof_type").notNull(),
  monthlySavings: decimal("monthly_savings"),
  yearOneSavings: decimal("year_one_savings"),
  twentyYearSavings: decimal("twenty_year_savings"),
  systemSize: text("system_size"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  scheduledDate: timestamp("scheduled_date"),
  status: text("status").default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User management for dashboard access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("client"), // client, rep, admin
  hashedPassword: text("hashed_password").notNull(),
  leadId: integer("lead_id").references(() => leads.id), // For clients
  repId: integer("rep_id").references(() => leads.id), // For clients assigned to rep
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects/Installations tracking
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  clientId: integer("client_id").references(() => users.id),
  repId: integer("rep_id").references(() => users.id),
  projectName: text("project_name").notNull(),
  systemSize: text("system_size"),
  estimatedValue: decimal("estimated_value"),
  contractSignedDate: timestamp("contract_signed_date"),
  installationStatus: text("installation_status").default("pending"), // pending, approved, design, permits, installation, completed
  installationProgress: integer("installation_progress").default(0), // 0-100%
  expectedCompletionDate: timestamp("expected_completion_date"),
  actualCompletionDate: timestamp("actual_completion_date"),
  openSolarProjectId: text("opensolar_project_id"), // Integration with opensolar.com
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Installation status updates/timeline
export const installationUpdates = pgTable("installation_updates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  status: text("status").notNull(),
  progress: integer("progress").notNull(), // 0-100%
  message: text("message"),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contracts/Documents
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  contractType: text("contract_type").notNull(), // installation, purchase, lease
  documentUrl: text("document_url"),
  signedDate: timestamp("signed_date"),
  status: text("status").default("pending"), // pending, signed, completed
  totalAmount: decimal("total_amount"),
  createdAt: timestamp("created_at").defaultNow(),
});

// CRM Tasks for reps
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  repId: integer("rep_id").references(() => users.id),
  leadId: integer("lead_id").references(() => leads.id),
  projectId: integer("project_id").references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").default("medium"), // low, medium, high
  status: text("status").default("pending"), // pending, in_progress, completed
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Communication/Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id),
  projectId: integer("project_id").references(() => projects.id),
  subject: text("subject"),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
}).extend({
  monthlyBill: z.union([z.string(), z.number(), z.null()]).transform((val) => val ? String(val) : null).optional(),
  homeSize: z.union([z.string(), z.number(), z.null()]).transform((val) => val ? Number(val) : null).optional(),
});

export const insertSolarCalculationSchema = createInsertSchema(solarCalculations).omit({
  id: true,
  createdAt: true,
}).extend({
  monthlyBill: z.union([z.string(), z.number()]).transform(String),
  homeSize: z.union([z.string(), z.number()]).transform(Number),
  leadId: z.number().optional(),
});

export const insertConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  createdAt: true,
});

// Relations
export const leadsRelations = relations(leads, ({ many, one }) => ({
  calculations: many(solarCalculations),
  consultations: many(consultations),
  projects: many(projects),
  user: one(users, { fields: [leads.id], references: [users.leadId] }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  lead: one(leads, { fields: [users.leadId], references: [leads.id] }),
  assignedProjects: many(projects, { relationName: "clientProjects" }),
  managedProjects: many(projects, { relationName: "repProjects" }),
  tasks: many(tasks),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  lead: one(leads, { fields: [projects.leadId], references: [leads.id] }),
  client: one(users, { fields: [projects.clientId], references: [users.id], relationName: "clientProjects" }),
  rep: one(users, { fields: [projects.repId], references: [users.id], relationName: "repProjects" }),
  updates: many(installationUpdates),
  contracts: many(contracts),
  tasks: many(tasks),
  messages: many(messages),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInstallationUpdateSchema = createInsertSchema(installationUpdates).omit({
  id: true,
  createdAt: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertSolarCalculation = z.infer<typeof insertSolarCalculationSchema>;
export type SolarCalculation = typeof solarCalculations.$inferSelect;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultations.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertInstallationUpdate = z.infer<typeof insertInstallationUpdateSchema>;
export type InstallationUpdate = typeof installationUpdates.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
