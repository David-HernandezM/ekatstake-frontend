import { useCallback, useEffect, useState } from "react";
import { SmartContract } from "@/services/SmartContract";
import { useBalance, useBalanceFormat } from "@gear-js/react-hooks";
import { AccountsModal } from "@/components/header/multiwallet/accounts-modal";
import { UnstakeRequest } from "@/services/models/UnstakeRequest";
import { formatNumber } from "@/utils";
import { sleep } from "@/app/utils";
import { TxModal } from "./Stake";
import BigNumber from "bignumber.js";

type UnstakeProps = {
  account: any;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  contract: SmartContract;
  balanceChanged: any;
  setBalanceChanged: any;
};

export function Unstake({
  account, isModalOpen, openModal, closeModal,
  contract, balanceChanged, setBalanceChanged,
}: UnstakeProps) {
  const { getFormattedBalance } = useBalanceFormat();
  const { balance } = useBalance(account?.address);

  const [burnAmount, setBurnAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState(new BigNumber(0));
  const [tokenValue, setTokenValue] = useState(new BigNumber(0));
  const [ekatBalance, setEkatBalance] = useState(new BigNumber(0));
  const [gas, setGas] = useState(new BigNumber(0));
  const [isAmountInvalid, setIsAmountInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [txProgress, setTxProgress] = useState(0);

  /* ─── Load balances & token value ──────── */
  const loadData = useCallback(async () => {
    const [bal, tv] = await Promise.all([
      contract.balanceOf(),
      contract.tokenValue(),
    ]);
    const oneGvara = new BigNumber(10).pow(import.meta.env.VITE_FT_DECIMALS);
    // ekatBalance in human units
    setEkatBalance(new BigNumber(bal.toString()).dividedBy(oneGvara));
    setTokenValue(new BigNumber(tv.toString()));
  }, [contract]);

  useEffect(() => { loadData(); }, [loadData, balance, balanceChanged, isLoading]);

  /* ─── Recalculate receive VARA ──────────── */
  const recalculate = async (raw: string) => {
    if (!raw || raw === "0") {
      setReceiveAmount(new BigNumber(0));
      setGas(new BigNumber(0));
      return;
    }
    const tv = new BigNumber(await contract.tokenValue());
    const oneGvara = new BigNumber(10).pow(import.meta.env.VITE_FT_DECIMALS);
    const burnVal = new BigNumber(raw);
    // VARA = ekatVara_amount * tokenValue / 10^decimals
    const varaReceive = burnVal.multipliedBy(tv).dividedBy(oneGvara);
    setReceiveAmount(varaReceive);

    const gvaraWei = burnVal.multipliedBy(oneGvara);
    const g = await contract.unstakeGas(gvaraWei.toString());
    setGas(new BigNumber(g.toString()));
  };

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    const parts = raw.split(".");
    const cleaned = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : raw;
    if (new BigNumber(cleaned || "0").isGreaterThan(ekatBalance)) return;
    setIsAmountInvalid(false);
    setBurnAmount(cleaned);
    await recalculate(cleaned);
  };

  const handleMax = async () => {
    const max = ekatBalance.toFixed(4);
    setBurnAmount(max);
    await recalculate(max);
  };

  /* ─── Submit ───────────────────────────── */
  const unstakeVara = async () => {
    if (isLoading) return;
    const num = new BigNumber(burnAmount || "0");
    if (num.isZero() || num.isNaN() || num.isGreaterThan(ekatBalance)) {
      setIsAmountInvalid(true);
      return;
    }

    setIsLoading(true);
    setTxModalOpen(true);
    setTxStatus("Unstaking tokens...");
    setTxProgress(40);

    const oneGvara = new BigNumber(10).pow(import.meta.env.VITE_FT_DECIMALS);
    const gvaraWei = num.multipliedBy(oneGvara).integerValue().toNumber();
    const payload: UnstakeRequest = { amount: gvaraWei, sessionForAccount: null };

    try {
      await contract.unstake(payload, () => {
        setTxStatus("Transaction confirmed!");
        setTxProgress(100);
        setBurnAmount("");
        setReceiveAmount(new BigNumber(0));
        setTimeout(() => {
          setIsLoading(false);
          setTxModalOpen(false);
          setTxProgress(0);
          setBalanceChanged(!balanceChanged);
        }, 2500);
      });
    } catch {
      contract.errorAlert("Operation cancelled");
      setIsLoading(false);
      setTxModalOpen(false);
      setTxProgress(0);
      setBurnAmount("");
      setReceiveAmount(new BigNumber(0));
    }
  };

  const exchangeRate = tokenValue.isZero()
    ? "—"
    : `1 ekatVara ≈ ${formatNumber(tokenValue.toString(), 12, 4)} VARA`;

  const gasCostVara = gas.isZero()
    ? "—"
    : `~${gas.dividedBy(new BigNumber(10).pow(12)).toFixed(4)} VARA`;

  const ekatBalanceDisplay = ekatBalance.toFixed(4);

  return (
    <div className="flex flex-col gap-4">

      {/* ── YOU BURN box (ekatVara) ──────────── */}
      <div className="bg-[rgba(16,25,34,0.5)] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
        <div className="flex justify-between items-center mb-3">
          <label className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            You Burn
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Balance: {ekatBalanceDisplay}</span>
            <button
              onClick={handleMax}
              className="text-[10px] font-bold bg-primary/20 text-primary hover:bg-primary hover:text-white px-2 py-0.5 rounded transition-colors uppercase"
            >
              Max
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="decimal"
            value={burnAmount}
            onChange={handleInput}
            placeholder="0.00"
            className="w-full bg-transparent border-none p-0 text-3xl font-bold text-white placeholder-slate-600 focus:ring-0 focus:outline-none appearance-none"
          />
          <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 shrink-0">
            <div className="w-6 h-6 rounded bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 14 }}>
                deployed_code
              </span>
            </div>
            <span className="font-bold text-lg text-white">ekatVara</span>
          </div>
        </div>

        <div className="mt-2 text-right">
          <span className="text-xs text-slate-500">≈ $0.00 USD</span>
        </div>
        {isAmountInvalid && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm leading-none">error</span>
            Invalid amount
          </p>
        )}
      </div>

      {/* ── Arrow divider ───────────────────── */}
      <div className="flex justify-center -my-2 relative z-10">
        <div className="bg-[#1c2633] border border-white/10 p-2 rounded-full shadow-lg text-slate-400">
          <span className="material-symbols-outlined block" style={{ fontSize: 20 }}>
            arrow_downward
          </span>
        </div>
      </div>

      {/* ── YOU RECEIVE box (VARA) ───────────── */}
      <div className="bg-[rgba(16,25,34,0.5)] rounded-xl p-4 border border-white/5">
        <div className="flex justify-between items-center mb-3">
          <label className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            You Receive
          </label>
          <span className="text-xs text-slate-400">After unbonding period</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-full text-3xl font-bold text-slate-300 select-none">
            {receiveAmount.isZero()
              ? "0.00"
              : receiveAmount.dividedBy(new BigNumber(10).pow(12)).toFixed(4)}
          </span>
          <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 shrink-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 shrink-0" />
            <span className="font-bold text-lg text-white">VARA</span>
          </div>
        </div>

        <div className="mt-2 text-right">
          <span className="text-xs text-slate-500">Available after 14 Eras (~7 days)</span>
        </div>
      </div>

      {/* ── Info rows ───────────────────────── */}
      <div className="py-1 px-1 flex flex-col gap-2.5">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1 text-slate-400">
            <span>Exchange Rate</span>
            <span className="material-symbols-outlined cursor-help" style={{ fontSize: 14 }}>
              info
            </span>
          </div>
          <span className="text-white font-medium">{exchangeRate}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Transaction Cost</span>
          <span className="text-slate-300 font-medium">{gasCostVara}</span>
        </div>

        <div className="flex justify-between items-center text-sm mt-1">
          <div className="flex items-center gap-1 text-amber-400">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              schedule
            </span>
            <span className="font-bold">Unbonding Period</span>
          </div>
          <span className="text-amber-400 font-bold">14 Eras (~7d)</span>
        </div>
      </div>

      {/* ── Action button ───────────────────── */}
      {account ? (
        <button
          onClick={unstakeVara}
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2 group"
        >
          <span>{isLoading ? "Processing..." : "Unstake ekatVara"}</span>
          {!isLoading && (
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={openModal}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            account_balance_wallet
          </span>
          Connect Wallet
        </button>
      )}

      {isModalOpen && <AccountsModal close={closeModal} />}
      {txModalOpen && (
        <TxModal title="Unstaking ekatVara" subtitle={txStatus} progress={txProgress} />
      )}
    </div>
  );
}
