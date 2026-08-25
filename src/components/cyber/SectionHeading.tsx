import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {eyebrow && (
        <div className="flex items-center gap-2 text-xs font-mono tracking-[0.3em] text-primary uppercase">
          <span className="h-px w-8 bg-primary" />
          {eyebrow}
        </div>
      )}
      <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{title}</h1>
      {description && <p className="text-muted-foreground max-w-2xl">{description}</p>}
    </div>
  );
}
