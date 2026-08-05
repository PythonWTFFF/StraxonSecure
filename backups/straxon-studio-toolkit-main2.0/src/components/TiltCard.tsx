import { ReactNode, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  intensity?: number;
}

const TiltCard = ({ children, className = "", onClick, intensity = 10 }: TiltCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { damping: 20, stiffness: 200 });
  const springRotateY = useSpring(rotateY, { damping: 20, stiffness: 200 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(-y * intensity);
    rotateY.set(x * intensity);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ 
        boxShadow: "0 25px 50px -12px hsl(190 95% 50% / 0.15), 0 0 30px hsl(190 95% 50% / 0.1)",
      }}
    >
      {/* Spotlight effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 pointer-events-none z-10"
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), hsl(190 95% 50% / 0.06), transparent 40%)`,
          }}
        />
      )}
      {children}
    </motion.div>
  );
};

export default TiltCard;
