import { useEffect, useState } from "react";
import { SmartContract } from "@/services/SmartContract";
import { Account, useBalance, useBalanceFormat, useAlert, useApi } from "@gear-js/react-hooks";
import { AccountsModal } from "@/components/header/multiwallet/accounts-modal";
import { StakeRequest } from "@/services/models/StateRequest";
import { formatDate } from "@/utils/date";
import { formatNumber } from "@/utils";
import { sleep } from "@/app/utils";
import BigNumber from "bignumber.js";

type StakeProps = {
  account: Account;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  contract: SmartContract;
  balanceChanged: any;
  setBalanceChanged: any;
};

type FormattedBalance = { value: string; unit: string } | undefined;

export function Stake({
  account, isModalOpen, openModal, closeModal,
  contract, balanceChanged, setBalanceChanged,
}: StakeProps) {
  const { getFormattedBalance } = useBalanceFormat();
  const { balance } = useBalance(account?.address);
  const { api, isApiReady } = useApi();

  const [stakeAmount, setStakeAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState(new BigNumber(0));
  const [tokenValue, setTokenValue] = useState(new BigNumber(0));
  const [gas, setGas] = useState(new BigNumber(0));
  const [isAmountInvalid, setIsAmountInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [txProgress, setTxProgress] = useState(0);

  const formattedBalance: FormattedBalance = balance
    ? getFormattedBalance(balance)
    : undefined;

  const availableNum = formattedBalance?.value
    ? Number(formattedBalance.value.split(",").join(""))
    : 0;

  /* ─── Refresh token value on mount ─────── */
  useEffect(() => {
    contract.tokenValue().then((v) => setTokenValue(new BigNumber(v.toString())));
  }, [contract]);

  /* ─── Recalculate receive amount & gas ─── */
  const recalculate = async (raw: string) => {
    if (!raw || raw === "0") {
      setReceiveAmount(new BigNumber(0));
      setGas(new BigNumber(0));
      return;
    }
    const tv = new BigNumber(await contract.tokenValue());
    const oneGvara = new BigNumber(10).pow(import.meta.env.VITE_FT_DECIMALS);
    const userVal = new BigNumber(raw);
    const totalVara = userVal.multipliedBy(tv);
    const totalGvara = totalVara.multipliedBy(oneGvara).dividedBy(tv);
    setReceiveAmount(totalGvara);

    const payload = {
      amount: totalVara.toString(),
      gvaraAmount: totalGvara.toString(),
      date: formatDate(new Date()),
    };
    const g = await contract.stakeGas(payload);
    setGas(new BigNumber(g.toString()));
  };

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    // max one decimal point
    const parts = raw.split(".");
    const cleaned = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : raw;

    const num = Number(cleaned);
    if (num > availableNum - 1) return; // can't exceed balance-1

    setIsAmountInvalid(false);
    setStakeAmount(cleaned);
    await recalculate(cleaned);
  };

  const handleMax = async () => {
    const max = Math.max(0, Math.floor(availableNum - 1));
    setStakeAmount(max.toString());
    await recalculate(max.toString());
  };

  /* ─── Submit ───────────────────────────── */
  const stakeVara = async () => {
    if (!isApiReady || isLoading) return;
    const num = Number(stakeAmount);
    if (!num || num <= 0 || num > availableNum - 1) {
      setIsAmountInvalid(true);
      return;
    }

    setIsLoading(true);
    setTxModalOpen(true);
    setTxStatus("Sending tokens for staking...");
    setTxProgress(40);

    const amount = contract.toPlank(num);
    const payload: StakeRequest = { amount, sessionForAccount: null };

    try {
      await contract.stake(payload, () => {
        setTxStatus("Transaction confirmed!");
        setTxProgress(100);
        setStakeAmount("");
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
      setStakeAmount("");
      setReceiveAmount(new BigNumber(0));
    }
  };

  const exchangeRate = tokenValue.isZero()
    ? "—"
    : `1 ekatVara ≈ ${formatNumber(tokenValue.toString(), 12, 4)} VARA`;

  const gasCostVara = gas.isZero()
    ? "—"
    : `~${gas.dividedBy(new BigNumber(10).pow(12)).toFixed(4)} VARA`;

  return (
    <div className="flex flex-col gap-4">

      {/* ── YOU STAKE box ───────────────────── */}
      <div
        className="bg-[rgba(16,25,34,0.5)] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <label className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            You Stake
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Balance: {availableNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <button
              onClick={handleMax}
              className="text-[10px] font-bold bg-primary/20 text-primary hover:bg-primary hover:text-white px-2 py-0.5 rounded transition-colors uppercase"
            >
              Max
            </button>
          </div>
        </div>

        {/* Input row */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="decimal"
            value={stakeAmount}
            onChange={handleInput}
            placeholder="0.00"
            className="w-full bg-transparent border-none p-0 text-3xl font-bold text-white placeholder-slate-600 focus:ring-0 focus:outline-none appearance-none"
          />
          {/* Token badge */}
          <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 shrink-0">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-tr from-green-400 to-blue-500 shrink-0" />
            <span className="font-bold text-lg text-white">VARA</span>
          </div>
        </div>

        {/* Footer */}
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

      {/* ── YOU RECEIVE box ─────────────────── */}
      <div className="bg-[rgba(16,25,34,0.5)] rounded-xl p-4 border border-white/5">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <label className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            You Receive
          </label>
          <span className="text-xs text-slate-400">Balance: 0.00</span>
        </div>

        {/* Output row */}
        <div className="flex items-center gap-3">
          <span className="w-full text-3xl font-bold text-slate-300 select-none">
            {receiveAmount.isZero()
              ? "0.00"
              : formatNumber(receiveAmount.toString(), Number(import.meta.env.VITE_FT_DECIMALS), 4)}
          </span>
          {/* Token badge */}
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
          <span className="text-xs text-slate-500">Includes rewards</span>
        </div>
      </div>

      {/* ── Info rows ───────────────────────── */}
      <div className="py-1 px-1 flex flex-col gap-2.5">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1 text-slate-400">
            <span>Exchange Rate</span>
            <span
              className="material-symbols-outlined cursor-help"
              style={{ fontSize: 14 }}
              title="Current exchange rate between VARA and ekatVara"
            >
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
          <div className="flex items-center gap-1 text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              trending_up
            </span>
            <span className="font-bold">Annual Percentage Yield</span>
          </div>
          <span className="text-green-400 font-bold text-lg">12.5%</span>
        </div>
      </div>

      {/* ── Action button ───────────────────── */}
      {account ? (
        <button
          onClick={stakeVara}
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2 group"
        >
          <span>{isLoading ? "Processing..." : "Stake VARA"}</span>
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
      {txModalOpen && <TxModal title="Staking VARA" subtitle={txStatus} progress={txProgress} />}
    </div>
  );
}

/* ─── Tx progress overlay ─────────────────────── */
export function TxModal({
  title,
  subtitle,
  progress,
}: {
  title: string;
  subtitle: string;
  progress: number;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl p-8 w-full max-w-sm flex flex-col gap-5 mx-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>
              deployed_code
            </span>
          </div>
          <div>
            <h3 className="text-white font-bold">{title}</h3>
            <p className="text-slate-400 text-sm">{subtitle}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="relative h-2 rounded-full bg-black/40 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-slate-500 text-xs">Please do not close this window</p>
      </div>
    </div>
  );
}
