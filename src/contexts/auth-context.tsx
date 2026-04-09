import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Profile, Role } from "../types";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { initials, withTimeout } from "../lib/utils";

type AuthContextValue = {
  user: { id: string; email?: string } | null;
  profile: (Profile & { initials: string }) | null;
  loading: boolean;
  role: Role | null;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (input: {
    email: string;
    password: string;
    fullName: string;
    role: Role;
    institution?: string;
  }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const demoAccounts = [
  {
    role: "doctor" as Role,
    fullName: "Dr. Demo User",
    email: "doc@mail.com",
    password: "doc12345",
  },
  {
    role: "student" as Role,
    fullName: "Student Demo User",
    email: "stu@mail.com",
    password: "stu12345",
  },
  {
    role: "patient" as Role,
    fullName: "Patient Demo User",
    email: "pat@mail.com",
    password: "pat12345",
  },
  {
    role: "admin" as Role,
    fullName: "Admin Demo User",
    email: "admin@mail.com",
    password: "sudouser123",
  },
];

function resolveDemoLogin(email: string, password: string) {
  const account = demoAccounts.find(
    (item) =>
      item.email.toLowerCase() === email.toLowerCase() &&
      item.password === password,
  );
  if (!account) return null;
  const demoId = `demo-${account.role}`;
  return {
    user: { id: demoId, email: account.email },
    profile: {
      id: demoId,
      email: account.email,
      full_name: account.fullName,
      role: account.role,
      institution: null,
      specialty: null,
      qualification: null,
      avatar_url: null,
      initials: initials(account.fullName),
    } as Profile & { initials: string },
  };
}

async function fetchProfile(userId: string) {
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data as Profile | null;
}

function buildFallbackProfile(
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null,
) {
  if (!user) return null;
  const metadata = user.user_metadata || {};
  const role =
    typeof metadata.role === "string" ? (metadata.role as Role) : "patient";
  const fullName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : user.email?.split("@")[0] || "Dental.ai User";
  return {
    id: user.id,
    email: user.email || "",
    full_name: fullName,
    role,
    institution:
      typeof metadata.institution === "string" ? metadata.institution : null,
    specialty:
      typeof metadata.specialty === "string" ? metadata.specialty : null,
    qualification:
      typeof metadata.qualification === "string"
        ? metadata.qualification
        : null,
    avatar_url: null,
    initials: initials(fullName),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<
    (Profile & { initials: string }) | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }

      const sessionResult = await withTimeout(
        supabase.auth.getSession(),
        { data: { session: null }, error: null },
        700,
      );
      const session = sessionResult.data.session;

      if (mounted && session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        const currentProfile = await withTimeout(
          fetchProfile(session.user.id),
          null,
          700,
        );
        if (currentProfile) {
          setProfile({
            ...currentProfile,
            initials: initials(currentProfile.full_name),
          });
        } else {
          setProfile(buildFallbackProfile(session.user));
        }
      }

      if (mounted) setLoading(false);
    }

    void bootstrap();

    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        const currentProfile = await fetchProfile(session.user.id);
        if (currentProfile) {
          setProfile({
            ...currentProfile,
            initials: initials(currentProfile.full_name),
          });
        } else {
          setProfile(buildFallbackProfile(session.user));
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      role: profile?.role ?? null,
      isDemo: !isSupabaseConfigured,
      async signIn(email, password) {
        if (!supabase)
          return { error: new Error("Supabase is not configured") };
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          // Allow the documented quick-login demo credentials when Supabase users are unavailable.
          if (
            error.message.toLowerCase().includes("invalid login credentials")
          ) {
            const demo = resolveDemoLogin(email, password);
            if (demo) {
              setUser(demo.user);
              setProfile(demo.profile);
              return { error: null };
            }
          }
          return { error };
        }
        const currentProfile = await fetchProfile(data.user.id);
        if (currentProfile) {
          setUser({ id: data.user.id, email: data.user.email });
          setProfile({
            ...currentProfile,
            initials: initials(currentProfile.full_name),
          });
        } else {
          setUser({ id: data.user.id, email: data.user.email });
          setProfile(buildFallbackProfile(data.user));
        }
        return { error: null };
      },
      async signUp(input) {
        if (!supabase)
          return { error: new Error("Supabase is not configured") };
        const { error } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            data: {
              full_name: input.fullName,
              role: input.role,
            },
          },
        });
        return { error: error ?? null };
      },
      async signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
      },
      async resetPassword(email) {
        if (!supabase)
          return { error: new Error("Supabase is not configured") };
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        return { error: error ?? null };
      },
    }),
    [loading, profile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
