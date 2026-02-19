import { motion, useAnimation } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";

export function Section2() {
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

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={controls}
      className="max-w-5xl mx-auto"
    >
      {/* Section title */}
      <div className="text-center mb-14">
        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">How it works</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          How ekatStake works?
        </h2>
        <p className="text-slate-400 mt-3 max-w-xl mx-auto">
          A simple, transparent process to unlock the power of liquid staking on Vara Network.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: "deployed_code",
            step: "01",
            title: "Stake VARA",
            desc: "Deposit your VARA tokens into the ekatStake smart contract and start earning rewards immediately.",
          },
          {
            icon: "token",
            step: "02",
            title: "Receive ekatVara",
            desc: "Get ekatVara liquid tokens representing your staked position. Use them freely across the DeFi ecosystem.",
          },
          {
            icon: "trending_up",
            step: "03",
            title: "Earn & Grow",
            desc: "Your staking rewards accumulate automatically. Unstake anytime and claim your VARA plus rewards.",
          },
        ].map(({ icon, step, title, desc }) => (
          <div
            key={step}
            className="glass-panel rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-200 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 border border-primary/25 group-hover:bg-primary/25 transition-colors">
                <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
              </div>
              <span className="text-4xl font-black text-border-color/60">{step}</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
