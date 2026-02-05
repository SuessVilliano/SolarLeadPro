import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import crypto from "crypto";

// Simple password hashing (production should use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

export function setupAuth(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "liv8-solar-session-secret-change-me",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    })
  );

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

      // Only allow client and rep self-registration; admin must be created by admin
      const allowedRoles = ["client", "rep"];
      const userRole = allowedRoles.includes(role) ? role : "rep";

      const user = await storage.createUser({
        email,
        hashedPassword: hashPassword(password),
        firstName,
        lastName,
        role: userRole,
      });

      req.session.userId = user.id;
      req.session.userRole = user.role;

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
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

      const user = await storage.getUserByEmail(email);
      if (!user || !verifyPassword(password, user.hashedPassword)) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ message: "Account is deactivated" });
        return;
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: "Logout failed" });
        return;
      }
      res.json({ message: "Logged out" });
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  });

  // Seed admin account if none exists
  app.post("/api/auth/seed-admin", async (_req: Request, res: Response) => {
    try {
      const existing = await storage.getUserByEmail("admin@liv8solar.com");
      if (existing) {
        res.json({ message: "Admin already exists" });
        return;
      }

      const admin = await storage.createUser({
        email: "admin@liv8solar.com",
        hashedPassword: hashPassword("admin123"),
        firstName: "LIV8",
        lastName: "Admin",
        role: "admin",
      });

      res.json({ message: "Admin created", email: admin.email });
    } catch (error) {
      res.status(500).json({ message: "Failed to seed admin" });
    }
  });
}

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  next();
}

// Middleware to require specific role
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    if (!req.session.userRole || !roles.includes(req.session.userRole)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    next();
  };
}
