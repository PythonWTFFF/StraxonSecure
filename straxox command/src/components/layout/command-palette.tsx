import React, { useState, useEffect, useMemo } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Bot, Loader2, LayoutDashboard, KanbanSquare, Briefcase,
  FileText, Users, ScrollText, BarChart2, UserCheck, Terminal,
  Code2, Plus, Home, ArrowRight, Zap, TrendingUp, Search, Database,
} from "lucide-react";
import { authFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface NavAction {
  id: string;
  label: string;
  description: string;
  icon: any;
  action: "navigate" | "create" | "ai";
  target?: string;
  event?: string;
}

const NAV_ACTIONS: NavAction[] = [
  { id: "go-home",        label: "Home",            description: "Go to home overview",             icon: Home,          action: "navigate", target: "/" },
  { id: "go-dashboard",   label: "Dashboard",       description: "View real-time dashboard",        icon: LayoutDashboard, action: "navigate", target: "/dashboard" },
  { id: "go-intelligence",label: "Intelligence",    description: "Analytics & insights",            icon: BarChart2,     action: "navigate", target: "/intelligence" },
  { id: "go-deals",       label: "Deals Pipeline",  description: "View sales kanban board",         icon: KanbanSquare,  action: "navigate", target: "/deals" },
  { id: "go-projects",    label: "Projects",        description: "Track delivery & tasks",          icon: Briefcase,     action: "navigate", target: "/projects" },
  { id: "go-invoices",    label: "Invoices",        description: "Manage billing & payments",       icon: FileText,      action: "navigate", target: "/invoices" },
  { id: "go-clients",     label: "Clients",         description: "Client management & CRM",        icon: Users,         action: "navigate", target: "/clients" },
  { id: "go-proposals",   label: "Proposals & Docs",description: "SOWs, PRDs, and project docs",   icon: ScrollText,    action: "navigate", target: "/proposals" },
  { id: "go-team",        label: "Team",            description: "Manage team members & roles",    icon: UserCheck,     action: "navigate", target: "/team" },
  { id: "go-audit",       label: "Audit Vault",     description: "View immutable audit log",       icon: Terminal,      action: "navigate", target: "/audit-log" },
  { id: "go-devtools",    label: "Dev Tools",       description: "Internal debugging tools",       icon: Code2,         action: "navigate", target: "/dev-tools" },
];

const CREATE_ACTIONS: NavAction[] = [
  { id: "new-deal",    label: "New Deal",    description: "Add a deal to the pipeline",   icon: TrendingUp, action: "navigate", target: "/deals" },
  { id: "new-project", label: "New Project", description: "Start tracking a delivery",    icon: Briefcase,  action: "navigate", target: "/projects" },
  { id: "new-invoice", label: "New Invoice", description: "Create a billing invoice",     icon: FileText,   action: "navigate", target: "/invoices" },
  { id: "new-client",  label: "New Client",  description: "Add a client to your CRM",    icon: Users,      action: "navigate", target: "/clients" },
];

const AI_SUGGESTIONS = [
  "What is our total pipeline value?",
  "Show me overdue invoices",
  "Which clients are at risk?",
  "Summarize this month's revenue",
  "How many tasks are blocked?",
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (!open) {
      setTimeout(() => { setQuery(""); setResponse(null); setAiMode(false); setSearchResults([]); }, 200);
    }
  }, [open]);

  useEffect(() => {
    if (aiMode || query.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await authFetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, aiMode]);

  const handleAction = (action: NavAction) => {
    setOpen(false);
    if (action.action === "navigate" && action.target) {
      navigate(action.target);
    }
  };

  const queryAI = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const res = await authFetch("/api/v1/ai/query", {
        method: "POST",
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResponse(data.answer || data.error || "No response from Cortex.");
    } catch {
      setResponse("⚠️ Could not connect to Cortex AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && aiMode && query.trim()) {
      queryAI();
    }
  };

  const filteredNav = useMemo(() => {
    if (!query) return NAV_ACTIONS;
    const q = query.toLowerCase();
    return NAV_ACTIONS.filter(a =>
      a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredCreate = useMemo(() => {
    if (!query) return CREATE_ACTIONS;
    const q = query.toLowerCase();
    return CREATE_ACTIONS.filter(a =>
      a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }, [query]);

  const showAI = aiMode || query.startsWith("?") || query.startsWith("ask ") || query.startsWith("cortex ");

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center border-b border-zinc-800 px-3">
        <Search className="w-4 h-4 text-zinc-500 mr-2 flex-shrink-0" />
        <CommandInput
          placeholder={aiMode ? "Ask Cortex AI anything... (Enter to send)" : "Search pages, actions, or type ? to ask AI..."}
          value={query}
          onValueChange={(v) => {
            setQuery(v);
            if (v.startsWith("?") || v.startsWith("ask ") || v.startsWith("cortex ")) setAiMode(true);
            else if (!v) setAiMode(false);
          }}
          onKeyDown={handleKeyDown}
          className="border-0 focus:ring-0 flex-1"
        />
        <button
          onClick={() => { setAiMode((m) => !m); setQuery(aiMode ? "" : "?"); }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition-all flex-shrink-0 ${aiMode ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-600"}`}
        >
          <Bot className="w-3 h-3" />
          {aiMode ? "AI Active" : "Ask AI"}
        </button>
      </div>

      <CommandList className="max-h-[520px]">
        {/* AI Mode */}
        {showAI && (
          <CommandGroup heading="✦ Cortex AI">
            {loading && (
              <div className="p-4 flex items-center gap-3 text-sm text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                <span className="font-mono text-xs">Cortex is processing your query...</span>
              </div>
            )}
            {response && !loading && (
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 text-sm text-zinc-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: response.replace(/\n/g, "<br/>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
                  />
                </div>
              </div>
            )}
            {!loading && !response && (
              <>
                <div className="px-4 py-2 text-[10px] font-mono text-zinc-600 uppercase tracking-wider">Suggestions</div>
                {AI_SUGGESTIONS.map((s) => (
                  <CommandItem
                    key={s}
                    onSelect={() => { setQuery(s); setAiMode(true); }}
                    className="flex items-center gap-3 px-4 py-2 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-sm text-zinc-300">{s}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-600 ml-auto" />
                  </CommandItem>
                ))}
                {query.replace(/^[?]|^ask |^cortex /i, "").trim() && (
                  <CommandItem
                    onSelect={queryAI}
                    className="flex items-center gap-3 px-4 py-2.5 bg-violet-500/5 border-t border-zinc-800 cursor-pointer"
                  >
                    <Bot className="w-4 h-4 text-violet-400" />
                    <span className="text-sm text-zinc-200 flex-1">Ask: "{query.replace(/^[?]|^ask |^cortex /i, "").trim()}"</span>
                    <kbd className="text-[10px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">↵ Enter</kbd>
                  </CommandItem>
                )}
              </>
            )}
          </CommandGroup>
        )}

        {/* Quick Create Actions */}
        {!showAI && filteredCreate.length > 0 && (
          <>
            <CommandGroup heading="Quick Actions">
              {filteredCreate.map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleAction(action)}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-200">{action.label}</p>
                    <p className="text-[11px] text-zinc-500">{action.description}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Navigation */}
        {!showAI && filteredNav.length > 0 && (
          <CommandGroup heading="Navigate">
            {filteredNav.map((action) => (
              <CommandItem
                key={action.id}
                onSelect={() => handleAction(action)}
                className="flex items-center gap-3 px-4 py-2 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                  <action.icon className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-300">{action.label}</p>
                  <p className="text-[11px] text-zinc-600">{action.description}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Database Search Results */}
        {!showAI && query.length >= 2 && searchResults.length > 0 && (
          <CommandGroup heading="Database Results">
            {searchResults.map((res) => (
              <CommandItem
                key={res.id}
                onSelect={() => { setOpen(false); navigate(res.url); }}
                className="flex items-center gap-3 px-4 py-2 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-300 font-semibold">{res.title}</p>
                  <p className="text-[11px] text-zinc-500">{res.subtitle}</p>
                </div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 border border-zinc-700 px-1.5 py-0.5 rounded bg-zinc-800">
                  {res.type}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* AI hint at bottom when no match */}
        {!showAI && filteredNav.length === 0 && filteredCreate.length === 0 && searchResults.length === 0 && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6">
              {isSearching ? (
                <>
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-zinc-400 text-sm">Searching database...</p>
                </>
              ) : (
                <>
                  <Bot className="w-8 h-8 text-violet-400" />
                  <p className="text-zinc-400 text-sm">No results found</p>
                  <button onClick={() => setAiMode(true)} className="text-[11px] text-violet-400 hover:text-violet-300 underline">
                    Ask Cortex AI about "{query}"
                  </button>
                </>
              )}
            </div>
          </CommandEmpty>
        )}

        {/* AI Hint Footer */}
        {!showAI && (
          <div className="border-t border-zinc-800 px-4 py-2 flex items-center justify-between">
            <p className="text-[10px] text-zinc-600 font-mono">↑↓ navigate · ↵ select · Esc close</p>
            <button onClick={() => { setAiMode(true); setQuery("?"); }} className="text-[10px] text-zinc-600 hover:text-violet-400 transition-colors font-mono flex items-center gap-1">
              <Bot className="w-3 h-3" /> type ? for AI
            </button>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
