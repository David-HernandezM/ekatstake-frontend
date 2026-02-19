import { Route, Routes, useLocation } from "react-router-dom";
import { Staking } from "./Staking";
import { Landing } from "./Landing";
import { Dashboard } from "./Dashboard";

function Routing({ setBalanceChanged, balanceChanged }: any) {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Landing setBalanceChanged={setBalanceChanged} balanceChanged={balanceChanged} />} />
      <Route path="/stake" element={<Staking setBalanceChanged={setBalanceChanged} balanceChanged={balanceChanged} />} />
      <Route path="/dashboard" element={<Dashboard setBalanceChanged={setBalanceChanged} balanceChanged={balanceChanged} />} />
    </Routes>
  );
}

export { Routing };
