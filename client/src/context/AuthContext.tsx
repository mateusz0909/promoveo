import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const normalizeRoles = (value: unknown): string[] => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.map((item) => String(item).toLowerCase());
    }

    if (typeof value === "string") {
      const trimmed = value.trim();

      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item).toLowerCase());
          }
          if (parsed && typeof parsed === "object") {
            return Object.values(parsed).map((item) => String(item).toLowerCase());
          }
        } catch (error) {
          console.warn("Failed to parse roles metadata", error);
        }
      }

      return trimmed
        .split(/[\s,;]+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
    }

    if (typeof value === "object") {
      return Object.values(value as Record<string, unknown>).map((item) => String(item).toLowerCase());
    }

    return [String(value).toLowerCase()];
  };

  const isAdmin = useMemo(() => {
    if (!user) {
      return false;
    }

    const possibleMetadatas = [user.app_metadata ?? {}, user.user_metadata ?? {}];

    for (const metadata of possibleMetadatas) {
      if (!metadata || typeof metadata !== "object") {
        continue;
      }

      const legacyRole = typeof metadata.role === "string" ? metadata.role : null;
      if (legacyRole && legacyRole.toLowerCase() === "admin") {
        return true;
      }

      const legacyFlag = metadata.isAdmin ?? metadata.is_admin ?? metadata.admin;
      if (typeof legacyFlag === "boolean" && legacyFlag) {
        return true;
      }
      if (typeof legacyFlag === "string" && legacyFlag.toLowerCase() === "true") {
        return true;
      }

      const candidates = [metadata.roles, metadata.role, metadata.claims];
      for (const candidate of candidates) {
        const roles = normalizeRoles(candidate);
        if (roles.includes("admin")) {
          return true;
        }
      }
    }

    return false;
  }, [user]);

  const value = {
    user,
    session,
    loading,
    isAdmin,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
