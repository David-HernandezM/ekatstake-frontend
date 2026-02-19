import Identicon from "@polkadot/react-identicon";
import {buttonStyles} from "@gear-js/ui";
import { useEffect, useState } from "react";

type Props = {
  isNavBar?: boolean;
  name?: string;
  address: string;
  className?: string;
  onClick: () => void;
};

const AccountButton = ({ isNavBar, name = "", address, className, onClick }: Props) => {
  const [isSmall, setIsSmall] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsSmall(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const shortAddr = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : "";
  const shortName = name.length > 11 ? `${name?.slice(0, 11)}...` : name;

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-2 rounded-lg bg-primary ${!isNavBar ? "px-16" : "px-5"} py-2 w-full text-sm font-bold text-white shadow-[0_0_15px_rgba(19,127,236,0.3)] hover:bg-blue-600 transition-colors ${className ?? ""}`}
    >
      <Identicon value={address} className={buttonStyles.icon} theme="polkadot" size={28}/>
      {isSmall && isNavBar ? null : shortName}

    </button>
  );
};

export { AccountButton };
