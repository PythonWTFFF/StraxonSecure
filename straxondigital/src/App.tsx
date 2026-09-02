import { useState, Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CursorGlow } from "@/components/CursorGlow";
import { ParticleField } from "@/components/ParticleField";
import { SplashScreen } from "@/components/SplashScreen";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Services = lazy(() => import("./pages/Services"));
const Auth = lazy(() => import("./pages/Auth"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PublicView = lazy(() => import("./pages/PublicView"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Automations = lazy(() => import("./pages/Automations"));
const Affiliates = lazy(() => import("./pages/Affiliates"));
const Reseller = lazy(() => import("./pages/Reseller"));
const ReportView = lazy(() => import("./pages/ReportView"));
import { LiveSocialProof } from "@/components/LiveSocialProof";
import { CurrencyProvider } from "@/context/CurrencyContext";

const queryClient = new QueryClient();

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full min-h-screen"
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/services" element={<PageWrapper><Services /></PageWrapper>} />
        <Route path="/pricing" element={<PageWrapper><Pricing /></PageWrapper>} />
        <Route path="/automations" element={<PageWrapper><Automations /></PageWrapper>} />
        <Route path="/affiliates" element={<PageWrapper><Affiliates /></PageWrapper>} />
        <Route path="/reseller" element={<PageWrapper><Reseller /></PageWrapper>} />
        <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
        <Route path="/auth" element={<PageWrapper><Auth /></PageWrapper>} />
        <Route path="/checkout/:slug" element={<PageWrapper><Checkout /></PageWrapper>} />
        <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/admin" element={<PageWrapper><Admin /></PageWrapper>} />
        <Route path="/view/:token" element={<PageWrapper><PublicView /></PageWrapper>} />
        <Route path="/report/:token" element={<PageWrapper><ReportView /></PageWrapper>} />
        <Route path="/reset-password" element={<PageWrapper><ResetPassword /></PageWrapper>} />
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner theme="dark" />
          {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
          <ParticleField density={1200} />
          <CursorGlow />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <AnimatedRoutes />
            </Suspense>
            <LiveSocialProof />
          </BrowserRouter>
        </TooltipProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
};

export default App;
