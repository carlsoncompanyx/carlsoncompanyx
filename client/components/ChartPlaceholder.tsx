import React from "react";

export default function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-100 p-6 shadow-sm h-64">
      <div className="text-sm font-medium text-slate-700 mb-4">{title}</div>
      <div className="h-[calc(100%-40px)] bg-gradient-to-b from-slate-50 to-white rounded border border-dashed border-slate-100 flex items-center justify-center text-slate-300">
        Chart Placeholder
      </div>
    </div>
  );
}
