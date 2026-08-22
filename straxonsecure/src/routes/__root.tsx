import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/AppShell";
import { SplashScreen } from "@/components/SplashScreen";
import { getSecurityHeaders } from "@/server/security/headers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const PUBLIC_ROUTES = ["/", "/auth", "/pricing"];

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Straxon Secure — Cyber Attack Simulation & Defense Platform" },
      {
        name: "description",
        content:
          "Interactive cybersecurity labs, SOC dashboard, architecture designer, and DevSecOps scanner. Learn attacks. Build defenses.",
      },
      { name: "author", content: "Straxon Secure" },
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
      { rel: "icon", type: "image/jpeg", href: "/straxonlogo.jpeg" },
      { rel: "apple-touch-icon", href: "/straxonlogo.jpeg" },
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

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <SplashScreen />
      <ProtectedRoute>
        <AppShell>
          <Outlet />
        </AppShell>
      </ProtectedRoute>
      <Toaster />
    </QueryClientProvider>
  );
}
