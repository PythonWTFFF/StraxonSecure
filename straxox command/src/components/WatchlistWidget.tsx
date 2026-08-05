import { AlertTriangle, Globe, Shield, Server } from "lucide-react";
import { motion } from "framer-motion";

const alerts = [
  { type: "domain", label: "acmecorp.in", detail: "Domain expires in 12 days", icon: Globe, urgency: "high" },
  { type: "ssl", label: "client-portal.io", detail: "SSL renewal in 22 days", icon: Shield, urgency: "medium" },
  { type: "hosting", label: "startup-x.com", detail: "Hosting renewal in 8 days", icon: Server, urgency: "high" },
  { type: "domain", label: "edtechapp.dev", detail: "Domain expires in 28 days", icon: Globe, urgency: "low" },
];

const urgencyColors = {
  high: "text-destructive border-destructive/20 bg-destructive/5",
  medium: "text-warning border-warning/20 bg-warning/5",
  low: "text-muted-foreground border-border bg-muted/30",
};

export function WatchlistWidget() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Watchlist</h3>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          {alerts.filter(a => a.urgency === "high").length} CRITICAL
        </span>
      </div>
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-lg border ${urgencyColors[alert.urgency as keyof typeof urgencyColors]}`}
          >
            <alert.icon className="w-4 h-4 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{alert.label}</p>
              <p className="text-[10px] opacity-70 font-mono">{alert.detail}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
