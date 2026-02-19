import { useState } from "react";
import { SmartContract } from "@/services/SmartContract";
import { Stake } from "./Stake";
import { Unstake } from "./Unstake";

type Tab = "Stake" | "Unstake";

type Props = {
  account: any;
  accounts: any;
  contract: SmartContract;
  balanceChanged: any;
  setBalanceChanged: any;
};

export function TabListStaking({ account, accounts, contract, balanceChanged, setBalanceChanged }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Stake");
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="glass-panel rounded-2xl shadow-2xl overflow-hidden w-full">
      {/* ── Tab switcher ─────────────────────────── */}
      <div className="p-1">
        <div className="grid grid-cols-2 gap-1 bg-black/20 rounded-xl p-1">
          {(["Stake", "Unstake"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────── */}
      <div className="px-5 pb-6 pt-2">
        {activeTab === "Stake" ? (
          <Stake
            account={account}
            isModalOpen={isModalOpen}
            openModal={() => setIsModalOpen(true)}
            closeModal={() => setIsModalOpen(false)}
            contract={contract}
            balanceChanged={balanceChanged}
            setBalanceChanged={setBalanceChanged}
          />
        ) : (
          <Unstake
            account={account}
            isModalOpen={isModalOpen}
            openModal={() => setIsModalOpen(true)}
            closeModal={() => setIsModalOpen(false)}
            contract={contract}
            balanceChanged={balanceChanged}
            setBalanceChanged={setBalanceChanged}
          />
        )}
      </div>
    </div>
  );
}
