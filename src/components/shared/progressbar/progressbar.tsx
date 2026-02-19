import { useState, useEffect } from "react";

interface Props {
  title: string;
  subtitle: string;
  actualProgress: number;
  updateProgress: (update: any) => void;
}

export function ProgressBar({ title, subtitle, actualProgress }: Props) {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => { setCurrentProgress(actualProgress); }, [actualProgress]);

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-white font-semibold">{title}</h2>
      <p className="text-slate-400 text-sm">{subtitle}</p>
      <div className="relative h-2 rounded-full bg-black/40 overflow-hidden mt-1">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-1000"
          style={{ width: `${currentProgress}%` }}
        />
      </div>
    </div>
  );
}
