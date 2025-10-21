import React from "react";

export function RecentList({ title, items }: { title: string; items: { label: string; date: string; amount: string }[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-md">
            <div>
              <p className="text-sm font-medium text-slate-900">{it.label}</p>
              <p className="text-xs text-slate-500">{it.date}</p>
            </div>
            <div className={`text-sm font-semibold ${it.amount.startsWith("+") ? "text-emerald-600" : "text-rose-600"}`}>{it.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentList;
