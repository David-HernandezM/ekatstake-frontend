import { useEffect, useState } from "react";
import { SmartContract } from "@/services/SmartContract";
import { Account, useBalance } from "@gear-js/react-hooks";
import { WithdrawRequest } from "@/services/models/WithdrawRequest";
import { useSignlessUtils, useVoucherUtils } from "@/app/hooks";
import { sleep } from "@/app/utils";
import { TxModal } from "./Stake";
import VaraLogo from "@/assets/images/VaraLogo.png";

type WithdrawProps = { contractCalls: SmartContract; account: Account };

export function Withdraw({ contractCalls, account }: WithdrawProps) {
  const sponsorName = import.meta.env.VITE_SPONSOR_NAME;
  const sponsorMnemonic = import.meta.env.VITE_SPONSOR_MNEMONIC;
  const { balance } = useBalance(account?.address);
  const [unstakeHistory, setUnstakeHistory] = useState<any[]>([]);
  const [currentEra, setCurrentEra] = useState<number>(0);
  const [update, setUpdate] = useState(false);
  const [progressStatus, setProgressStatus] = useState(0);
  const [modalSubtitle, setModalSubtitle] = useState("Withdrawing tokens...");
  const [txModalOpen, setTxModalOpen] = useState(false);

  const { pair, storageVoucher, createNewSession, unlockPair } = useSignlessUtils(contractCalls, null);
  const { checkVoucherForUpdates, vouchersInContract } = useVoucherUtils(sponsorName, sponsorMnemonic);

  const handleWithdraw = async (unstakeId: number, amount: number, liberationEra: number, index: number) => {
    setTxModalOpen(true);
    setProgressStatus(0);
    await sleep(1);
    setModalSubtitle("Withdrawing tokens...");
    setProgressStatus(55);

    const payload: WithdrawRequest = {
      user: contractCalls.currentUser()?.decodedAddress!,
      id: unstakeId,
      liberationEra,
      amount,
    };

    await contractCalls.withdraw(payload);
    setModalSubtitle("Finished!");
    setProgressStatus(100);
    await sleep(2);
    setModalSubtitle("");
    setProgressStatus(0);
    setTxModalOpen(false);
    setTimeout(() => setUpdate(!update), 3000);
    setUnstakeHistory((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    contractCalls.getUnstakeHistory().then(setUnstakeHistory);
    contractCalls.getCurrentEra().then(setCurrentEra);
  }, [contractCalls, balance]);

  useEffect(() => {}, [update]);

  if (unstakeHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <span className="material-symbols-outlined text-slate-600 text-5xl">hourglass_empty</span>
        <p className="text-slate-500 font-medium">No pending withdrawals</p>
        <p className="text-slate-600 text-sm text-center">
          Unstaked VARA will appear here after the unbonding period.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-white">Pending Withdrawals</span>
        <span className="text-xs text-slate-500">Current Era: {currentEra}</span>
      </div>

      <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
        {unstakeHistory.map((item, index) => {
          const daysLeft = Math.max(0, ((item?.liberation_era - currentEra) * 12) / 24);
          const canWithdraw = currentEra > item?.liberation_era;
          return (
            <div
              key={`${item.id}-${index}`}
              className="bg-surface border border-border-color rounded-xl p-4 hover:border-border-primary transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <img src={VaraLogo} alt="VARA" className="size-5" />
                    <span className="text-white font-semibold text-sm">
                      {item?.reward / contractCalls.PLANK} VARA
                    </span>
                    <span className="text-xs text-slate-500">(reward)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {canWithdraw ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Ready to claim
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-400">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {daysLeft.toFixed(1)} days remaining
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (canWithdraw) {
                      handleWithdraw(item?.id, item?.amount, item?.liberation_era, index);
                    } else {
                      contractCalls.errorAlert("Not ready yet");
                    }
                  }}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    canWithdraw
                      ? "bg-primary text-white hover:bg-primary-hover shadow-primary-glow"
                      : "bg-surface-2 text-slate-500 cursor-not-allowed border border-border-color"
                  }`}
                  disabled={!canWithdraw}
                >
                  Claim
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {txModalOpen && <TxModal title="Withdrawing VARA" subtitle={modalSubtitle} progress={progressStatus} />}
    </div>
  );
}
