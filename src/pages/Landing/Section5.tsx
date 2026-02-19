import { motion } from "framer-motion";

const SOCIALS = [
  { icon: "discord", href: "#", label: "Discord" },
  { icon: "github", href: "#", label: "GitHub" },
  { icon: "newspaper", href: "#", label: "Medium" },
  { icon: "language", href: "#", label: "Twitter / X" },
];

export function Section5() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="max-w-5xl mx-auto flex flex-col items-center gap-8"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-primary-glow">
        <span className="material-symbols-outlined text-2xl">deployed_code</span>
      </div>

      <div className="text-center">
        <h3 className="text-2xl font-bold text-white">ekatStake</h3>
        <p className="text-slate-400 text-sm mt-1">Liquid Staking on Vara Network</p>
      </div>

      {/* <div className="flex items-center gap-4">
        {SOCIALS.map(({ icon, href, label }) => (
          <a
            key={label}
            href={href}
            aria-label={label}
            className="flex size-10 items-center justify-center rounded-xl border border-border-color bg-surface hover:border-primary/50 hover:text-primary text-slate-400 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          </a>
        ))}
      </div> */}

      <p className="text-slate-600 text-xs">
        © {new Date().getFullYear()} ekatStake. Built on Vara Network.
      </p>
    </motion.div>
  );
}
