import { Link, useLocation } from "react-router-dom";
import { MultiWallet } from "./multiwallet";
import TokenIcon from "@/assets/images/token/ekatstake_token.svg";

export function Header({ balanceChanged }: any) {
  const { pathname } = useLocation();

  const navLinks = [
    { to: "/",          label: "Home"      },
    { to: "/stake",      label: "Stake"     },
    { to: "/dashboard", label: "Dashboard" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#233648] bg-[#101922]/80 backdrop-blur-md px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">

        <Link to="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/20">
            <img src={TokenIcon} alt="EkatStake Token" className="w-9 h-9" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">ekatStake</h1>
        </Link>

        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 rounded-full bg-[#17222e] border border-[#233648] p-1.5 shadow-lg shadow-black/20">
          {navLinks.map(({ to, label }) => {
            const isActive = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`px-5 py-2 text-sm font-medium transition-all rounded-full ${
                  isActive
                    ? "text-white bg-primary shadow-lg shadow-primary/25"
                    : "text-slate-400 hover:text-white hover:bg-[#233648]/50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <MultiWallet balanceChanged={balanceChanged} />
        </div>

      </div>
    </header>
  );
}
