import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";

export const DemoWidget = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Link to="/auth?demo=true">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative px-5 py-3 bg-background border border-primary/50 rounded-full flex items-center gap-2 shadow-xl hover:bg-primary/5 transition-colors cursor-pointer">
                <div className="h-2 w-2 rounded-full bg-primary animate-ping absolute left-5"></div>
                <div className="h-2 w-2 rounded-full bg-primary z-10"></div>
                <span className="text-sm font-semibold pl-3 pr-1">Try Live Demo</span>
                <Play className="h-4 w-4 text-primary fill-primary/20" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
