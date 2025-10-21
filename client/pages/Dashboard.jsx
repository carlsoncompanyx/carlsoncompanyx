import React, { useMemo } from "react";
import { DollarSign, TrendingUp, TrendingDown, Briefcase } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import FinancialChart from "@/components/FinancialChart";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

// Standalone Dashboard: uses fake data so app runs without external services
const sampleRevenues = [
  { id: 'r1', source: 'Consulting Services', date: new Date().toISOString(), amount: 3500 },
  { id: 'r2', source: 'Product Sales', date: new Date().toISOString(), amount: 12500 },
];

const sampleExpenses = [
  { id: 'e1', name: 'Google Workspace', date: new Date().toISOString(), amount: 144 },
  { id: 'e2', name: 'Marketing Campaign', date: new Date().toISOString(), amount: 850 },
];

const sampleMetrics = [{ id: 'm1' }, { id: 'm2' }];

export default function Dashboard() {
  const revenues = sampleRevenues;
  const expenses = sampleExpenses;
  const metrics = sampleMetrics;

  // Calculate totals
  const totalRevenue = revenues.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;

  const getMonthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthRevenue = revenues
        .filter((r) => {
          const rDate = new Date(r.date);
          return rDate >= monthStart && rDate <= monthEnd;
        })
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      const monthExpenses = expenses
        .filter((e) => {
          const eDate = new Date(e.date);
          return eDate >= monthStart && eDate <= monthEnd;
        })
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      months.push({
        month: format(date, "MMM"),
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
      });
    }
    return months;
  }, [revenues, expenses]);

  const chartData = getMonthlyData;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent mb-2">
          Welcome Back
        </h1>
        <p className="text-slate-600">Here's what's happening with your business today.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={<DollarSign />} percent="+12.5%" />
        <MetricCard title="Total Expenses" value={`$${totalExpenses.toLocaleString()}`} icon={<TrendingDown />} percent="-3.2%" />
        <MetricCard title="Net Profit" value={`$${profit.toLocaleString()}`} icon={<TrendingUp />} percent={`${profitMargin}%`} />
        <MetricCard title="Active Projects" value={`${metrics.length}`} icon={<Briefcase />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialChart data={chartData} title="Revenue & Expenses Trend" />
        <FinancialChart data={chartData} title="Monthly Comparison" type="bar" />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border-0">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Revenue</h3>
          <div className="space-y-3">
            {revenues.slice(0, 5).map((revenue) => (
              <div key={revenue.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{revenue.source}</p>
                  <p className="text-sm text-slate-500">{format(new Date(revenue.date), "MMM d, yyyy")}</p>
                </div>
                <p className="font-bold text-green-600">+${revenue.amount.toLocaleString()}</p>
              </div>
            ))}
            {revenues.length === 0 && <p className="text-slate-500 text-center py-8">No revenue recorded yet</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-0">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Expenses</h3>
          <div className="space-y-3">
            {expenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{expense.name}</p>
                  <p className="text-sm text-slate-500">{format(new Date(expense.date), "MMM d, yyyy")}</p>
                </div>
                <p className="font-bold text-red-600">-${expense.amount.toLocaleString()}</p>
              </div>
            ))}
            {expenses.length === 0 && <p className="text-slate-500 text-center py-8">No expenses recorded yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
