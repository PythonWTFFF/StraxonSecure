import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  Terminal,
  Activity,
  Beaker,
  GraduationCap,
  Network,
  ScanLine,
  Bot,
  Shield,
  Swords,
  AlertCircle,
  BarChart3,
  Wifi,
  Flag,
  FileCode,
  Lock,
  Globe,
  Command,
  X,
} from "lucide-react";

type PaletteItem = {
  id: string;
  title: string;
  icon: any;
  category: string;
  href: string;
  shortcut?: string;
};

const ITEMS: PaletteItem[] = [
  {
    id: "dashboard",
    title: "SOC Dashboard",
    icon: Activity,
    category: "Operations",
    href: "/dashboard",
    shortcut: "D",
  },
  {
    id: "warroom",
    title: "Red vs Blue War Room",
    icon: Swords,
    category: "Operations",
    href: "/warroom",
    shortcut: "W",
  },
  {
    id: "posture",
    title: "Security Posture",
    icon: BarChart3,
    category: "Operations",
    href: "/posture",
    shortcut: "P",
  },
  {
    id: "packet-analyzer",
    title: "Packet Analyzer",
    icon: Wifi,
    category: "Operations",
    href: "/packet-analyzer",
  },
  { id: "ir", title: "IR Playbooks", icon: AlertCircle, category: "Operations", href: "/ir" },

  {
    id: "labs-hub",
    title: "Attack Labs Hub",
    icon: Beaker,
    category: "Training",
    href: "/labs",
    shortcut: "L",
  },
  {
    id: "ctf",
    title: "CTF Challenges",
    icon: Flag,
    category: "Training",
    href: "/ctf",
    shortcut: "C",
  },
  {
    id: "learning",
    title: "Learning Academy",
    icon: GraduationCap,
    category: "Training",
    href: "/learning",
  },

  {
    id: "lab-rce",
    title: "Lab: Remote Code Execution",
    icon: Terminal,
    category: "Specific Labs",
    href: "/labs/rce",
  },
  {
    id: "lab-ssrf",
    title: "Lab: Server-Side Request Forgery",
    icon: Globe,
    category: "Specific Labs",
    href: "/labs/ssrf",
  },
  {
    id: "lab-csrf",
    title: "Lab: Cross-Site Request Forgery",
    icon: Shield,
    category: "Specific Labs",
    href: "/labs/csrf",
  },
  {
    id: "lab-jwt",
    title: "Lab: JWT Token Tampering",
    icon: Lock,
    category: "Specific Labs",
    href: "/labs/jwt",
  },
  {
    id: "lab-xxe",
    title: "Lab: XXE Injection",
    icon: FileCode,
    category: "Specific Labs",
    href: "/labs/xxe",
  },
  {
    id: "lab-lfi",
    title: "Lab: Local File Inclusion",
    icon: Terminal,
    category: "Specific Labs",
    href: "/labs/lfi",
  },
  {
    id: "lab-idor",
    title: "Lab: Insecure Direct Object Ref",
    icon: Shield,
    category: "Specific Labs",
    href: "/labs/idor",
  },

  {
    id: "architecture",
    title: "Architecture Designer",
    icon: Network,
    category: "Engineering",
    href: "/architecture",
    shortcut: "A",
  },
  {
    id: "scanner",
    title: "DevSecOps Scanner",
    icon: ScanLine,
    category: "Engineering",
    href: "/scanner",
    shortcut: "S",
  },
  {
    id: "assistant",
    title: "AI Threat Assistant",
    icon: Bot,
    category: "Intelligence",
    href: "/assistant",
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Filter items based on query
  const filteredItems = ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()),
  );

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation within the palette
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === "Enter" && filteredItems.length > 0) {
        e.preventDefault();
        navigate({ to: filteredItems[selectedIndex].href });
        setOpen(false);
        setQuery("");
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredItems, selectedIndex, navigate]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  // Group items by category for rendering
  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, PaletteItem[]>,
  );

  // Flatten back out to keep track of absolute index for selection
  let globalIndex = 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[999]"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-xl bg-slate-900/95 border border-cyan-900/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Input Header */}
              <div className="flex items-center px-4 py-3 border-b border-slate-800">
                <Search className="h-5 w-5 text-cyan-500 mr-3 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands, modules, and labs..."
                  className="flex-1 bg-transparent border-none text-slate-200 focus:outline-none focus:ring-0 placeholder:text-slate-500 font-mono text-sm"
                />
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors rounded-md"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Results Area */}
              <div className="max-h-[60vh] overflow-y-auto cs p-2">
                {filteredItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">
                    No modules found for "{query}"
                  </div>
                ) : (
                  Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category} className="mb-4 last:mb-1">
                      <div className="px-3 text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-1.5">
                        {category}
                      </div>
                      {items.map((item) => {
                        const isSelected = globalIndex === selectedIndex;
                        const currentIndex = globalIndex;
                        globalIndex++;

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              navigate({ to: item.href });
                              setOpen(false);
                              setQuery("");
                            }}
                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-cyan-950/40 border border-cyan-900/50 text-cyan-400"
                                : "text-slate-300 hover:bg-slate-800/40 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon
                                className={`h-4 w-4 ${isSelected ? "text-cyan-400" : "text-slate-500"}`}
                              />
                              <span className="font-mono text-xs">{item.title}</span>
                            </div>
                            {item.shortcut && (
                              <div className="flex items-center gap-1 opacity-60">
                                <Command className="h-3 w-3" />
                                <span className="font-mono text-[10px] bg-slate-800/60 border border-slate-700 px-1.5 py-0.5 rounded">
                                  {item.shortcut}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <span className="bg-slate-800 px-1 py-0.5 rounded">↑↓</span> to navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded">↵</span> to select
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="bg-slate-800 px-1 py-0.5 rounded">esc</span> to close
                  </span>
                </div>
                <div className="text-[9px] font-mono text-cyan-700 uppercase tracking-widest flex items-center gap-1">
                  STRAXON-OS
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
