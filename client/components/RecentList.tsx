import React from "react";

type RecentItem = { label: string; date: string; amount: string };

interface RecentListProps {
  title: string;
  items: RecentItem[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function RecentList({
  title,
  items,
  isLoading = false,
  emptyMessage = "No recent activity yet.",
}: RecentListProps) {
  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading recent activity…</p>
      ) : hasItems ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${item.label}-${item.date}-${index}`} className="flex items-center justify-between bg-white p-3 rounded-md">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500">{item.date}</p>
              </div>
              <div
                className={`text-sm font-semibold ${item.amount.startsWith("+") ? "text-emerald-600" : "text-rose-600"}`}
              >
                {item.amount}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      )}
    </div>
  );
}

export default RecentList;
