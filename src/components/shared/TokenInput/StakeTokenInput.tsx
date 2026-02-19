import { useEffect, useState } from "react";
import { SmartContract } from "@/services/SmartContract";
import { formatDate } from "@/utils/date";
import { formatNumber } from "@/utils";
import BigNumber from "bignumber.js";

type FormattedBalance = { value: string; unit: string } | undefined;

type Props = {
  tokenLogo: string;
  amount: string;
  setAmount: any;
  contract: SmartContract;
  isAmountInvalid: boolean;
  formattedBalance: FormattedBalance;
  setIsAmountInvalid: any;
  valueAfterToken: BigNumber;
  setValueAfterToken: any;
  gas: BigNumber;
  setGas: any;
};

export function StakeTokenInput({
  tokenLogo, amount, setAmount, contract, isAmountInvalid,
  formattedBalance, setIsAmountInvalid, valueAfterToken, setValueAfterToken, gas, setGas,
}: Props) {
  const [fetchTokenValue, setFetchTokenValue] = useState(0n);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (Number.isNaN(Number(value))) return;
    if (value === "" || /[^0-9]/.test(value)) {
      if (value === "") { setGas(new BigNumber(0)); setAmount("0"); setValueAfterToken(new BigNumber(0)); }
      return;
    }

    const balance = Number(formattedBalance?.value.split(',').join('')) - 1;
    if (balance < Number(value)) return;
    setIsAmountInvalid(false);

    const userValue = new BigNumber(value);
    const tv = new BigNumber(await contract.tokenValue());
    const totalVara = userValue.multipliedBy(tv);
    const oneGvara = (new BigNumber(10)).pow(import.meta.env.VITE_FT_DECIMALS);
    const totalGvara = totalVara.multipliedBy(oneGvara).dividedBy(tv);

    setValueAfterToken(totalGvara);
    setAmount(value.startsWith("0") ? value.slice(1) : value);
    setGas(new BigNumber((await contract.stakeGas({ amount: totalVara.toString(), gvaraAmount: totalVara.toString(), date: formatDate(new Date()) })).toString()));
  };

  const handleMaxPressed = async () => {
    if (!formattedBalance?.value) return;
    const amount = new BigNumber(Math.floor(Number(formattedBalance.value.split(',').join('')) - 1));
    setAmount(amount.toString());
    const tv = new BigNumber(await contract.tokenValue());
    const totalVara = amount.multipliedBy(tv);
    const oneGvara = (new BigNumber(10)).pow(import.meta.env.VITE_FT_DECIMALS);
    const totalGvara = totalVara.multipliedBy(oneGvara).dividedBy(tv);
    setValueAfterToken(totalGvara);
    setGas(new BigNumber((await contract.stakeGas({ amount: totalVara.toString(), gvaraAmount: totalVara.toString(), date: formatDate(new Date()) })).toString()));
  };

  useEffect(() => {
    contract.tokenValue().then((v) => setFetchTokenValue(v));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
          <img src={tokenLogo} alt="VARA" className="size-6 rounded-full" />
          <span className="text-slate-400 text-sm font-medium">VARA</span>
        </div>
        <input
          type="text"
          value={amount}
          onChange={handleInputChange}
          className="glass-input pl-20 pr-16 h-14 text-right text-lg font-semibold"
          placeholder="0"
        />
        <button
          onClick={handleMaxPressed}
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
        <span className="text-primary font-semibold">
          {formatNumber(valueAfterToken.toString(), Number(import.meta.env.VITE_FT_DECIMALS), 4)} ekatVara
        </span>
      </div>

      {/* Info row */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Gas fee: <span className="text-slate-400">{gas.dividedBy(BigNumber(100000000000)).toString()} VARA</span>
        </span>
        <span>
          1 ekatVara ≈ <span className="text-slate-400">{formatNumber(fetchTokenValue.toString(), 12, 4)} VARA</span>
        </span>
      </div>
    </div>
  );
}
