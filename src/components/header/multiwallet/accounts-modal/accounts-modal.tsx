import { useAccount } from "@gear-js/react-hooks";
import { Button, Modal } from "@gear-js/ui";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { isWeb3Injected } from "@polkadot/extension-dapp";
import { AiOutlineLogout } from "react-icons/ai";
import { AccountButton } from "../account-button";
import { useWallet } from "../hooks";
import { WALLETS } from "@/components/header/multiwallet/consts";

type Props = {
  close: () => void;
};

const   AccountsModal = ({ close }: Props) => {
  const { account, extensions, login, logout } = useAccount();
  const { wallet, walletAccounts, setWalletId, resetWalletId, getWalletAccounts } = useWallet();

  const handleLogoutClick = () => { logout(); close(); };
  const handleAccountClick = (a: InjectedAccountWithMeta) => { login(a); close(); };

  const heading = wallet ? "Connect account" : "Choose Wallet";

  const getWallets = () =>
    WALLETS.map(([id, { image, name }]: any) => {
      const isEnabled = extensions?.some((ext) => ext.name === id);
      const count = getWalletAccounts(id)?.length;
      const status = `${count} ${count === 1 ? 'account' : 'accounts'}`;
      return (
        <button
          key={id}
          onClick={() => setWalletId(id)}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface border border-border-color hover:border-border-primary transition-all duration-200 mb-2"
        >
          <img src={image} alt={name} width={24} height={24} className="rounded" />
          <span className="text-white font-medium flex-1 text-left">{name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${isEnabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700/40 text-slate-500'}`}>
            {isEnabled ? status : 'Not installed'}
          </span>
        </button>
      );
    });

  const getAccounts = () =>
    walletAccounts?.map((_account) => {
      const { address, meta } = _account;
      const isActive = address === account?.address;

      const handleClick = () => {
          if (isActive) return;
          handleAccountClick(_account);
        };

      return (
        <div
          key={address}
          className="mb-2 rounded-xl overflow-hidden border transition-all hover:border-primary/50"
        >
          <AccountButton
            isNavBar={false}
            name={meta.name}
            address={address}
            onClick={handleClick}
          />
        </div>
      );
    });

  return (
    <Modal 
      heading={heading} 
      close={close}
    >
      {isWeb3Injected ? (
        <>
          {!wallet && <ul>{getWallets()}</ul>}
          {!!wallet &&
            (walletAccounts?.length ? (
              <ul>{getAccounts()}</ul>
            ) : (
              <p className="text-slate-400 text-sm py-4">
                No accounts found. Open your Polkadot extension, create or import an account, then reload this page.
              </p>
            ))}
          <footer className="flex items-center justify-between mt-4 pt-4 border-t border-border-color">
            {wallet && (
              <button
                onClick={resetWalletId}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← {wallet.name}
              </button>
            )}
            {account && (
              <Button icon={AiOutlineLogout} text="Logout" color="transparent" onClick={handleLogoutClick} />
            )}
          </footer>
        </>
      ) : (
        <p className="text-slate-400 text-sm py-2">
          Wallet extension not found. See how to install a supported wallet{' '}
          <a href="https://wiki.gear-tech.io/docs/idea/account/create-account" target="_blank" rel="noreferrer" className="text-primary hover:underline">
            here
          </a>.
        </p>
      )}
    </Modal>
  );
};

export { AccountsModal };
