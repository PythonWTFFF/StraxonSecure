import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface ProjectDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    icon: LucideIcon;
    title: string;
    category: string;
    description: string;
    features: string[];
    tech: string[];
    color: string;
  } | null;
}

const ProjectDetailDialog = ({ open, onOpenChange, project }: ProjectDetailDialogProps) => {
  if (!project) return null;
  const Icon = project.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border bg-card">
        <DialogHeader>
          <div className={`h-40 rounded-lg bg-gradient-to-br ${project.color} flex items-center justify-center mb-4`}>
            <Icon className="h-16 w-16 text-primary/60" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-primary tracking-wider uppercase bg-primary/10 px-2.5 py-1 rounded">{project.category}</span>
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">{project.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground leading-relaxed">{project.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-semibold text-foreground">Highlights</h4>
          <div className="grid grid-cols-1 gap-2">
            {project.features.map((f) => (
              <div key={f} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Tech Stack</h4>
          <div className="flex flex-wrap gap-2">
            {project.tech.map((t) => (
              <span key={t} className="text-xs font-mono text-muted-foreground border border-border rounded px-2 py-1">{t}</span>
            ))}
          </div>
        </div>

        <Link
          to="/contact"
          onClick={() => onOpenChange(false)}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:box-glow-strong hover:scale-[1.02] w-full"
        >
          Start a Similar Project <ArrowRight className="h-4 w-4" />
        </Link>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailDialog;
