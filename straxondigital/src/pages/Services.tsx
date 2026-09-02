import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ServiceCard } from "@/components/ServiceCard";
import { ServiceCustomizerDialog } from "@/components/ServiceCustomizerDialog";
import { BundlesSection } from "@/components/BundlesSection";
import { SERVICES, CATEGORIES, ServiceDef } from "@/lib/services";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Filter, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ServicesPage = () => {
  const [category, setCategory] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high" | "name">("featured");
  const [customizingService, setCustomizingService] = useState<ServiceDef | null>(null);

  const visible = useMemo(() => {
    let result = SERVICES.filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (tierFilter !== "all" && s.tier !== tierFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.tagline.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.features.some((f) => f.toLowerCase().includes(q))
        );
      }
      return true;
    });

    if (sortBy === "price-low") {
      result = [...result].sort((a, b) => a.priceCents - b.priceCents);
    } else if (sortBy === "price-high") {
      result = [...result].sort((a, b) => b.priceCents - a.priceCents);
    } else if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [category, tierFilter, query, sortBy]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="container pt-32 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-mono uppercase tracking-wider text-primary">
              Straxon Labs · Autonomous Agency Catalog
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
            Pick your <span className="text-gradient">launch package</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-base sm:text-lg">
            Every engagement is engineered, customized, and delivered with machine precision — backed by human expert review and a 100% satisfaction guarantee.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-8 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={category === cat.id ? "default" : "outline"}
                onClick={() => setCategory(cat.id)}
                className={`text-xs ${
                  category === cat.id
                    ? "bg-gradient-primary text-primary-foreground border-0 shadow-glow"
                    : "border-border/60 hover:border-primary/40"
                }`}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Search, Filter & Sort Controls */}
          <div className="mt-5 grid sm:grid-cols-[1fr_auto_auto] gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="service-search"
                name="service-search"
                placeholder="Search resumes, websites, branding, AI scripts, SEO…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 glass w-full"
              />
            </div>

            <div className="flex gap-2">
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[140px] glass text-xs">
                  <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="digital">Digital Assets</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[150px] glass text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground font-mono">
            <p>Showing {visible.length} of {SERVICES.length} services</p>
            <span className="flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3 text-primary" /> Click Customize to configure tiers & add-ons
            </span>
          </div>
        </motion.div>
      </section>

      {/* Services Grid */}
      <section className="container pb-24">
        {visible.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
            <p className="text-lg font-medium text-foreground mb-2">No matching services found</p>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your category filter or search terms.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCategory("all");
                setTierFilter("all");
                setQuery("");
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {visible.map((s, i) => (
              <ServiceCard
                key={s.slug}
                service={s}
                index={i}
                onCustomize={(selected) => setCustomizingService(selected)}
              />
            ))}
          </motion.div>
        )}

        <div className="mt-16 pt-12 border-t border-border/40">
          <BundlesSection />
        </div>
      </section>

      {/* Interactive Customizer Modal */}
      <ServiceCustomizerDialog
        service={customizingService}
        open={Boolean(customizingService)}
        onOpenChange={(open) => {
          if (!open) setCustomizingService(null);
        }}
      />

      <Footer />
    </div>
  );
};

export default ServicesPage;
