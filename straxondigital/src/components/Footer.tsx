import { Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { Mail, MessageCircle, Shield } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/40 mt-12">
      <div className="container py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <BrandMark withWordmark wordmark="STRAXON LABS" />
          <p className="mt-4 text-sm text-muted-foreground max-w-md">
            Straxon Labs — automated digital deliverables, engineered with surgical precision.
            If anything ever falls short, our team is one click away.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span>100% money-back guarantee on every order.</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-mono uppercase tracking-[0.25em] text-primary mb-3">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="story-link hover:text-primary">Home</Link></li>
            <li><Link to="/services" className="story-link hover:text-primary">Services</Link></li>
            <li><Link to="/dashboard" className="story-link hover:text-primary">Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-mono uppercase tracking-[0.25em] text-primary mb-3">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/contact" className="story-link inline-flex items-center gap-1.5 hover:text-primary">
                <MessageCircle className="h-3.5 w-3.5" /> Contact us
              </Link>
            </li>
            <li>
              <a href="mailto:support@straxonlabs.com" className="story-link inline-flex items-center gap-1.5 hover:text-primary">
                <Mail className="h-3.5 w-3.5" /> support@straxonlabs.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/40">
        <div className="container py-5 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2 font-mono">
          <span>© {new Date().getFullYear()} Straxon Labs. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
