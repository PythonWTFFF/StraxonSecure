import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ServiceCard } from "@/components/ServiceCard";
import { SERVICES } from "@/lib/services";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

const TIERS = [
  { id: "all", label: "All" },
  { id: "one-time", label: "One-time" },
  { id: "subscription", label: "Subscription" },
  { id: "digital", label: "Digital products" },
] as const;

const ServicesPage = () => {
  const [filter, setFilter] = useState<typeof TIERS[number]["id"]>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    return SERVICES.filter((s) => {
      if (filter !== "all" && s.tier !== filter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.tagline.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filter, query]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="container pt-32 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs uppercase tracking-[0.3em] font-mono text-primary mb-3">/ Services</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
            Pick your launch package
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Each engagement is scoped, priced and delivered with automation-grade precision — and a real human team behind every order.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 glass"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {TIERS.map((t) => (
                <Button
                  key={t.id}
                  size="sm"
                  variant={filter === t.id ? "default" : "outline"}
                  onClick={() => setFilter(t.id)}
                  className={filter === t.id ? "bg-gradient-primary text-primary-foreground border-0" : "border-primary/30"}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground font-mono">
            Showing {visible.length} of {SERVICES.length} services
          </p>
        </motion.div>
      </section>

      <section className="container pb-24">
        {visible.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
            No services match. Try a different search.
          </div>
        ) : (
          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {visible.map((s, i) => <ServiceCard key={s.slug} service={s} index={i} />)}
          </motion.div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default ServicesPage;
