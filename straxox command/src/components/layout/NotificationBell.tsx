import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCheck, TrendingUp, Briefcase, FileText, Users, Zap, WifiOff } from "lucide-react";
import { useSocket } from "../../contexts/SocketContext";

interface Notification {
  id: string;
  type: "deal" | "project" | "invoice" | "client" | "task" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const EVENT_MAP: Record<string, { type: Notification["type"]; title: string; message: string; icon: any }> = {
  invalidate_deals:    { type: "deal",    title: "Deals Updated",    message: "Sales pipeline has been updated",       icon: TrendingUp },
  invalidate_projects: { type: "project", title: "Project Updated",  message: "A project or task has changed",         icon: Briefcase  },
  invalidate_invoices: { type: "invoice", title: "Invoice Activity", message: "Invoice records have been updated",     icon: FileText   },
  invalidate_clients:  { type: "client",  title: "Client Updated",   message: "Client data has been updated",          icon: Users      },
  invalidate_tasks:    { type: "task",    title: "Task Updated",     message: "A task status has changed",             icon: Zap        },
  invalidate_dashboard:{ type: "system",  title: "Dashboard Sync",   message: "Dashboard data has been refreshed",    icon: Zap        },
};

const TYPE_COLORS: Record<string, string> = {
  deal:    "text-indigo-400 bg-indigo-500/10",
  project: "text-cyan-400   bg-cyan-500/10",
  invoice: "text-green-400  bg-green-500/10",
  client:  "text-violet-400 bg-violet-500/10",
  task:    "text-amber-400  bg-amber-500/10",
  system:  "text-zinc-400   bg-zinc-700/40",
};

const STORAGE_KEY = "straxon_notifications";
const MAX_NOTIFICATIONS = 50;

function loadNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
  } catch {
    return [];
  }
}

function saveNotifications(notifs: Notification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, MAX_NOTIFICATIONS)));
  } catch {}
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(loadNotifications);
  const panelRef = useRef<HTMLDivElement>(null);
  const { socket, connectionState } = useSocket();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    // Close on outside click
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const addNotification = (event: string) => {
      const config = EVENT_MAP[event];
      if (!config) return;
      const notif: Notification = {
        id: `${event}-${Date.now()}`,
        type: config.type,
        title: config.title,
        message: config.message,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => {
        const updated = [notif, ...prev].slice(0, MAX_NOTIFICATIONS);
        saveNotifications(updated);
        return updated;
      });
    };

    Object.keys(EVENT_MAP).forEach((event) => {
      socket.on(event, () => addNotification(event));
    });

    return () => {
      Object.keys(EVENT_MAP).forEach((event) => socket.off(event));
    };
  }, [socket]);

  const markAllRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const markRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => n.id === id ? { ...n, read: true } : n);
      saveNotifications(updated);
      return updated;
    });
  };

  const formatTime = (d: Date) => {
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => { setOpen((o) => !o); if (!open && unreadCount > 0) {} }}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700"
      >
        <Bell className="w-4 h-4" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-lg shadow-red-900/50"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Connection State Indicator */}
      {connectionState !== "connected" && (
        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${connectionState === "reconnecting" ? "bg-amber-500 animate-pulse" : "bg-red-500"}`} title={connectionState} />
      )}

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 w-80 max-h-[480px] flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-200 tracking-wide">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-mono">{unreadCount} new</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} title="Mark all read" className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors">
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={clearAll} title="Clear all" className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Bell className="w-8 h-8 text-zinc-700 mb-3" />
                  <p className="text-zinc-500 text-sm">No notifications yet</p>
                  <p className="text-zinc-700 text-xs mt-1">Events will appear here as you work</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notif, i) => {
                    const colorCls = TYPE_COLORS[notif.type] || TYPE_COLORS["system"];
                    const IconComp = EVENT_MAP[`invalidate_${notif.type}`]?.icon || Zap;
                    return (
                      <motion.button
                        key={notif.id}
                        layout
                        onClick={() => markRead(notif.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-zinc-800/50 last:border-0 transition-colors hover:bg-zinc-900 ${!notif.read ? "bg-zinc-900/40" : ""}`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${colorCls}`}>
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs font-semibold ${!notif.read ? "text-zinc-100" : "text-zinc-400"}`}>{notif.title}</p>
                            <span className="text-[10px] text-zinc-600 font-mono flex-shrink-0">{formatTime(notif.timestamp)}</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{notif.message}</p>
                        </div>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5 shadow-[0_0_6px_var(--glow-cyan)]" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-zinc-800 flex-shrink-0">
                <p className="text-[10px] text-zinc-600 text-center font-mono">
                  {notifications.length} notification{notifications.length !== 1 ? "s" : ""} · Real-time via Socket.io
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
