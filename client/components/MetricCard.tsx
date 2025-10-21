import React from "react";

interface Props {
  title: string;
  value: string;
  percent?: string;
  gradientFrom?: string;
  gradientTo?: string;
  icon?: React.ReactNode;
}

export default function MetricCard({ title, value, percent, gradientFrom = "from-sky-500", gradientTo = "to-emerald-500", icon, }: Props) {
  return (
    <div className="relative bg-white rounded-lg shadow-sm border border-slate-100 p-6">
      <div className="absolute -top-6 -right-6 opacity-10 w-32 h-32 rounded-full" style={{ background: `linear-gradient(135deg,var(--tw-gradient-stops))` }}>
        {/* decorative circle via tailwind gradients: container will inherit gradient classes if needed */}
      </div>

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center text-white`} style={{ background: "linear-gradient(135deg,#06b6d4,#7c3aed)" }}>
            {icon}
          </div>
          <div>
            <div className="text-xs text-slate-500">{title}</div>
            <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
          </div>
        </div>
        {percent ? (
          <div className="text-sm font-medium text-green-600">{percent}</div>
        ) : null}
      </div>
    </div>
  );
}
