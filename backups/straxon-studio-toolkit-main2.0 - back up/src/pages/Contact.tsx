import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Mail, Phone, MapPin, Send, ArrowRight, Linkedin, Github, Twitter } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const contactInfo = [
  { icon: Mail, label: "Email", value: "contact@straxonlabs.com", href: "mailto:contact@straxonlabs.com" },
  { icon: Phone, label: "Phone", value: "+1 (555) 000-0000", href: "tel:+15550000000" },
  { icon: MapPin, label: "Location", value: "Available Worldwide", href: "#" },
];

const socials = [
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: Github, label: "GitHub", href: "#" },
  { icon: Twitter, label: "Twitter", href: "#" },
];

const Contact = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:contact@straxonlabs.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`;
    window.location.href = mailtoLink;
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero */}
        <section ref={heroRef} className="relative min-h-[40vh] sm:min-h-[50vh] flex items-center justify-center overflow-hidden pt-16">
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-primary/5 border border-primary/10"
                style={{ width: 50 + i * 40, height: 50 + i * 40, left: `${30 + i * 15}%`, top: `${30 + (i % 2) * 20}%` }}
                animate={{ y: [0, -20, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
              />
            ))}
          </div>

          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 container mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <motion.span {...fadeUp} className="text-xs sm:text-sm font-mono text-primary tracking-widest uppercase">Contact Us</motion.span>
            <motion.h1 {...fadeUp} transition={{ delay: 0.1, duration: 0.6 }} className="mt-4 text-3xl sm:text-4xl md:text-6xl font-black text-foreground">
              Let's <span className="text-primary text-glow">Connect</span>
            </motion.h1>
            <motion.p {...fadeUp} transition={{ delay: 0.2, duration: 0.6 }} className="mt-4 sm:mt-6 text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a project in mind? We'd love to hear about it. Reach out and let's build something extraordinary together.
            </motion.p>
          </motion.div>
        </section>

        <section className="pb-16 sm:pb-28">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 sm:gap-12 max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-2 space-y-6 sm:space-y-8"
              >
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">Get in Touch</h3>
                  <div className="space-y-4 sm:space-y-5">
                    {contactInfo.map((item, i) => (
                      <motion.a
                        key={item.label}
                        href={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-3 sm:gap-4 group"
                      >
                        <div className="rounded-lg bg-primary/10 p-2.5 sm:p-3 group-hover:bg-primary/20 transition-colors">
                          <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs font-mono text-muted-foreground uppercase tracking-wider">{item.label}</p>
                          <p className="text-sm sm:text-base text-foreground font-medium">{item.value}</p>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Follow Us</h3>
                  <div className="flex gap-2 sm:gap-3">
                    {socials.map((s, i) => (
                      <motion.a
                        key={s.label}
                        href={s.href}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        className="rounded-lg border border-border bg-card p-2.5 sm:p-3 transition-all hover:border-primary/40 hover:box-glow"
                      >
                        <s.icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-primary transition-colors" />
                      </motion.a>
                    ))}
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="rounded-xl border border-border bg-card p-4 sm:p-6"
                >
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Our Divisions</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {["STRAXON Creative", "STRAXON Develop", "STRAXON Secure"].map((brand, i) => (
                      <motion.div
                        key={brand}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-[10px] sm:text-xs font-bold text-primary">{brand.split(" ")[1]?.[0]}</span>
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-foreground">{brand}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-3"
              >
                <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-4 sm:space-y-6">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">Send a Message</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="name" className="text-xs sm:text-sm">Name</Label>
                      <Input id="name" placeholder="Your name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="text-sm" />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                      <Input id="email" type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="subject" className="text-xs sm:text-sm">Subject</Label>
                    <Input id="subject" placeholder="Project inquiry" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required className="text-sm" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="message" className="text-xs sm:text-sm">Message</Label>
                    <textarea
                      id="message"
                      rows={5}
                      placeholder="Tell us about your project..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                      required
                    />
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 sm:py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:box-glow-strong"
                  >
                    Send Message <Send className="h-4 w-4" />
                  </motion.button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Contact;
