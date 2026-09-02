import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, LogOut, Shield, Menu, X, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { NotificationsEngine } from "@/components/NotificationsEngine";
import { CreditBalanceBadge } from "@/components/CreditBalanceBadge";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { MagneticButton } from "@/components/MagneticButton";
import { motion, AnimatePresence } from "framer-motion";
import { ServicesMegaMenu } from "./ServicesMegaMenu";
import { AnimatedCounter } from "./AnimatedCounter";

import { toast } from "sonner";

export const Navbar = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

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
              <div 
                key={l.to} 
                className="relative flex items-center h-full py-4"
                onMouseEnter={() => l.label === "Services" && setServicesOpen(true)}
                onMouseLeave={() => l.label === "Services" && setServicesOpen(false)}
              >
                <NavLink
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) =>
                    `relative transition-all duration-300 hover:text-primary ${
                      isActive ? "text-primary font-medium" : "text-muted-foreground"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {l.label}
                      {isActive && (
                        <motion.div
                          layoutId="navDot"
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_rgb(var(--primary))] animate-pulse"
                        />
                      )}
                    </>
                  )}
                </NavLink>
                {l.label === "Services" && <ServicesMegaMenu isOpen={servicesOpen} />}
              </div>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            <CurrencyToggle />
            {user ? (
              <>
                <CreditBalanceBadge />
                <NotificationsEngine />
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
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                  <Button
                    size="sm"
                    onClick={() => navigate("/auth")}
                    className="relative bg-background hover:bg-background text-primary border border-primary/50 hover:border-primary shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    Start Free <Sparkles className="ml-1.5 h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Header Actions */}
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
            <CurrencyToggle />
            {user && <NotificationsEngine />}
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Full Screen Overlay) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col md:hidden overflow-y-auto"
          >
            <div className="container px-4 py-6 flex items-center justify-between border-b border-border/40">
              <BrandMark size={24} />
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="container px-4 py-8 flex-1 flex flex-col">
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-8 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Total Platform Revenue</p>
                  <p className="text-lg font-bold font-mono text-primary flex items-center mt-1">
                    <AnimatedCounter value={1.2} prefix="₹" suffix="Cr+" decimals={1} duration={1} />
                  </p>
                </div>
                <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              </div>

              <nav className="flex flex-col gap-6 text-2xl font-semibold mb-12">
                {navLinks.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === "/"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `transition-colors flex items-center ${
                        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {l.label}
                        {isActive && <div className="ml-3 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgb(var(--primary))]" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-4 border-t border-border/40 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground font-medium">Currency Preference</span>
                  <CurrencyToggle />
                </div>
                {user ? (
                  <>
                    <div className="py-1">
                      <CreditBalanceBadge />
                    </div>
                    {role === "admin" && (
                      <Button variant="outline" className="w-full justify-start h-12 text-base" onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}>
                        <Shield className="h-5 w-5 mr-2" />Admin Panel
                      </Button>
                    )}
                    <Button variant="secondary" className="w-full justify-start h-12 text-base" onClick={() => { navigate("/dashboard"); setMobileMenuOpen(false); }}>
                      <LayoutDashboard className="h-5 w-5 mr-2" />Dashboard
                    </Button>
                    <Button variant="destructive" className="w-full justify-start h-12 text-base" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                      <LogOut className="h-5 w-5 mr-2" />Sign out
                    </Button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <Button variant="outline" className="h-14 text-base" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}>
                      Sign in
                    </Button>
                    <div className="relative group w-full">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-lg blur opacity-75 animate-pulse"></div>
                      <Button
                        className="relative w-full h-14 text-base bg-background text-primary border border-primary/50"
                        onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}
                      >
                        Start Free
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
