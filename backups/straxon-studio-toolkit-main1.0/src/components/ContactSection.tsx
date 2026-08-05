import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ContactSection = () => {
  return (
    <section id="contact" className="py-28 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Ready to Build Something{" "}
            <span className="text-primary text-glow">Extraordinary</span>?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Let's discuss how STRAXON LABS can engineer the perfect digital solution for your business.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-10 py-4 text-base font-semibold text-primary-foreground transition-all hover:box-glow-strong hover:scale-105"
          >
            Start a Conversation
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
