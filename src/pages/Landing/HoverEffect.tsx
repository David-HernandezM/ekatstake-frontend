import { motion } from "framer-motion";

export function HoverEffect() {
  return (
    <motion.div
      className="relative flex size-48 items-center justify-center"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <div className="absolute inset-0 rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(circle, rgba(19,127,236,0.6) 0%, transparent 70%)' }} />
      <div className="flex size-36 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-blue-600 shadow-primary-glow-lg">
        <span className="material-symbols-outlined text-white text-6xl">deployed_code</span>
      </div>
    </motion.div>
  );
}
