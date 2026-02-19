import { useAccount, useApi } from "@gear-js/react-hooks";
import { ApiLoader } from "@/components";
import { Header } from "@/components";
import { withProviders } from "@/app/hocs";
import { useWalletSync } from "./components/header/wallet/hooks";
import { Routing } from "./pages";
import { useState } from "react";
import "@/App.css";

function Component() {
  const { isApiReady } = useApi();
  const { isAccountReady } = useAccount();

  useWalletSync();

  const isAppReady = isApiReady && isAccountReady;
  const [balanceChanged, setBalanceChanged] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#101922] font-sans">
      <Header balanceChanged={balanceChanged} />
      {isAppReady
        ? <Routing setBalanceChanged={setBalanceChanged} balanceChanged={balanceChanged} />
        : <ApiLoader />
      }
    </div>
  );
}

export const App = withProviders(Component);
