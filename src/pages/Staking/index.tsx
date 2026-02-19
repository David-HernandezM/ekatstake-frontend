import { useAccount, useAlert, useApi } from "@gear-js/react-hooks";
import { SmartContract } from "@/services/SmartContract";
import { TabListStaking } from "@/components/staking/TabListStaking";

export const Staking = ({ setBalanceChanged, balanceChanged }: any) =>{
  const { api } = useApi();
  const { accounts, account } = useAccount();
  const alert = useAlert();

  const contract = new SmartContract(api!, account!, accounts, alert);

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#101922]">

      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(#137fec 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div
        className="absolute pointer-events-none z-0"
        style={{
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(19,127,236,0.08) 0%, rgba(19,127,236,0) 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2 z-0" />
      <div className="fixed top-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none -translate-x-1/3 -translate-y-1/3 z-0" />

      <div className="relative z-10 w-full max-w-[480px]">
        <TabListStaking
          account={account}
          accounts={accounts}
          contract={contract}
          setBalanceChanged={setBalanceChanged}
          balanceChanged={balanceChanged}
        />
      </div>
    </div>
  );
}