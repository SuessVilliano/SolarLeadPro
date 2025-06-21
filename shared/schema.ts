import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
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

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertSolarCalculationSchema = createInsertSchema(solarCalculations).omit({
  id: true,
  createdAt: true,
});

export const insertConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  createdAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertSolarCalculation = z.infer<typeof insertSolarCalculationSchema>;
export type SolarCalculation = typeof solarCalculations.$inferSelect;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultations.$inferSelect;
