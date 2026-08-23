import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { PageTransition } from "./PageTransition";

// Lazy loaded routes for advanced code splitting and hyper-performance
const Home = lazy(() => import("../pages/Home"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Invoices = lazy(() => import("../pages/Invoices"));
const Clients = lazy(() => import("../pages/Clients"));
const Proposals = lazy(() => import("../pages/Proposals"));
const Deals = lazy(() => import("../pages/Deals"));
const Projects = lazy(() => import("../pages/Projects"));
const Intelligence = lazy(() => import("../pages/Intelligence"));
const Team = lazy(() => import("../pages/Team"));
const AuditLog = lazy(() => import("../pages/AuditLog"));
const DevTools = lazy(() => import("../pages/DevTools"));
const Automations = lazy(() => import("../pages/Automations"));
const NotFound = lazy(() => import("../pages/NotFound"));

const FuturisticLoader = () => (
  <div className="flex h-[80vh] w-full items-center justify-center">
    <div className="relative flex h-16 w-16 items-center justify-center">
      <div className="absolute h-full w-full rounded-full border-4 border-primary/20"></div>
      <div className="absolute h-full w-full rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
    </div>
  </div>
);

const LazyRoute = ({ Component }: { Component: React.LazyExoticComponent<any> }) => (
  <PageTransition>
    <Suspense fallback={<FuturisticLoader />}>
      <Component />
    </Suspense>
  </PageTransition>
);

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LazyRoute Component={Home} />} />
        <Route path="/dashboard" element={<LazyRoute Component={Dashboard} />} />
        <Route path="/invoices" element={<LazyRoute Component={Invoices} />} />
        <Route path="/clients" element={<LazyRoute Component={Clients} />} />
        <Route path="/proposals" element={<LazyRoute Component={Proposals} />} />
        <Route path="/deals" element={<LazyRoute Component={Deals} />} />
        <Route path="/projects" element={<LazyRoute Component={Projects} />} />
        <Route path="/intelligence" element={<LazyRoute Component={Intelligence} />} />
        <Route path="/team" element={<LazyRoute Component={Team} />} />
        <Route path="/audit-log" element={<LazyRoute Component={AuditLog} />} />
        <Route path="/dev-tools" element={<LazyRoute Component={DevTools} />} />
        <Route path="/automations" element={<LazyRoute Component={Automations} />} />
        <Route path="*" element={<LazyRoute Component={NotFound} />} />
      </Routes>
    </AnimatePresence>
  );
};
