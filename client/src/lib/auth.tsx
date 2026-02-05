import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "rep" | "client";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role: "admin" | "rep" | "client") => void;
  register: (data: { email: string; password: string; firstName: string; lastName: string; role: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "liv8_auth_token";
const USER_KEY = "liv8_auth_user";

// Demo accounts that work 100% client-side — no server call needed
const DEMO_USERS: Record<string, User> = {
  admin:  { id: 9001, email: "admin@liv8solar.com",  firstName: "LIV8", lastName: "Admin",  role: "admin" },
  rep:    { id: 9002, email: "demo@liv8solar.com",   firstName: "Demo", lastName: "Rep",    role: "rep" },
  client: { id: 9003, email: "client@liv8solar.com", firstName: "Demo", lastName: "Client", role: "client" },
};

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function storeUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore user from localStorage (no server call needed)
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }
    setIsLoading(false);
  }, []);

  // Demo login — purely client-side, zero API calls, always works
  const demoLogin = (role: "admin" | "rep" | "client") => {
    const demoUser = DEMO_USERS[role];
    storeUser(demoUser);
    setUser(demoUser);
  };

  // Regular login via API (for real accounts)
  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Login failed" }));
      throw new Error(error.message || "Login failed");
    }

    const data = await res.json();
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    const u: User = { id: data.id, email: data.email, firstName: data.firstName, lastName: data.lastName, role: data.role };
    storeUser(u);
    setUser(u);
  };

  const register = async (regData: { email: string; password: string; firstName: string; lastName: string; role: string }) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regData),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Registration failed" }));
      throw new Error(error.message || "Registration failed");
    }

    const data = await res.json();
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    const u: User = { id: data.id, email: data.email, firstName: data.firstName, lastName: data.lastName, role: data.role };
    storeUser(u);
    setUser(u);
  };

  const logout = async () => {
    clearStorage();
    setUser(null);
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, demoLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
