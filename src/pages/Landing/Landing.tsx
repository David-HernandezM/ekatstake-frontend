import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Section2 } from "./Section2";
import { Section3 } from "./Section3";
import { Section4 } from "./Section4";
import { Section5 } from "./Section5";

function Landing({ setBalanceChanged, balanceChanged }: any) {
  return (
    <div className="bg-bg-dark text-white overflow-x-hidden">
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-mesh-pattern" />
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[120px] opacity-40" style={{ background: 'radial-gradient(circle, rgba(19,127,236,0.25) 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest"
          >
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-primary" />
            </span>
            Live on Vara Network
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col gap-4 items-center"
          >
            <h1 className="text-6xl sm:text-8xl lg:text-9xl font-bold tracking-[-0.03em] text-glow leading-none">
              ekat<span className="text-primary">Stake</span>
            </h1>
            <p className="text-slate-400 text-lg sm:text-xl font-light leading-relaxed max-w-2xl">
              The pioneering liquid staking protocol on Vara Network. 
              Stake VARA, receive ekatVara tokens, and keep your liquidity across DeFi.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/stake" className="btn-primary text-base px-8 py-3.5 rounded-xl font-bold">
              Start Staking 
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-border-color bg-surface hover:border-primary/40 text-white font-semibold transition-all text-base"
            >
              View Dashboard
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-3 gap-4 sm:gap-8 mt-4"
          >
            {[
              { value: "~8%", label: "APY" },
              { value: "100%", label: "Decentralized" },
              { value: "Vara", label: "Network" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-2xl sm:text-3xl font-bold text-primary">{value}</span>
                <span className="text-xs sm:text-sm text-slate-500 uppercase tracking-wide">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <span className="material-symbols-outlined text-sm animate-bounce">keyboard_arrow_down</span>
        </motion.div>
      </section>

      <section className="border-t border-border-color bg-surface/30 py-20 px-4">
        <Section2 />
      </section>

      <section className="py-20 px-4 border-t border-border-color">
        <Section3 />
      </section>

      <section className="py-20 px-4 border-t border-border-color bg-surface/20">
        <Section4 />
      </section>

      <section className="py-16 px-4 border-t border-border-color">
        <Section5 />
      </section>
    </div>
  );
}

export { Landing };
