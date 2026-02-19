import TokenIcon from "@/assets/images/token/ekatstake_token.svg";

function ApiLoader() {
  return (
    <div className="flex items-center justify-center min-h-[90vh] bg-bg-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-primary-glow-lg animate-pulse">
          <img src={TokenIcon} alt="EkatStake Token" className="w-9 h-9" />
        </div>
        <p className="text-slate-400 text-sm animate-pulse">Connecting to Vara Network...</p>
      </div>
    </div>
  );
}

export { ApiLoader };
