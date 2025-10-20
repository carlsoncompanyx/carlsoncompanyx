import React from "react";

interface Props {
  title: string;
  value: string;
  icon?: React.ReactNode;
  percent?: string;
  className?: string;
}

export default function StatsCard({ title, value, icon, percent, className = "" }: Props) {
  return (
    <div className={`relative bg-white rounded-lg shadow-sm border border-slate-100 p-5 ${className}`}>
      {percent ? (
        <div className="absolute -top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-medium shadow">
          <span className="text-sm text-green-600">{percent}</span>
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl text-slate-700">
          {icon}
        </div>
        <div>
          <div className="text-xs text-slate-500">{title}</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
        </div>
      </div>
    </div>
  );
}
