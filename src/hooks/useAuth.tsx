import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    // Send welcome email (fire-and-forget)
    if (!error) {
      supabase.functions.invoke("send-email", {
        body: { type: "welcome", to: email, data: { name: fullName } },
      }).catch(console.error);
    }

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    // ─── Brute force check ───
    let clientIp = "unknown";
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();
      clientIp = ipData.ip || "unknown";
    } catch (_) {}

    try {
      const checkRes = await supabase.functions.invoke("check-login-attempts", {
        body: { email, ip: clientIp },
      });

      if (checkRes.data?.blocked) {
        toast.error(checkRes.data.message || "Prea multe încercări. Încearcă mai târziu.");
        return { error: new Error(checkRes.data.message || "Too many attempts") };
      }
    } catch (_) {
      // If brute force check fails, allow login attempt (fail open)
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    // Log attempt result
    try {
      await supabase.from("login_attempts" as any).insert({
        email,
        ip_address: clientIp,
        success: !error,
        attempted_at: new Date().toISOString(),
      });
    } catch (_) {}

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
