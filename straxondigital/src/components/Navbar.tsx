import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, LogOut, Shield, Menu, X, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { NotificationBell } from "@/components/NotificationBell";
import { CreditBalanceBadge } from "@/components/CreditBalanceBadge";
import { motion, AnimatePresence } from "framer-motion";

import { toast } from "sonner";

export const Navbar = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/services", label: "Services" },
    { to: "/pricing", label: "Pricing" },
    { to: "/automations", label: "Automations" },
    { to: "/reseller", label: "Agency Reseller" },
    { to: "/affiliates", label: "Partners" },
  ];

  return (
    <>
      {/* Top Promotional Announcement Bar */}
      <div className="fixed top-0 inset-x-0 z-50 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 backdrop-blur-md border-b border-primary/20 py-1.5 px-4 text-center text-xs font-mono text-foreground flex items-center justify-center gap-2">
        <span className="flex items-center gap-1.5 text-primary font-semibold">
          <Sparkles className="h-3 w-3 fill-primary" /> LAUNCH SPECIAL:
        </span>
        <span className="hidden sm:inline">Use code <strong className="text-primary font-bold">LAUNCH25</strong> for 25% off all services & turnkey suites.</span>
        <span className="sm:hidden">Code <strong className="text-primary font-bold">LAUNCH25</strong> for 25% off.</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText("LAUNCH25");
            toast.success("Coupon code LAUNCH25 copied to clipboard!");
          }}
          className="underline hover:text-primary transition-colors cursor-pointer ml-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          [Copy]
        </button>
      </div>

      <header 
        className={`fixed top-7 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "glass border-b border-border/40 py-0" : "bg-transparent border-transparent py-1"
        }`}
      >
        <div className="container px-4 sm:px-6 flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <BrandMark withWordmark wordmark="StraxonLabs" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `relative transition-all duration-300 hover:text-primary ${
                    isActive ? "text-primary font-medium" : "text-muted-foreground"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            {user ? (
              <>
                <CreditBalanceBadge />
                <NotificationBell />
                {role === "admin" && (
                  <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="hover:scale-105 active:scale-95 transition-transform">
                    <Shield className="h-4 w-4 mr-2" />Admin
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="hover:scale-105 active:scale-95 transition-transform">
                  <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
                <Button variant="outline" size="sm" onClick={signOut} className="hover:scale-105 active:scale-95 transition-transform">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="hover:scale-105 active:scale-95 transition-transform">
                  Sign in
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/services")}
                  className="bg-gradient-primary hover:opacity-90 text-primary-foreground border-0 shadow-glow hover:scale-105 active:scale-95 transition-transform"
                >
                  Get started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {user && <NotificationBell />}
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-xs glass-strong border-l border-border/50 p-6 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <BrandMark size={24} />
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <nav className="flex flex-col gap-6 text-lg">
                {navLinks.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === "/"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `transition-colors hover:text-primary ${
                        isActive ? "text-primary font-semibold" : "text-muted-foreground"
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-4 border-t border-border/40 pt-6">
                {user ? (
                  <>
                    <div className="py-1">
                      <CreditBalanceBadge />
                    </div>
                    {role === "admin" && (
                      <Button variant="outline" className="w-full justify-start" onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}>
                        <Shield className="h-4 w-4 mr-2" />Admin Panel
                      </Button>
                    )}
                    <Button variant="secondary" className="w-full justify-start" onClick={() => { navigate("/dashboard"); setMobileMenuOpen(false); }}>
                      <LayoutDashboard className="h-4 w-4 mr-2" />Dashboard
                    </Button>
                    <Button variant="destructive" className="w-full justify-start" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                      <LogOut className="h-4 w-4 mr-2" />Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}>
                      Sign in
                    </Button>
                    <Button
                      className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground border-0 shadow-glow"
                      onClick={() => { navigate("/services"); setMobileMenuOpen(false); }}
                    >
                      Get started
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
