import { useState, useEffect } from "react";
import { X, Download, Shield } from "lucide-react";

/**
 * PWAInstallBanner
 * Shows a dismissible install prompt when the browser fires `beforeinstallprompt`.
 * On iOS Safari (which doesn't fire the event), shows manual "Add to Home Screen" instructions.
 */

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome/.test(ua) && !/crios/.test(ua);
  return isIos && isSafari;
}

function isInStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function PWAInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showIosTip, setShowIosTip] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isInStandalone()) return;

    // Check if already dismissed this session
    if (sessionStorage.getItem("pwa-banner-dismissed")) return;

    // iOS manual tip
    if (isIosSafari()) {
      setShowIosTip(true);
      return;
    }

    // Android / Desktop install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-banner-dismissed", "1");
    setDismissed(true);
    setInstallPrompt(null);
    setShowIosTip(false);
  };

  if (dismissed) return null;

  // Android/Desktop Install Banner
  if (installPrompt) {
    return (
      <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
        <div className="glass border border-primary/30 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,243,255,0.15)] animate-glow-border">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-display font-bold text-foreground">Install StraxonSOC</div>
            <div className="text-[11px] text-muted-foreground font-mono truncate">Works offline · Faster access</div>
          </div>
          <button
            onClick={handleInstall}
            className="shrink-0 flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-mono px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // iOS "Add to Home Screen" instruction
  if (showIosTip) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
        <div className="glass border border-primary/30 rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,243,255,0.15)]">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-display font-bold text-foreground">Install on iPhone</span>
            </div>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
            Tap the <span className="text-primary font-bold">Share</span> button (
            <span className="font-mono">⬆</span>) at the bottom of Safari, then select{" "}
            <span className="text-primary font-bold">"Add to Home Screen"</span> to install the app.
          </p>
          {/* iOS share button indicator triangle */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-2 overflow-hidden">
            <div className="w-3 h-3 bg-card border-r border-b border-primary/30 rotate-45 translate-y-[-50%] mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
