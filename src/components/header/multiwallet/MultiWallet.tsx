import { useAccount } from "@gear-js/react-hooks";
import { useState } from "react";
import { AccountsModal } from "./accounts-modal";
import { AccountButton } from "./account-button";
import { Balance } from "./balance";

const MultiWallet = ({ balanceChanged }: any) => {
  const { account, isAccountReady } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        <Balance balanceChanged={balanceChanged} />

        {isAccountReady &&
          (account ? (
            <AccountButton
              isNavBar
              name={account.meta.name}
              address={account.address}
              onClick={() => setIsModalOpen(true)}
            />
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-[0_0_15px_rgba(19,127,236,0.3)] hover:bg-blue-600 transition-colors"
            >
              Connect Wallet
            </button>
          ))}
      </div>

      {isModalOpen && <AccountsModal close={() => setIsModalOpen(false)} />}
    </>
  );
};

export { MultiWallet };
