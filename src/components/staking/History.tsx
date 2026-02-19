import { useState } from "react";
import { SmartContract } from "@/services/SmartContract";
import VaraLogo from "@/assets/images/VaraLogo.png";

type HistoryProps = { contractCalls: SmartContract };

export function History({ contractCalls }: HistoryProps) {
  const [txHistory, setTxHistory] = useState<any[]>([]);

  contractCalls.getHistory().then(setTxHistory);

  const formatDate = (ts: string) => {
    const d = new Date(Number(ts));
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (txHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <span className="material-symbols-outlined text-slate-600 text-5xl">history</span>
        <p className="text-slate-500 font-medium">No transaction history</p>
        <p className="text-slate-600 text-sm">Your staking transactions will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
      <span className="text-sm font-semibold text-white mb-1">Transaction History</span>
      {txHistory.map((tx, i) => {
        const isStake = tx.t_type === "stake";
        return (
          <div
            key={`${tx.transactionTime}-${i}`}
            className="flex items-center justify-between bg-surface border border-border-color rounded-xl px-4 py-3 hover:border-border-primary transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={`flex size-9 items-center justify-center rounded-xl ${isStake ? 'bg-emerald-500/15' : 'bg-primary/15'}`}>
                <span className={`material-symbols-outlined text-lg ${isStake ? 'text-emerald-400' : 'text-primary'}`}>
                  {isStake ? 'arrow_downward' : 'arrow_upward'}
                </span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {isStake ? 'Stake' : 'Unstake'}
                </p>
                <p className="text-slate-500 text-xs">{formatDate(tx.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">
                {isStake
                  ? (tx.amount / contractCalls.PLANK).toFixed(4)
                  : (tx.amount / (10 ** Number(import.meta.env.VITE_FT_DECIMALS))).toFixed(4)}
              </span>
              <img src={VaraLogo} alt="VARA" className="size-5" />
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isStake ? 'bg-emerald-500/15 text-emerald-400' : 'bg-primary/15 text-primary'}`}>
                {isStake ? 'STAKE' : 'UNSTAKE'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
