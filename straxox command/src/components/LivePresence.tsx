import React, { useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth.store";

export const LivePresence = () => {
  const { sendPulseMessage } = useSocket();
  const location = useLocation();
  const { user } = useAuthStore();
  
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const displayName = user.name || user.email?.split("@")[0] || "User";
    
    // Broadcast our presence on this specific page
    sendPulseMessage({
      event: "presence_join",
      data: {
        userId: user.id,
        name: displayName,
        color: `hsl(${(displayName.charCodeAt(0) * 47) % 360}, 70%, 50%)`,
        page: location.pathname,
      }
    });

    const handlePresence = (e: any) => {
      const payload = e.detail.data;
      if (payload.page === location.pathname) {
        setActiveUsers(payload.users || []);
      }
    };

    window.addEventListener("pulse_presence", handlePresence);
    return () => {
      window.removeEventListener("pulse_presence", handlePresence);
    };
  }, [location.pathname, user, sendPulseMessage]);

  if (activeUsers.length <= 1) return null; // Don't show if it's just us

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Live</span>
      <div className="flex -space-x-2">
        <AnimatePresence>
          {activeUsers.filter(u => u.userId !== user?.id).map((u, i) => (
            <motion.div
              key={u.userId}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{ backgroundColor: u.color, zIndex: 10 - i }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-slate-950 shadow-lg relative group"
            >
              {u.name.charAt(0).toUpperCase()}
              
              {/* Tooltip */}
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-slate-200 text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none border border-slate-700 z-50">
                {u.name} is viewing this page
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
