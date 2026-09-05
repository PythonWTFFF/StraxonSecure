import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ServiceDef,
  PackageTier,
  PACKAGE_TIERS,
  GLOBAL_ADDONS,
  formatPrice,
  calculateCustomPrice,
} from "@/lib/services";
import {
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Clock,
  Layers,
  FileCheck2,
} from "lucide-react";

interface ServiceCustomizerDialogProps {
  service: ServiceDef | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServiceCustomizerDialog = ({
  service,
  open,
  onOpenChange,
}: ServiceCustomizerDialogProps) => {
  const navigate = useNavigate();
  const [tier, setTier] = useState<PackageTier>("pro");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([
    "rush-delivery",
  ]);

  if (!service) return null;

  const addons = service.customAddons || GLOBAL_ADDONS;
  const pricing = calculateCustomPrice(service.priceCents, tier, selectedAddons, addons);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handleProceed = () => {
    onOpenChange(false);
    const params = new URLSearchParams();
    params.set("tier", tier);
    if (selectedAddons.length > 0) {
      params.set("addons", selectedAddons.join(","));
    }
    navigate(`/checkout/${service.slug}?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto glass-strong border-primary/30 p-6 sm:p-8">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className="text-[11px] uppercase tracking-widest font-mono bg-primary/10 text-primary border-primary/20">
              {service.category}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <Clock className="h-3 w-3 text-primary" /> {service.turnaround}
            </span>
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
            Customize {service.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {service.tagline}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4">
          {/* Deliverables preview banner */}
          <div className="rounded-xl p-4 bg-muted/30 border border-border/50">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
              <FileCheck2 className="h-3.5 w-3.5 text-primary" /> Key Deliverables Included
            </h4>
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-foreground/90">
              {service.deliverables.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Package Tier Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Select Package Tier
              </h3>
              <span className="text-xs text-muted-foreground font-mono">3 Options</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {(Object.keys(PACKAGE_TIERS) as PackageTier[]).map((tKey) => {
                const tInfo = PACKAGE_TIERS[tKey];
                const isSelected = tier === tKey;
                const tierPrice = Math.round(service.priceCents * tInfo.multiplier);

                return (
                  <div
                    key={tKey}
                    onClick={() => setTier(tKey)}
                    className={`cursor-pointer rounded-xl p-4 transition-all relative border flex flex-col justify-between ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-glow ring-1 ring-primary/40"
                        : "bg-muted/20 border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm">{tInfo.name}</h4>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-0"
                              : "text-muted-foreground"
                          }`}
                        >
                          {tInfo.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{tInfo.description}</p>
                    </div>
                    <div className="pt-2 border-t border-border/40">
                      <span className="text-lg font-bold text-gradient">
                        {formatPrice(tierPrice)}
                      </span>
                      {service.cadence && (
                        <span className="text-xs text-muted-foreground">{service.cadence}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add-ons and Upgrades */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Power Add-ons & Fast-Tracks
              </h3>
              <span className="text-xs text-muted-foreground">Select any to customize</span>
            </div>

            <div className="space-y-2.5">
              {addons.map((addon) => {
                const isChecked = selectedAddons.includes(addon.id);
                return (
                  <label
                    key={addon.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? "bg-primary/10 border-primary/50"
                        : "bg-muted/20 border-border/40 hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleAddon(addon.id)}
                        className="mt-1 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">{addon.name}</span>
                          {addon.badge && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 text-primary border-primary/30">
                              {addon.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{addon.description}</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-semibold text-primary shrink-0 ml-4">
                      +{formatPrice(addon.priceCents)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Transparent Live Receipt Summary */}
          <div className="rounded-2xl p-5 bg-gradient-luxury border border-primary/30 space-y-3">
            <div className="flex justify-between items-center text-xs text-muted-foreground pb-2 border-b border-border/40 font-mono uppercase tracking-wider">
              <span>Configuration Summary</span>
              <span>Transparent Pricing</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{service.name} ({PACKAGE_TIERS[tier].name})</span>
                <span className="font-mono">{formatPrice(pricing.tierCents)}</span>
              </div>
              {selectedAddons.map((addonId) => {
                const item = addons.find((a) => a.id === addonId);
                if (!item) return null;
                return (
                  <div key={addonId} className="flex justify-between text-xs text-muted-foreground">
                    <span className="truncate pr-4">+ {item.name}</span>
                    <span className="font-mono">{formatPrice(item.priceCents)}</span>
                  </div>
                );
              })}
            </div>
            <div className="pt-3 border-t border-border/40 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Total customized price</p>
                <p className="text-3xl font-bold text-gradient">
                  {formatPrice(pricing.totalCents)}
                  {service.cadence && <span className="text-sm text-muted-foreground font-normal">{service.cadence}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-green-400" />
                <span>100% Satisfaction Guarantee</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleProceed}
            className="bg-gradient-primary text-primary-foreground border-0 shadow-glow px-6 py-2.5 font-semibold text-sm hover:scale-[1.02] active:scale-95 transition-transform"
          >
            Confirm & Order Now <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
