import { Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { Mail, MessageCircle, Shield, Globe, MapPin, Phone, CreditCard, Activity } from "lucide-react";
import { motion } from "framer-motion";

export const Footer = () => {
  return (
    <footer className="border-t border-border/40 mt-12 bg-background/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial opacity-30 pointer-events-none" />
      <div className="container py-16 grid gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10">
        
        {/* Column 1: Brand & Promise */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
        >
          <BrandMark withWordmark wordmark="StraxonLabs" />
          <p className="mt-4 text-sm text-muted-foreground">
            Automated digital deliverables, engineered with surgical precision. 
            If anything ever falls short, our team is one click away.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 p-2 rounded-md border border-primary/10">
              <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>100% money-back guarantee on every order.</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 p-2 rounded-md border border-primary/10">
              <Activity className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </motion.div>

        {/* Column 2: Platform Links */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.8, delay: 0.1 }}
        >
          <h4 className="text-xs font-mono uppercase tracking-[0.25em] text-primary mb-4">Platform</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-primary transition-colors flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-primary/50" /> Home</Link></li>
            <li><Link to="/services" className="hover:text-primary transition-colors flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-primary/50" /> Services</Link></li>
            <li><Link to="/automations" className="hover:text-primary transition-colors flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-primary/50" /> Automations Hub</Link></li>
            <li><Link to="/reseller" className="hover:text-primary transition-colors flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-primary/50" /> Agency Reseller</Link></li>
            <li><Link to="/dashboard" className="hover:text-primary transition-colors flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-primary/50" /> Dashboard</Link></li>
          </ul>
        </motion.div>

        {/* Column 3: Contact (India & Global) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.8, delay: 0.2 }}
        >
          <h4 className="text-xs font-mono uppercase tracking-[0.25em] text-primary mb-4">Contact</h4>
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-foreground">Global HQ</p>
                <p className="text-xs">Bengaluru, India</p>
                <p className="text-xs text-muted-foreground mt-0.5">Serving 14+ Countries</p>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <MessageCircle className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs">WhatsApp Business</p>
                <a href="#" className="font-medium hover:text-primary transition-colors">+91 98765 43210</a>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs">International Toll-Free</p>
                <a href="#" className="font-medium hover:text-primary transition-colors">+1 (800) 123-4567</a>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs">Support</p>
                <a href="mailto:support@straxonlabs.com" className="font-medium hover:text-primary transition-colors">support@straxonlabs.com</a>
              </div>
            </li>
          </ul>
        </motion.div>

        {/* Column 4: Compliance & Seals */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.8, delay: 0.3 }}
        >
          <h4 className="text-xs font-mono uppercase tracking-[0.25em] text-primary mb-4">Trust & Compliance</h4>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="glass rounded flex flex-col items-center justify-center p-3 text-center border-primary/20 hover:border-primary/50 transition-colors">
              <Shield className="h-5 w-5 text-primary mb-1" />
              <span className="text-[10px] font-bold">SOC-2 Type II</span>
            </div>
            <div className="glass rounded flex flex-col items-center justify-center p-3 text-center border-primary/20 hover:border-primary/50 transition-colors">
              <Globe className="h-5 w-5 text-primary mb-1" />
              <span className="text-[10px] font-bold">ISO 27001</span>
            </div>
            <div className="glass rounded flex flex-col items-center justify-center p-3 text-center border-primary/20 hover:border-primary/50 transition-colors">
              <CreditCard className="h-5 w-5 text-primary mb-1" />
              <span className="text-[10px] font-bold">Stripe Verified</span>
            </div>
            <div className="glass rounded flex flex-col items-center justify-center p-3 text-center border-primary/20 hover:border-primary/50 transition-colors bg-gradient-to-br from-primary/10 to-transparent">
              <span className="text-xs font-black text-primary leading-none">GST</span>
              <span className="text-[9px] font-bold mt-1 leading-tight">Verified India</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
            All payments are processed securely. Your data is encrypted at rest and in transit.
          </p>
        </motion.div>
      </div>

      <div className="border-t border-border/40 relative z-10 bg-black/20">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-mono">
            © {new Date().getFullYear()} Straxon Labs. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/refunds" className="hover:text-primary transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
