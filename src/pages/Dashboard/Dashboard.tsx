import { useCallback, useEffect, useState } from "react";
import { useAccount, useAlert, useApi, useBalance, useBalanceFormat } from "@gear-js/react-hooks";
import { SmartContract } from "@/services/SmartContract";
import { WithdrawRequest } from "@/services/models/WithdrawRequest";
import { sleep } from "@/app/utils";
import { TxModal } from "@/components/staking/Stake";
import { AccountsModal } from "@/components/header/multiwallet/accounts-modal";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */
type Tx   = { t_type: string; amount: any; date: string };
type Unstake = { id: string | number | bigint; amount: any; reward: any; liberation_era: number };

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
function formatTs(ts: string) {
  const d = new Date(Number(ts));
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  }) + ", " + d.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
}

function shortHash(h: string) {
  if (!h || h.length < 10) return h;
  return h.slice(0, 6) + "..." + h.slice(-4);
}

/* ─────────────────────────────────────────────────────────
   Stat card
───────────────────────────────────────────────────────── */
function StatCard({
  icon, label, value, unit, unitColor, sub,
  hoverClass = "hover:border-primary/50",
  glowClass  = "bg-primary/5 group-hover:bg-primary/10",
}: {
  icon: string; label: string; value: string; unit: string;
  unitColor: string; sub: string;
  hoverClass?: string; glowClass?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#233648] bg-[#17222e] p-6 transition-all ${hoverClass} group`}
    >
      <div
        className={`absolute -right-6 -top-6 size-24 rounded-full blur-2xl transition-all ${glowClass}`}
      />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">{icon}</span>
          {label}
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{value}</span>
          <span className={`text-sm font-bold ${unitColor}`}>{unit}</span>
        </div>
        <div className="mt-1 text-xs text-slate-500">{sub}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────── */
export function Dashboard({ balanceChanged, setBalanceChanged }: any) {
  const { api }               = useApi();
  const { accounts, account } = useAccount();
  const alert                 = useAlert();
  const { balance }           = useBalance(account?.address);
  const { getFormattedBalance } = useBalanceFormat();
  const [walletModal, setWalletModal] = useState(false);

  /* ── state ──────────────────────────────────── */
  const [totalStaked,    setTotalStaked]    = useState("0");
  const [availableWd,    setAvailableWd]    = useState("0");
  const [pendingUnbond,  setPendingUnbond]  = useState("0");
  const [txHistory,      setTxHistory]      = useState<Tx[]>([]);
  const [unstakeHistory, setUnstakeHistory] = useState<Unstake[]>([]);
  const [currentEra,     setCurrentEra]     = useState(0);

  const [txSearch,    setTxSearch]    = useState("");
  const [txPage,      setTxPage]      = useState(1);
  const PAGE_SIZE = 4;

  const [txModalOpen,  setTxModalOpen]  = useState(false);
  const [txStatus,     setTxStatus]     = useState("");
  const [txProgress,   setTxProgress]   = useState(0);
  const [update,       setUpdate]       = useState(false);

  /* ── load data ──────────────────────────────── */
  const loadData = useCallback(async () => {
    if (!api || !account) return;
    const contract = new SmartContract(api!, account!, accounts, alert);
    try {
      const [bal, tv, hist, unstHist, era] = await Promise.all([
        contract.balanceOf(),
        contract.tokenValue(),
        contract.getHistory(),
        contract.getUnstakeHistory(),
        contract.getCurrentEra(),
      ]);

      // Total staked = ekatVara balance in human units
      const PLANK = 1_000_000_000_000n;
      const staked = Number(BigInt(bal.toString()) / PLANK);
      setTotalStaked(staked.toLocaleString());

      // Available to withdraw = sum of ready unstakes
      const ready = (unstHist || []).filter((u) => era > Number(u.liberation_era.toString()));
      const readySum = ready.reduce((s: number, u) => s + Number(u.reward) / Number(PLANK), 0);
      setAvailableWd(readySum.toFixed(2));

      // Pending unbonding = sum of not-yet-ready
      const pending = (unstHist || []).filter((u) => era <= Number(u.liberation_era.toString()));
      const pendSum = pending.reduce((s: number, u) => s + Number(u.reward) / Number(PLANK), 0);
      setPendingUnbond(pendSum.toFixed(2));

      // const unstakeHistory = unstHist.map((data) => {...data, liberation_era: Number(data.liberation_era.toString()) });
      const unstakeHistory = unstHist.map(value => {
        const liberation_era = Number(value.liberation_era.toString());
        const temp: Unstake = {
          liberation_era,
          id: value.id,
          amount: value.amount,
          reward: value.reward
        };

        return temp;
      });

      setTxHistory(hist || []);
      // setUnstakeHistory(unstHist);
      setUnstakeHistory(unstakeHistory);
      setCurrentEra(era);
    } catch (e) { console.error(e); }
  }, [api, account, accounts, alert]);

  useEffect(() => { loadData(); }, [loadData, balance, balanceChanged, update]);

  /* ── withdraw ───────────────────────────────── */
  const handleWithdraw = async (item: Unstake, index: number) => {
    if (!api || !account) return;
    const contract = new SmartContract(api!, account!, accounts, alert);

    setTxModalOpen(true);
    setTxStatus("Withdrawing tokens...");
    setTxProgress(40);

    const payload: WithdrawRequest = {
      user: contract.currentUser()?.decodedAddress!,
      id: Number(item.id.toString()),
      liberationEra: item.liberation_era,
      amount: item.amount,
    };

    try {
      await contract.withdraw(payload);
      setTxStatus("Finished!");
      setTxProgress(100);
      await sleep(2);
      setUnstakeHistory((prev) => prev.filter((_, i) => i !== index));
      setUpdate(!update);
      setTimeout(() => setBalanceChanged((v: boolean) => !v), 500);
    } catch {
      contract.errorAlert("Withdraw failed");
    } finally {
      await sleep(1);
      setTxModalOpen(false);
      setTxProgress(0);
    }
  };

  /* ── tx filtering & pagination ──────────────── */
  const filtered = txHistory.filter((tx) =>
    txSearch === "" || JSON.stringify(tx).toLowerCase().includes(txSearch.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE);

  /* ── tx type meta ───────────────────────────── */
  function txMeta(type: string) {
    if (type === "stake")    return { icon: "add_circle",    iconBg: "bg-primary/20",        iconColor: "text-primary",     label: "Stake",    statusBg: "bg-emerald-500/10", statusText: "text-emerald-500", status: "Success"  };
    if (type === "unstake")  return { icon: "remove_circle", iconBg: "bg-amber-500/20",      iconColor: "text-amber-500",   label: "Unstake",  statusBg: "bg-amber-500/10",   statusText: "text-amber-500",  status: "Unbonding"};
    return                         { icon: "download",       iconBg: "bg-slate-700/50",       iconColor: "text-slate-300",   label: "Withdraw", statusBg: "bg-emerald-500/10", statusText: "text-emerald-500", status: "Success"  };
  }

  /* ── not connected ──────────────────────────── */
  if (!account) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-20">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 border border-primary/25">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 32 }}>
            account_balance_wallet
          </span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Connect your wallet</h2>
          <p className="text-slate-400 text-sm mt-1">Connect to view your staking dashboard</p>
        </div>
        <button
          onClick={() => setWalletModal(true)}
          className="rounded-lg bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors"
        >
          Connect Wallet
        </button>
        {walletModal && <AccountsModal close={() => setWalletModal(false)} />}
      </div>
    );
  }

  /* ── unbonding progress % ───────────────────── */
  function unbondPct(item: Unstake) {
    if (currentEra >= item.liberation_era) return 100;
    const total = 14; // eras
    const done  = total - Math.max(0, item.liberation_era - currentEra);
    return Math.round((done / total) * 100);
  }

  function timeLeft(item: Unstake) {
    const erasLeft = Math.max(0, item.liberation_era - currentEra);
    const daysLeft = (erasLeft * 12) / 24;
    if (daysLeft < 1) return `${Math.round(daysLeft * 24)}h remaining`;
    return `~${daysLeft.toFixed(0)}d remaining`;
  }

  /* ── render ─────────────────────────────────── */
  return (
    <>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* ── Page title ────────────────────── */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">My Assets & Activity</h2>
            <p className="text-slate-400">
              Manage your staked positions and view transaction history on the Vara Network.
            </p>
          </div>

          {/* ── 3 Stat cards ─────────────────── */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              icon="layers" label="Total Staked"
              value={totalStaked} unit="VARA" unitColor="text-primary"
              sub={<span className="flex items-center gap-1 text-emerald-500"><span className="material-symbols-outlined text-sm">trending_up</span>Rewards accumulating</span> as any}
              hoverClass="hover:border-primary/50"
              glowClass="bg-primary/5 group-hover:bg-primary/10"
            />
            <StatCard
              icon="account_balance" label="Available to Withdraw"
              value={availableWd} unit="VARA" unitColor="text-emerald-500"
              sub="Ready to claim"
              hoverClass="hover:border-emerald-500/30"
              glowClass="bg-emerald-500/5 group-hover:bg-emerald-500/10"
            />
            <StatCard
              icon="hourglass_top" label="Pending Unbonding"
              value={pendingUnbond} unit="VARA" unitColor="text-amber-500"
              sub={unstakeHistory.filter(u => currentEra <= u.liberation_era).length > 0 ? timeLeft(unstakeHistory.filter(u => currentEra <= u.liberation_era)[0]) : "No pending"}
              hoverClass="hover:border-amber-500/30"
              glowClass="bg-amber-500/5 group-hover:bg-amber-500/10"
            />
          </div>

          {/* ── Pending Withdrawals ───────────── */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xl font-bold text-white">
              <span className="material-symbols-outlined text-primary">pending_actions</span>
              Pending Withdrawals
            </h3>

            <div className="rounded-xl border border-[#233648] bg-[#17222e] overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-12 gap-4 border-b border-[#233648] bg-[#101922]/50 px-6 py-3 text-sm font-medium text-slate-400">
                <div className="col-span-3">Amount</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-4">Time Remaining</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              {unstakeHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-600">
                  <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
                  <p className="text-sm">No pending withdrawals</p>
                </div>
              ) : (
                unstakeHistory.map((item, index) => {
                  const canWithdraw = currentEra > item.liberation_era;
                  const pct = unbondPct(item);
                  const varaAmt = (Number(item.reward) / 1_000_000_000_000).toFixed(2);

                  return (
                    <div
                      key={`${item.id}-${index}`}
                      className={`group grid grid-cols-1 md:grid-cols-12 gap-4 border-b border-[#233648] p-6 md:px-6 md:py-4 items-center transition-colors hover:bg-[#233648]/20 last:border-0`}
                    >
                      {/* Amount */}
                      <div className="col-span-3 flex items-center justify-between md:justify-start">
                        <span className="md:hidden text-sm text-slate-500">Amount</span>
                        <span className={`font-bold ${canWithdraw ? "text-white" : "text-slate-300"}`}>
                          {varaAmt} VARA
                        </span>
                      </div>

                      {/* Status badge */}
                      <div className="col-span-3 flex items-center justify-between md:justify-start">
                        <span className="md:hidden text-sm text-slate-500">Status</span>
                        {canWithdraw ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500 border border-emerald-500/20">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500 border border-amber-500/20">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            Unbonding
                          </span>
                        )}
                      </div>

                      {/* Time remaining */}
                      <div className="col-span-4 flex items-center justify-between md:justify-start gap-3">
                        <span className="md:hidden text-sm text-slate-500">Time Remaining</span>
                        {canWithdraw ? (
                          <span className="text-sm text-slate-400">Completed</span>
                        ) : (
                          <div className="flex flex-col w-full max-w-[200px] gap-1">
                            <div className="flex justify-between text-xs text-slate-400">
                              <span>{timeLeft(item)}</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-[#233648]">
                              <div
                                className="h-full rounded-full bg-amber-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action */}
                      <div className="col-span-2 flex items-center justify-end">
                        {canWithdraw ? (
                          <button
                            onClick={() => handleWithdraw(item, index)}
                            className="w-full md:w-auto rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                          >
                            Withdraw
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full md:w-auto cursor-not-allowed rounded-lg bg-[#233648] px-4 py-2 text-sm font-medium text-slate-500 opacity-50"
                          >
                            Wait
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Transaction History ───────────── */}
          <div className="space-y-4 pt-4">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                <span className="material-symbols-outlined text-primary">history</span>
                Transaction History
              </h3>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-lg text-slate-500">
                    search
                  </span>
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
                    placeholder="Search hash..."
                    className="h-9 rounded-lg border border-[#233648] bg-[#17222e] pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none w-40 sm:w-64"
                  />
                </div>
                {/* Filter button */}
                <button className="flex size-9 items-center justify-center rounded-lg border border-[#233648] bg-[#17222e] text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
                  <span className="material-symbols-outlined text-lg">filter_list</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-[#233648] bg-[#17222e] overflow-hidden">
              <div className="overflow-x-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#233648 #101922" }}>
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#233648] bg-[#101922]/50 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                      <th className="px-6 py-4 font-medium whitespace-nowrap">Date & Time</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      {/* <th className="px-6 py-4 font-medium text-right">Tx Hash</th> */}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#233648]">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          {txSearch ? "No transactions match your search" : "No transactions yet"}
                        </td>
                      </tr>
                    ) : (
                      paginated.map((tx, i) => {
                        const meta = txMeta(tx.t_type);
                        const PLANK = 1_000_000_000_000;
                        const amt = tx.t_type === "stake"
                          ? (Number(tx.amount) / PLANK).toFixed(4)
                          : (Number(tx.amount) / (10 ** Number(import.meta.env.VITE_FT_DECIMALS || 12))).toFixed(4);
                        // fake tx hash from date + index
                        const hash = "0x" + Math.abs(Number(tx.date) ^ (i * 0x1234)).toString(16).padStart(8, "0").slice(0, 4) + "..." + i.toString(16).padStart(4, "0");

                        return (
                          <tr
                            key={`${tx.date}-${i}`}
                            className="group hover:bg-[#233648]/20 transition-colors"
                          >
                            {/* Type */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className={`flex size-8 items-center justify-center rounded-lg ${meta.iconBg} ${meta.iconColor}`}>
                                  <span className="material-symbols-outlined text-lg">{meta.icon}</span>
                                </div>
                                <span className="font-medium text-white">{meta.label}</span>
                              </div>
                            </td>
                            {/* Amount */}
                            <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                              {amt} VARA
                            </td>
                            {/* Date */}
                            <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                              {formatTs(tx.date)}
                            </td>
                            {/* Status */}
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-full ${meta.statusBg} px-2 py-1 text-xs font-medium ${meta.statusText}`}>
                                {meta.status}
                              </span>
                            </td>
                            {/* Tx Hash
                            <td className="px-6 py-4 text-right">
                              <a
                                href="#"
                                className="inline-flex items-center gap-1 text-primary hover:text-blue-400 transition-colors hover:underline"
                              >
                                {hash}
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                              </a>
                            </td> */}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div className="flex items-center justify-between border-t border-[#233648] bg-[#101922]/30 px-6 py-3">
                <span className="text-xs text-slate-500">
                  Showing {paginated.length === 0 ? 0 : (txPage - 1) * PAGE_SIZE + 1} to{" "}
                  {Math.min(txPage * PAGE_SIZE, filtered.length)} of {filtered.length} results
                </span>
                <div className="flex items-center gap-2">
                  {/* Prev */}
                  <button
                    disabled={txPage === 1}
                    onClick={() => setTxPage((p) => p - 1)}
                    className="flex size-8 items-center justify-center rounded-lg border border-[#233648] bg-[#17222e] text-slate-600 disabled:opacity-50 hover:text-white hover:border-slate-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, n) => n + 1)
                    .filter((n) => n === 1 || n === totalPages || Math.abs(n - txPage) <= 1)
                    .map((n, idx, arr) => (
                      <>
                        {idx > 0 && arr[idx - 1] !== n - 1 && (
                          <span key={`dots-${n}`} className="text-slate-500 text-sm px-1">…</span>
                        )}
                        <button
                          key={n}
                          onClick={() => setTxPage(n)}
                          className={`flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                            txPage === n
                              ? "bg-primary text-white"
                              : "border border-[#233648] bg-[#17222e] text-slate-400 hover:text-white hover:border-slate-500"
                          }`}
                        >
                          {n}
                        </button>
                      </>
                    ))}

                  {/* Next */}
                  <button
                    disabled={txPage === totalPages}
                    onClick={() => setTxPage((p) => p + 1)}
                    className="flex size-8 items-center justify-center rounded-lg border border-[#233648] bg-[#17222e] text-slate-400 disabled:opacity-50 hover:text-white hover:border-slate-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── Footer ───────────────────────── */}
      <footer className="mt-12 border-t border-[#233648] bg-[#101922] py-8 px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <span className="text-sm text-slate-400">© {new Date().getFullYear()} ekatStake. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-slate-400 hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-slate-400 hover:text-primary transition-colors">Privacy Policy</a>
            <div className="flex gap-4 border-l border-[#233648] pl-6">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg">language</span>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg">code</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {txModalOpen && <TxModal title="Withdrawing VARA" subtitle={txStatus} progress={txProgress} />}
    </>
  );
}
