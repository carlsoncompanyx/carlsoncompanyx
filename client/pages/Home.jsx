import React, { useMemo } from 'react';
import MetricCard from '@/components/MetricCard';
import FinancialChart from '@/components/FinancialChart';
import RecentList from '@/components/RecentList';
import { useFinancialData } from '@/hooks/use-financial-data';
import { normalizeAmount, parseRecordDate } from '@/lib/financial-data';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatPercentChange(current, previous) {
  if (previous === 0 || !Number.isFinite(previous) || !Number.isFinite(current)) {
    return undefined;
  }

  const change = ((current - previous) / Math.abs(previous)) * 100;

  if (!Number.isFinite(change)) {
    return undefined;
  }

  const rounded = change.toFixed(1);
  return `${change >= 0 ? '+' : ''}${rounded}%`;
}

export default function Home() {
  const {
    revenues,
    expenses,
    monthlyTotals,
    chartData,
    totals,
    isLoading: isLoadingFinancials,
    error: financialError,
  } = useFinancialData();

  const latestPeriod = monthlyTotals[monthlyTotals.length - 1];
  const previousPeriod = monthlyTotals[monthlyTotals.length - 2];

  const revenueChange =
    latestPeriod && previousPeriod
      ? formatPercentChange(latestPeriod.revenue, previousPeriod.revenue)
      : undefined;
  const expenseChange =
    latestPeriod && previousPeriod
      ? formatPercentChange(latestPeriod.expenses, previousPeriod.expenses)
      : undefined;
  const profitChange =
    latestPeriod && previousPeriod
      ? formatPercentChange(latestPeriod.profit, previousPeriod.profit)
      : undefined;

  const summaryCards = [
    {
      title: 'Total Revenue',
      value: isLoadingFinancials ? 'Loading…' : currencyFormatter.format(totals.revenueTotal),
      percent: revenueChange,
    },
    {
      title: 'Total Expenses',
      value: isLoadingFinancials ? 'Loading…' : currencyFormatter.format(totals.expensesTotal),
      percent: expenseChange,
    },
    {
      title: 'Net Profit',
      value: isLoadingFinancials ? 'Loading…' : currencyFormatter.format(totals.netIncome),
      percent: profitChange,
    },
    {
      title: 'Active Projects',
      value: '3',
    },
  ];

  const comparisonChartData = useMemo(() => chartData.slice(-6), [chartData]);

  const formatRecentItems = useMemo(
    () => (records, type) =>
      records
        .map((record) => {
          const date = parseRecordDate(record);
          const amount = Math.abs(normalizeAmount(record?.amount));

          if (!amount) {
            return null;
          }

          const amountDisplay = `${type === 'revenue' ? '+' : '-'}${currencyFormatter.format(amount)}`;
          const label =
            type === 'revenue'
              ? record?.description || record?.source || 'Revenue'
              : record?.payee || record?.category || 'Expense';
          const formattedDate = date
            ? date.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              })
            : 'Date pending';

          return {
            label,
            date: formattedDate,
            amount: amountDisplay,
            sortTime: date ? date.getTime() : 0,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.sortTime - a.sortTime)
        .slice(0, 3)
        .map(({ sortTime, ...item }) => item),
    [],
  );

  const recentRevenue = formatRecentItems(revenues, 'revenue');
  const recentExpenses = formatRecentItems(expenses, 'expenses');

  return (
    <div>
      <div className="pt-2">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Welcome Back</h2>
          <p className="text-sm text-slate-500 mb-6">Here's what's happening with your business today.</p>
        </div>

        {financialError ? (
          <div className="mb-6 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {financialError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {summaryCards.map((card) => (
            <MetricCard key={card.title} title={card.title} value={card.value} percent={card.percent} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <FinancialChart title="Revenue & Expenses Trend" data={chartData} />
          <FinancialChart title="Monthly Comparison" data={comparisonChartData} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <RecentList
            title="Recent Revenue"
            items={recentRevenue}
            isLoading={isLoadingFinancials}
            emptyMessage="No revenue has been recorded yet."
          />
          <RecentList
            title="Recent Expenses"
            items={recentExpenses}
            isLoading={isLoadingFinancials}
            emptyMessage="No expenses have been recorded yet."
          />
        </div>
      </div>
    </div>
  );
}
