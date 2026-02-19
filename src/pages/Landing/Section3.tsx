import { motion, useAnimation } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";

export function Section3() {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(async () => {
    if (!ref.current) return;
    const { scrollY } = window;
    const top = ref.current.offsetTop;
    if (scrollY + window.innerHeight > top) {
      await controls.start({ opacity: 1, y: 0, transition: { duration: 0.6 } });
    } else {
      await controls.start({ opacity: 0, y: 60 });
    }
  }, [controls]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const steps = [
    { icon: "lock_open", label: "Stake $VARA tokens", sub: "Deposit and start earning" },
    { icon: "generating_tokens", label: "Receive $ekatVara tokens", sub: "Liquid representation" },
    { icon: "account_balance", label: "Participate across DeFi", sub: "Keep your liquidity" },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={controls}
      className="max-w-5xl mx-auto"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">Three simple steps</h2>
        <p className="text-slate-400 mt-2">Start staking in minutes</p>
      </div>

      <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0">
        {steps.map(({ icon, label, sub }, i) => (
          <div key={label} className="flex flex-col md:flex-row items-center w-full md:w-auto">
            {/* Card */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col items-center gap-3 text-center w-full md:w-56 hover:-translate-y-1 transition-transform duration-200">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 border border-primary/25">
                <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
              </div>
              <div className="size-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                {i + 1}
              </div>
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div className="hidden md:flex items-center px-3 text-primary">
                <span className="material-symbols-outlined text-2xl">chevron_right</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
