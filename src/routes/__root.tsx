import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/AppShell";
import { SplashScreen } from "@/components/SplashScreen";
import { BottomNav } from "@/components/cyber/BottomNav";
import { getSecurityHeaders } from "@/server/security/headers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { analytics } from "@/lib/analytics";
import { PWAInstallBanner } from "@/components/layout/PWAInstallBanner";

// Initialize Sentry
if (typeof window !== "undefined") {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || "",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enabled: !!import.meta.env.VITE_SENTRY_DSN
  });

  // Suppress specific harmless Three.js warnings from polluting the console
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return;
    originalWarn(...args);
  };
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes (reduces DB load for heavy traffic)
      gcTime: 10 * 60 * 1000, // 10 minutes cache retention
      retry: 2,
      refetchOnWindowFocus: false, // Prevents spamming Supabase on tab switch
    },
  },
});

const PUBLIC_ROUTES = ["/", "/auth", "/pricing"];

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Track pageviews
    analytics.track("$pageview", { path: location.pathname });

    if (!loading && !user && !PUBLIC_ROUTES.includes(location.pathname)) {
      navigate({ to: "/auth", replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) return null;

  if (!user && !PUBLIC_ROUTES.includes(location.pathname)) {
    return null;
  }

  return <>{children}</>;
}

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display neon-text animate-glitch" data-text="404">
          404
        </h1>
        <h2 className="mt-4 text-xl font-display text-foreground">Signal Lost</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The endpoint you're scanning doesn't exist on this network.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 glow-cyan"
          >
            Return to Base
          </Link>
        </div>
      </div>
    </div>
  );
}

import { CyberError } from "@/components/CyberError";

export const Route = createRootRoute({
  headers: () => getSecurityHeaders(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#00f3ff" },
      { title: "Straxon Secure — Cyber Attack Simulation & Defense Platform" },
      {
        name: "description",
        content:
          "Interactive cybersecurity labs, SOC dashboard, architecture designer, and DevSecOps scanner. Learn attacks. Build defenses.",
      },
      { name: "author", content: "Straxon Secure" },
      // iOS PWA support
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "StraxonSOC" },
      { name: "application-name", content: "StraxonSOC" },
      { name: "msapplication-TileColor", content: "#020610" },
      { name: "msapplication-tap-highlight", content: "no" },
      // OG / Social
      { property: "og:title", content: "Straxon Secure — Cyber Defense Platform" },
      {
        property: "og:description",
        content: "Hands-on attack labs, real-time SOC, and AI-assisted security architecture.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://straxonlabs.vercel.app/straxonlogo.jpeg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://straxonlabs.vercel.app/straxonlogo.jpeg" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", type: "image/jpeg", href: "/straxonlogo.jpeg" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "apple-touch-icon", sizes: "152x152", href: "/icon-192.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/icon-192.png" },
      { rel: "apple-touch-icon", sizes: "167x167", href: "/icon-192.png" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: CyberError,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" && !navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-warning/90 text-warning-foreground py-1 text-center text-xs font-mono backdrop-blur-sm border-b border-warning">
      <span className="flex justify-center items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
        </span>
        OFFLINE MODE — Working from local cache. Real-time updates paused.
      </span>
    </div>
  );
}

function RootComponent() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => console.log("SW registered:", registration.scope),
          (error) => console.log("SW registration failed:", error)
        );
      });
    }
    
    // iOS specific install prompt logic could go here
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIos() && !isInStandaloneMode()) {
      console.log("Recommend user to add to home screen");
      // Could show a toast here instructing iOS users to add to home screen
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      <SplashScreen />
      <ProtectedRoute>
        <AppShell>
          <Outlet />
        </AppShell>
        <BottomNav />
      </ProtectedRoute>
      <PWAInstallBanner />
      <Toaster />
    </QueryClientProvider>
  );
}
