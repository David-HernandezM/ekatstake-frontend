import { motion, useAnimation } from "framer-motion";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useRef } from "react";

export function Section4() {
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

  const features = [
    { icon: "security", title: "Non-custodial", desc: "Your funds remain fully in your control through decentralized smart contracts." },
    { icon: "bolt", title: "Instant liquidity", desc: "ekatVara tokens are freely transferable and usable across DeFi protocols." },
    { icon: "emoji_events", title: "Compounding rewards", desc: "Staking rewards accrue automatically, increasing the value of your position." },
    { icon: "verified_user", title: "Audited contracts", desc: "Smart contracts are thoroughly reviewed for security and correctness." },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={controls}
      className="max-w-5xl mx-auto"
    >
      <div className="flex flex-col lg:flex-row items-center gap-12">
        {/* Left */}
        <div className="flex-1">
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">Why ekatStake</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Unlock liquidity and earn more rewards!
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Traditional staking locks your tokens. With ekatStake, you earn staking rewards while keeping your tokens liquid for DeFi opportunities.
          </p>
          <Link to="/home" className="btn-primary inline-block px-8 py-3.5 rounded-xl font-bold">
            Start Earning Now →
          </Link>
        </div>

        {/* Right — feature grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="glass-panel rounded-xl p-5 hover:border-border-primary transition-all duration-200 group"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/20 mb-3 group-hover:bg-primary/25 transition-colors">
                <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
