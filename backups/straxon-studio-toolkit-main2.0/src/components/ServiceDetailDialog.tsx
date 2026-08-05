import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface ServiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    icon: LucideIcon;
    title: string;
    description: string;
    features?: string[];
    tech?: string[];
    subtitle?: string;
  } | null;
}

const ServiceDetailDialog = ({ open, onOpenChange, service }: ServiceDetailDialogProps) => {
  if (!service) return null;
  const Icon = service.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-primary/10 p-3">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            {service.subtitle && (
              <span className="text-xs font-mono text-primary tracking-wider uppercase">{service.subtitle}</span>
            )}
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">{service.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground leading-relaxed">{service.description}</DialogDescription>
        </DialogHeader>

        {service.features && (
          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-semibold text-foreground">Key Features</h4>
            <div className="grid grid-cols-1 gap-2">
              {service.features.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {service.tech && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Technologies</h4>
            <div className="flex flex-wrap gap-2">
              {service.tech.map((t) => (
                <span key={t} className="text-xs font-mono text-muted-foreground border border-border rounded px-2 py-1">{t}</span>
              ))}
            </div>
          </div>
        )}

        <Link
          to="/contact"
          onClick={() => onOpenChange(false)}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:box-glow-strong hover:scale-[1.02] w-full"
        >
          Discuss This Service <ArrowRight className="h-4 w-4" />
        </Link>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDetailDialog;
