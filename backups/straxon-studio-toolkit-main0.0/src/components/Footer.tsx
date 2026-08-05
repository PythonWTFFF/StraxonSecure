import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link to="/" className="text-lg font-black text-foreground">
              STRAXON<span className="text-primary">LABS</span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Design • Development • Automation • Security
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Services</h4>
            <div className="space-y-2">
              <Link to="/services" className="block text-sm text-muted-foreground hover:text-primary transition-colors">All Services</Link>
              <Link to="/design-portfolio" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Design Portfolio</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Company</h4>
            <div className="space-y-2">
              <Link to="/projects" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Projects</Link>
              <Link to="/contact" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Divisions</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Straxon Creative</p>
              <p>Straxon Develop</p>
              <p>Straxon Secure</p>
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} STRAXON LABS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
