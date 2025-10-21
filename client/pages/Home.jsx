import React from 'react';
import MetricCard from '@/components/MetricCard';
import FinancialChart from '@/components/FinancialChart';
import RecentList from '@/components/RecentList';

export default function Home() {
  const recentRevenue = [
    { label: 'Consulting Services', date: 'Jan 19, 2025', amount: '+$ 3,500' },
    { label: 'Monthly Subscriptions', date: 'Dec 31, 2024', amount: '+$ 1,200' },
    { label: 'Product Sales', date: 'Jan 14, 2025', amount: '+$ 12,500' },
  ];

  const recentExpenses = [
    { label: 'Google Workspace', date: 'Jan 4, 2025', amount: '-$ 144' },
    { label: 'Marketing Campaign', date: 'Jan 9, 2025', amount: '-$ 850' },
    { label: 'Office Rent', date: 'Dec 31, 2024', amount: '-$ 2,500' },
  ];

  return (
    <div>
      <div className="pt-2">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-800 to-sky-600">Welcome Back</h1>
          <p className="text-sm text-slate-500 mt-1">Here's what's happening with your business today.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <MetricCard title="Total Revenue" value="$17,200" percent="+12.5%" />
          <MetricCard title="Total Expenses" value="$3,494" percent="-3.2%" />
          <MetricCard title="Net Profit" value="$13,706" percent="+79.7%" />
          <MetricCard title="Active Projects" value="3" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <FinancialChart title="Revenue & Expenses Trend" />
          <FinancialChart title="Monthly Comparison" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <RecentList title="Recent Revenue" items={recentRevenue} />
          <RecentList title="Recent Expenses" items={recentExpenses} />
        </div>
      </div>
    </div>
  );
}
