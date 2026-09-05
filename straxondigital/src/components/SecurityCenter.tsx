import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  Key,
  FileText,
  Lock,
  AlertTriangle,
  Eye,
  ShieldAlert,
  CheckCircle2,
  QrCode,
  Smartphone,
  Laptop,
  LogOut,
  Copy,
  Check,
  ShieldCheck,
  Zap
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const SecurityCenter = () => {
  const { user } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [is2FaModalOpen, setIs2FaModalOpen] = useState(false);
  const [is2FaEnabled, setIs2FaEnabled] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [sessions, setSessions] = useState([
    {
      id: "sess-1",
      device: "Chrome 124 on Windows 11",
      location: "Mumbai, Maharashtra, India",
      ip: "103.21.244.12",
      isCurrent: true,
      lastActive: "Active Now"
    },
    {
      id: "sess-2",
      device: "Mobile Safari on iPhone 15 Pro",
      location: "London, United Kingdom",
      ip: "82.165.197.1",
      isCurrent: false,
      lastActive: "4 hours ago"
    }
  ]);
  
  const generateNewKey = () => {
    toast.success("New AES-256 API Key generated securely.", {
      description: "Previous key has been rotated out.",
    });
  };

  const handleVerifyTotp = () => {
    if (totpCode.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit TOTP code from your authenticator app.");
      return;
    }
    setIs2FaEnabled(true);
    setIs2FaModalOpen(false);
    toast.success("Two-Factor Authentication (2FA) Activated!", {
      description: "Your account now has bank-grade 100% protection."
    });
  };

  const handleRevokeSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    toast.success("All other sessions revoked successfully.", {
      description: "Remote devices logged out and auth tokens invalidated."
    });
  };

  const securityScore = is2FaEnabled ? 100 : 85;
  const mockSecret = "JBSWY3DPEHPK3PXP";

  const copySecret = () => {
    navigator.clipboard.writeText(mockSecret);
    setCopiedSecret(true);
    toast.success("2FA Secret Key copied to clipboard!");
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Security Score */}
        <Card className="glass border-primary/20 md:col-span-1 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Security Score
            </CardTitle>
            <CardDescription>Your account protection level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/30" />
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={376.99}
                  strokeDashoffset={376.99 - (376.99 * securityScore) / 100}
                  className={`${is2FaEnabled ? "text-emerald-400" : "text-primary"} transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-gradient">
                {securityScore}%
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {is2FaEnabled
                ? "✓ Maximum bank-grade security enabled."
                : "Enable 2FA below to reach 100% maximum protection."}
            </p>
          </CardContent>
        </Card>

        {/* API Keys & Secrets */}
        <Card className="glass border-border/50 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              API Keys & Authentication
            </CardTitle>
            <CardDescription>Manage your secure access tokens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Production API Key (AES-256 Encrypted)</Label>
              <div className="flex gap-2">
                <Input
                  type={showKey ? "text" : "password"}
                  value="sk_live_51M9420straxon_enc_v2"
                  readOnly
                  className="bg-black/30 font-mono text-xs"
                />
                <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="default" onClick={generateNewKey}>Rotate</Button>
              </div>
              <p className="text-xs text-muted-foreground">Never share this key. It grants full RLS-bypassed access to your scoped data.</p>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Two-Factor Authentication (2FA)
                </h4>
                <p className="text-xs text-muted-foreground">Protect your account with Google Authenticator or 1Password.</p>
              </div>
              <Button
                variant={is2FaEnabled ? "secondary" : "outline"}
                onClick={() => setIs2FaModalOpen(true)}
                className={`text-xs ${
                  is2FaEnabled
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold"
                    : "border-primary/50 text-primary hover:bg-primary/10"
                }`}
              >
                {is2FaEnabled ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 2FA Active
                  </span>
                ) : (
                  "Configure 2FA"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions & Device Management */}
      <Card className="glass border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Laptop className="w-5 h-5 text-primary" /> Active Sessions & Device Access
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time tracking of authenticated devices and IP addresses
              </CardDescription>
            </div>
            {sessions.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeSessions}
                className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs h-8"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" /> Revoke Other Sessions
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-4 flex-wrap text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-primary">
                    {sess.device.includes("Mobile") ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{sess.device}</span>
                      {sess.isCurrent && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] font-mono">
                          This Device
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-[11px] font-mono mt-0.5">
                      {sess.location} · IP: {sess.ip}
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-muted-foreground">
                  {sess.lastActive}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RLS & Audit Logs */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Row Level Security (RLS) & Audit Logs
            </span>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Active
            </Badge>
          </CardTitle>
          <CardDescription>Real-time monitoring of your data boundaries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10 overflow-hidden">
            <div className="bg-black/40 p-3 grid grid-cols-4 gap-4 text-xs font-semibold text-muted-foreground uppercase">
              <span>Event</span>
              <span>Resource</span>
              <span>IP Address</span>
              <span>Timestamp</span>
            </div>
            <div className="divide-y divide-white/5">
              {[
                { event: "API Key Generated", resource: "Auth", ip: "103.21.244.12", time: "2 mins ago", status: "success" },
                { event: "Login Attempt", resource: "OAuth", ip: "103.21.244.12", time: "1 hour ago", status: "success" },
                { event: "Invalid Access", resource: "Orders Table", ip: "10.0.0.45", time: "5 hours ago", status: "blocked" },
              ].map((log, i) => (
                <div key={i} className="p-3 grid grid-cols-4 gap-4 text-sm items-center hover:bg-white/5 transition-colors">
                  <span className="flex items-center gap-2">
                    {log.status === "success" ? (
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    )}
                    {log.event}
                  </span>
                  <span className="text-gray-300 font-mono text-xs">{log.resource}</span>
                  <span className="text-gray-400 font-mono text-xs">{log.ip}</span>
                  <span className="text-gray-500 text-xs">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-yellow-500" />
            Logs are retained for 30 days. RLS ensures you can only view logs associated with <b>{user?.email}</b>.
          </p>
        </CardContent>
      </Card>

      {/* 2FA Setup Modal */}
      <Dialog open={is2FaModalOpen} onOpenChange={setIs2FaModalOpen}>
        <DialogContent className="sm:max-w-[425px] glass-strong border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Setup Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-xs">
              Scan the QR code with Google Authenticator, Authy, or 1Password.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-5">
            {/* Visual Simulated QR Code Box */}
            <div className="p-6 rounded-2xl bg-white flex flex-col items-center justify-center mx-auto w-48 h-48 border border-white/20 shadow-xl">
              <QrCode className="w-36 h-36 text-black" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-mono">Manual Secret Key</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={mockSecret}
                  className="bg-black/40 font-mono text-xs text-primary"
                />
                <Button variant="outline" size="icon" onClick={copySecret} className="h-9 w-9 shrink-0">
                  {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-mono">6-Digit Verification Code</Label>
              <Input
                placeholder="123456"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                className="bg-black/40 font-mono text-center text-lg tracking-widest h-11"
              />
            </div>

            <Button
              onClick={handleVerifyTotp}
              className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold h-11"
            >
              Verify & Activate 2FA Protection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
