import { formatNumber } from "@/utils";
import BigNumber from "bignumber.js";

type Props = {
  tokenLogo: string;
  amount: string;
  isAmountInvalid: boolean;
  valueAfterToken: BigNumber;
  handleInputChange: any;
  handleMaxButtonPressed: any;
  tokenValue: BigNumber;
  gas: BigNumber;
  setGas: any;
};

export function UnstakeTokenInput({
  tokenLogo, isAmountInvalid, valueAfterToken, amount,
  handleInputChange, handleMaxButtonPressed, tokenValue, gas,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
          <img src={tokenLogo} alt="ekatVara" className="size-6 rounded-full" />
          <span className="text-slate-400 text-sm font-medium">ekatVara</span>
        </div>
        <input
          type="text"
          value={amount}
          onChange={handleInputChange}
          className="glass-input pl-24 pr-16 h-14 text-right text-lg font-semibold"
          placeholder="0"
        />
        <button
          onClick={handleMaxButtonPressed}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary hover:text-primary-hover transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
        >
          MAX
        </button>
      </div>

      {isAmountInvalid && (
        <p className="text-red-400 text-xs flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          Invalid amount
        </p>
      )}

      {/* You receive */}
      <div className="flex items-center justify-between bg-black/20 rounded-xl px-4 py-3 border border-border-color">
        <span className="text-slate-400 text-sm">You will receive</span>
        <span className="text-white font-semibold">
          {formatNumber(valueAfterToken.toString(), 12, 4)} VARA
        </span>
      </div>

      {/* Info row */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Gas fee: <span className="text-slate-400">{gas.dividedBy(BigNumber(100000000000)).toString()} VARA</span>
        </span>
        <span>
          1 ekatVara ≈ <span className="text-slate-400">{formatNumber(tokenValue.toString(), 12, 4)} VARA</span>
        </span>
      </div>
    </div>
  );
}
