import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceProvider } from "@/lib/workspaces";
import { AppLayout } from "@/components/AppLayout";
import { CommandPalette } from "@/components/layout/command-palette";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Clients from "./pages/Clients";
import Proposals from "./pages/Proposals";
import AuditLog from "./pages/AuditLog";
import DevTools from "./pages/DevTools";
import NotFound from "./pages/NotFound";
import { SocketProvider } from "./contexts/SocketContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Deals from "./pages/Deals";
import Projects from "./pages/Projects";
import ClientPortal from "./pages/ClientPortal";
import { AnimatedRoutes } from "./components/AnimatedRoutes";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <WorkspaceProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/portal/:token" element={<ClientPortal />} />
                <Route element={<ProtectedRoute />}>
                  <Route
                    path="/*"
                    element={
                      <AppLayout>
                        <AnimatedRoutes />
                      </AppLayout>
                    }
                  />
                </Route>
              </Routes>
              <CommandPalette />
            </WorkspaceProvider>
          </BrowserRouter>
        </TooltipProvider>
      </SocketProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
