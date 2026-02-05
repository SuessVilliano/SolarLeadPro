import { type Express, type Request, type Response, type NextFunction } from "express";
import { storage } from "./storage";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "liv8-solar-jwt-secret-change-in-production";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function createToken(user: { id: number; email: string; firstName: string; lastName: string; role: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function verifyToken(token: string): any | null {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Hardcoded demo accounts - these bypass storage entirely so they always work
const DEMO_ACCOUNTS: Record<string, { password: string; id: number; firstName: string; lastName: string; role: string }> = {
  "admin@liv8solar.com": { password: "admin123", id: 9001, firstName: "LIV8", lastName: "Admin", role: "admin" },
  "demo@liv8solar.com":  { password: "demo123",  id: 9002, firstName: "Demo", lastName: "Rep",   role: "rep" },
  "client@liv8solar.com":{ password: "client123", id: 9003, firstName: "Demo", lastName: "Client",role: "client" },
};

function tryDemoLogin(email: string, password: string): { id: number; email: string; firstName: string; lastName: string; role: string; token: string } | null {
  const demo = DEMO_ACCOUNTS[email];
  if (demo && demo.password === password) {
    const user = { id: demo.id, email, firstName: demo.firstName, lastName: demo.lastName, role: demo.role };
    return { ...user, token: createToken(user) };
  }
  return null;
}

// Auto-seed admin user into storage (needed for Vercel serverless where MemStorage resets)
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
      console.log("Admin user auto-seeded");
    }
  } catch (e) {
    console.error("Failed to auto-seed admin:", e);
  }
}

export function setupAuth(app: Express) {
  // Auto-seed admin on startup
  ensureAdminExists();

  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({ message: "All fields are required" });
        return;
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ message: "Email already registered" });
        return;
      }

      const allowedRoles = ["client", "rep"];
      const userRole = allowedRoles.includes(role) ? role : "rep";

      const user = await storage.createUser({
        email,
        hashedPassword: hashPassword(password),
        firstName,
        lastName,
        role: userRole,
      });

      const token = createToken(user);
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }

      // Check hardcoded demo accounts first (always works, no storage needed)
      const demoResult = tryDemoLogin(email, password);
      if (demoResult) {
        res.json(demoResult);
        return;
      }

      // Fall through to storage-based auth for real accounts
      const user = await storage.getUserByEmail(email);
      if (!user || !verifyPassword(password, user.hashedPassword)) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ message: "Account is deactivated" });
        return;
      }

      const token = createToken(user);
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout (client-side just clears the token)
  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    res.json({ message: "Logged out" });
  });

  // Get current user from JWT token
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    res.json({
      id: payload.id,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
    });
  });

  // Seed admin (backwards compatibility)
  app.post("/api/auth/seed-admin", async (_req: Request, res: Response) => {
    try {
      await ensureAdminExists();
      res.json({ message: "Admin ready" });
    } catch (error) {
      res.status(500).json({ message: "Failed to seed admin" });
    }
  });
}

// Middleware to require authentication via JWT
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  (req as any).user = payload;
  next();
}

// Middleware to require specific role
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    if (!roles.includes(payload.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    (req as any).user = payload;
    next();
  };
}
