import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Inbox, Shield, CreditCard, ShoppingBag, Terminal, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const CATEGORIES = ["All", "Orders", "Billing", "Security", "Platform"];

const getCategoryIcon = (cat: string) => {
  switch (cat) {
    case "Orders": return <ShoppingBag className="h-4 w-4" />;
    case "Billing": return <CreditCard className="h-4 w-4" />;
    case "Security": return <Shield className="h-4 w-4" />;
    case "Platform": return <Terminal className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
};

const inferCategory = (title: string, message: string) => {
  const text = (title + " " + message).toLowerCase();
  if (text.includes("order") || text.includes("deliverable") || text.includes("service")) return "Orders";
  if (text.includes("invoice") || text.includes("payment") || text.includes("bill") || text.includes("credit")) return "Billing";
  if (text.includes("security") || text.includes("login") || text.includes("password") || text.includes("auth")) return "Security";
  return "Platform";
};

export const NotificationsEngine = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setItems((data as Notification[]) ?? []);
    };
    load();

    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    toast.success("All notifications marked as read");
  };

  const deleteAll = async () => {
    if (!user) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
    toast.success("All notifications cleared");
    setItems([]);
  };

  const handleClick = async (n: Notification) => {
    if (!n.is_read) await markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const filteredItems = items.filter(n => {
    if (activeCategory === "All") return true;
    return inferCategory(n.title, n.message) === activeCategory;
  });

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 px-0 hover:bg-primary/10 transition-colors">
          <Bell className="h-[18px] w-[18px]" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.8)] animate-pulse"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 glass-strong border-l border-primary/20 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border/40 text-left">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notification Center
            </SheetTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={markAllRead} title="Mark all read">
                <CheckCheck className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={deleteAll} title="Clear all">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                  activeCategory === cat 
                    ? "bg-primary text-primary-foreground shadow-glow" 
                    : "bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                )}
              >
                {cat !== "All" && getCategoryIcon(cat)}
                {cat}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-primary/40" />
              </div>
              <p className="text-base font-medium">No notifications</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
                {activeCategory === "All" 
                  ? "You're all caught up! We'll notify you when something important happens."
                  : `You don't have any notifications in the ${activeCategory} category.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              <AnimatePresence initial={false}>
                {filteredItems.map((n) => {
                  const cat = inferCategory(n.title, n.message);
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        "relative group w-full text-left px-6 py-4 hover:bg-primary/5 transition-colors flex gap-4 items-start cursor-pointer",
                        !n.is_read && "bg-primary/5",
                      )}
                      onClick={() => handleClick(n)}
                    >
                      <div className="mt-1 shrink-0">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          !n.is_read ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {getCategoryIcon(cat)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className={cn("text-sm font-semibold leading-tight", !n.is_read && "text-primary")}>{n.title}</p>
                          {!n.is_read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary),1)]" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-muted-foreground/70 font-mono uppercase tracking-wider mt-2">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
