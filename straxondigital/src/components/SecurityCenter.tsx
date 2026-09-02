import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Key, FileText, Lock, AlertTriangle, Eye, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const SecurityCenter = () => {
  const { user } = useAuth();
  const [showKey, setShowKey] = useState(false);
  
  const generateNewKey = () => {
    toast.success("New AES-256 API Key generated securely.", {
      description: "Previous key has been rotated out.",
    });
  };

  const securityScore = 85;

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
                  className="text-primary transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-gradient">
                {securityScore}%
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Add 2FA to reach 100% protection.
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
                  value="sk_live_51M..."
                  readOnly
                  className="bg-black/30 font-mono"
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
                <p className="text-xs text-muted-foreground">Protect your account with an authenticator app.</p>
              </div>
              <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                Enable 2FA
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
                { event: "API Key Generated", resource: "Auth", ip: "192.168.1.1", time: "2 mins ago", status: "success" },
                { event: "Login Attempt", resource: "OAuth", ip: "192.168.1.1", time: "1 hour ago", status: "success" },
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
    </div>
  );
};
