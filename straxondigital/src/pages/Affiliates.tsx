import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AffiliateHub } from "@/components/AffiliateHub";
import { motion } from "framer-motion";

const AffiliatesPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container pt-32 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AffiliateHub />
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default AffiliatesPage;
