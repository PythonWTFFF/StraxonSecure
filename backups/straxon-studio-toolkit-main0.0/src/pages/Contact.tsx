import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Phone, MapPin, Send, ArrowRight, Linkedin, Github, Twitter } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:contact@straxonlabs.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-28">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="text-sm font-mono text-primary tracking-widest uppercase">Contact Us</span>
            <h1 className="mt-4 text-4xl md:text-6xl font-black text-foreground">
              Let's <span className="text-primary text-glow">Connect</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a project in mind? We'd love to hear about it. Reach out and let's build something extraordinary together.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
            {/* Contact Info */}
            <motion.div {...fadeUp} transition={{ delay: 0.1, duration: 0.6 }} className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-6">Get in Touch</h3>
                <div className="space-y-5">
                  {contactInfo.map((item) => (
                    <a key={item.label} href={item.href} className="flex items-center gap-4 group">
                      <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{item.label}</p>
                        <p className="text-foreground font-medium">{item.value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      className="rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/40 hover:box-glow"
                    >
                      <s.icon className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Sub-brands */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Our Divisions</h3>
                <div className="space-y-3">
                  {["STRAXON Creative", "STRAXON Develop", "STRAXON Secure"].map((brand) => (
                    <div key={brand} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{brand.split(" ")[1]?.[0]}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{brand}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div {...fadeUp} transition={{ delay: 0.2, duration: 0.6 }} className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-8 space-y-6">
                <h3 className="text-xl font-bold text-foreground mb-2">Send a Message</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Project inquiry" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
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
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:box-glow-strong hover:scale-[1.02]"
                >
                  Send Message <Send className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
