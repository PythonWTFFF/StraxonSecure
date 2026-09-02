import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Sparkles, X } from "lucide-react";

interface SocialProofEvent {
  buyer: string;
  location: string;
  item: string;
  timeAgo: string;
}

const EVENTS: SocialProofEvent[] = [
  { buyer: "Founder", location: "San Francisco, CA", item: "Full-Stack SaaS Architecture", timeAgo: "3m ago" },
  { buyer: "VP of Product", location: "London, UK", item: "Executive Career Acceleration Suite", timeAgo: "7m ago" },
  { buyer: "Tech Operator", location: "Austin, TX", item: "Startup Launch Empire Suite", timeAgo: "11m ago" },
  { buyer: "Agency Director", location: "Toronto, Canada", item: "Autonomous Growth Retainer", timeAgo: "16m ago" },
  { buyer: "Growth Lead", location: "Berlin, Germany", item: "High-Conversion Website Blueprint", timeAgo: "22m ago" },
];

export const LiveSocialProof = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    // Show after initial 4 seconds
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 4000);

    // Loop cycle: show for 6 seconds, hide for 10 seconds, switch item
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % EVENTS.length);
        setVisible(true);
      }, 3000);
    }, 14000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [dismissed]);

  if (dismissed) return null;

  const current = EVENTS[currentIndex];

  return (
    <div className="fixed bottom-4 left-4 z-50 pointer-events-auto max-w-xs sm:max-w-sm">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl glass-strong p-3.5 border border-primary/30 shadow-elegant flex items-start gap-3 relative"
          >
            <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/30">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>

            <div className="min-w-0 flex-1 pr-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <span>{current.buyer}</span>
                <span className="text-[10px] text-muted-foreground font-normal">in {current.location}</span>
              </div>
              <p className="text-[11px] text-primary font-medium truncate mt-0.5">
                Purchased {current.item}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono mt-1">
                <CheckCircle2 className="h-3 w-3 text-green-400" /> Verified Order · {current.timeAgo}
              </div>
            </div>

            <button
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground p-1 shrink-0 -mr-1 -mt-1"
              aria-label="Close social proof notification"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
