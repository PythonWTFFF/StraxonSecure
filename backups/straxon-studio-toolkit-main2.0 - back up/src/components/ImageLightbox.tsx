import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

const ImageLightbox = ({ images, initialIndex = 0, open, onClose }: ImageLightboxProps) => {
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => { setCurrent(initialIndex); }, [initialIndex]);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, prev, next]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-xl flex items-center justify-center"
          onClick={onClose}
        >
          <button onClick={onClose} className="absolute top-6 right-6 text-foreground hover:text-primary transition-colors z-10">
            <X className="h-8 w-8" />
          </button>

          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 md:left-8 text-foreground hover:text-primary transition-colors z-10">
                <ChevronLeft className="h-10 w-10" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 md:right-8 text-foreground hover:text-primary transition-colors z-10">
                <ChevronRight className="h-10 w-10" />
              </button>
            </>
          )}

          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
          >
            <div className="relative rounded-xl border border-border bg-card overflow-hidden">
              <img
                src={images[current]}
                alt={`Image ${current + 1}`}
                className="max-w-[90vw] max-h-[80vh] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `
                    <div class="w-[60vw] h-[50vh] flex items-center justify-center bg-card border border-dashed border-primary/30 rounded-xl">
                      <div class="text-center">
                        <div class="text-6xl text-primary/20 mb-4">📷</div>
                        <p class="text-muted-foreground font-mono text-sm">Image placeholder</p>
                        <p class="text-muted-foreground/50 text-xs mt-1">${images[current]}</p>
                      </div>
                    </div>
                  `;
                }}
              />
            </div>
          </motion.div>

          {images.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? "bg-primary scale-125" : "bg-muted-foreground/30 hover:bg-muted-foreground/60"}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;
