import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  accentColor?: "cyan" | "purple" | "success" | "warning";
}

const accentMap = {
  cyan: "text-primary border-primary/20 bg-primary/5",
  purple: "text-secondary border-secondary/20 bg-secondary/5",
  success: "text-success border-success/20 bg-success/5",
  warning: "text-warning border-warning/20 bg-warning/5",
};

const iconBgMap = {
  cyan: "bg-primary/10 text-primary",
  purple: "bg-secondary/10 text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export function MetricCard({ title, value, change, changeType = "neutral", icon: Icon, accentColor = "cyan" }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-hover p-5"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={`text-xs font-mono ${
              changeType === "positive" ? "text-success" :
              changeType === "negative" ? "text-destructive" : "text-muted-foreground"
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgMap[accentColor]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
