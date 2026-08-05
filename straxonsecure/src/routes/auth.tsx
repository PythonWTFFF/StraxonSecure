import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Mail, KeyRound, UserPlus, LogIn } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Straxon Secure" },
      {
        name: "description",
        content: "Sign in to access labs, save architectures, and track progress.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back, operator.");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <CyberCard variant="cyan" className="w-full max-w-md p-8">
        <div className="text-xs font-mono tracking-[0.3em] text-primary uppercase mb-2">
          // ACCESS TERMINAL
        </div>
        <h1 className="font-display text-3xl font-bold mb-1">
          {mode === "signin" ? "Authenticate" : "Initialize"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "signin"
            ? "Sign in to your operator account."
            : "Create a new operator profile."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-xs font-mono tracking-wider uppercase">
              <Mail className="inline h-3 w-3 mr-1" /> Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 bg-background/50 border-border font-mono"
              placeholder="operator@straxon.io"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-xs font-mono tracking-wider uppercase">
              <KeyRound className="inline h-3 w-3 mr-1" /> Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 bg-background/50 border-border font-mono"
              placeholder="••••••••"
            />
          </div>

          <CyberButton type="submit" disabled={busy} className="w-full" size="lg">
            {busy ? (
              "Connecting..."
            ) : mode === "signin" ? (
              <>
                <LogIn className="h-4 w-4" /> Sign In
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" /> Create Account
              </>
            )}
          </CyberButton>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              No account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-primary hover:underline font-mono"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Have an account?{" "}
              <button
                onClick={() => setMode("signin")}
                className="text-primary hover:underline font-mono"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </CyberCard>
    </div>
  );
}
