import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DebugConsole } from "@/components/DebugConsole";
import { useWorkspace } from "@/lib/workspaces";
import { useState, useEffect } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { workspace } = useWorkspace();
  const [syncing, setSyncing] = useState(false);

  // Listen for custom sync events
  useEffect(() => {
    const handler = () => {
      setSyncing(true);
      setTimeout(() => setSyncing(false), 1500);
    };
    window.addEventListener("straxon:sync", handler);
    return () => window.removeEventListener("straxon:sync", handler);
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/50 px-4 backdrop-blur-sm bg-background/80 sticky top-0 z-30">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="ml-auto flex items-center gap-3">
              {syncing && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                  <span className="text-[10px] font-mono text-warning">SYNCING...</span>
                </div>
              )}
              <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
              <span className="text-xs font-mono text-muted-foreground">SYS:ONLINE</span>
              <span className="text-[10px] font-mono text-muted-foreground/50 hidden sm:inline">· {workspace.name}</span>
            </div>
          </header>
          <main className="flex-1 p-6 grid-bg overflow-auto">
            <ErrorBoundary fallbackTitle="Page Module">
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
      <DebugConsole />
    </SidebarProvider>
  );
}
