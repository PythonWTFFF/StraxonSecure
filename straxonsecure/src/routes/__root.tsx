import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/AppShell";
import { SplashScreen } from "@/components/SplashScreen";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display neon-text">404</h1>
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

export const Route = createRootRoute({
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
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
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
    <>
      <SplashScreen />
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster />
    </>
  );
}
