import { useState, useEffect } from "react";
import { Shield, ShieldAlert, CheckCircle2, ChevronRight, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

export function PostureScoreWidget() {
  const [score, setScore] = useState(0);
  const targetScore = 82;

  useEffect(() => {
    const timer = setTimeout(() => {
      setScore(targetScore);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="glass rounded-xl p-5 border border-primary/20 bg-background/50 relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Security Posture
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono border border-primary/20">
          ENTERPRISE
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
        {/* Circular Progress */}
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-muted/30 stroke-current"
              strokeWidth="8"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            />
            <motion.circle
              className="text-primary stroke-current drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]"
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              initial={{ strokeDasharray: "0 251.2" }}
              animate={{ strokeDasharray: `${(score / 100) * 251.2} 251.2` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-bold neon-text">{score}</span>
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Score</span>
          </div>
        </div>

        {/* Action Items */}
        <div className="flex-1 space-y-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between p-2 rounded-lg bg-success/10 border border-success/20">
              <div className="flex gap-2 items-center">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span className="text-xs font-mono text-foreground/90">MFA Enforced</span>
              </div>
              <span className="text-[10px] text-success/70 font-mono">+15</span>
            </div>
            
            <div className="flex items-start justify-between p-2 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex gap-2 items-center">
                <ShieldAlert className="h-4 w-4 text-warning shrink-0" />
                <span className="text-xs font-mono text-foreground/90">EASM Scan Pending</span>
              </div>
              <span className="text-[10px] text-primary/70 font-mono">+10 pts</span>
            </div>
          </div>
          
          <Link to="/easm" className="text-xs font-mono text-primary flex items-center gap-1 hover:underline w-fit">
            Improve score <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
