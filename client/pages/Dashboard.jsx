import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, TrendingDown, Briefcase } from "lucide-react";
import MetricCard from "../components/dashboard/MetricCard";
import FinancialChart from "../components/charts/FinancialChart";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export default function Dashboard() {
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list("-created_date"),
  });

  const { data: revenues = [] } = useQuery({
    queryKey: ['revenues'],
    queryFn: () => base44.entities.Revenue.list("-created_date"),
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => base44.entities.Metric.list("-created_date"),
  });

  // Calculate totals
  const totalRevenue = revenues.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;

  // Calculate monthly data for charts
  const getMonthlyData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthRevenue = revenues
        .filter(r => {
          const rDate = new Date(r.date);
          return rDate >= monthStart && rDate <= monthEnd;
        })
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      const monthExpenses = expenses
        .filter(e => {
          const eDate = new Date(e.date);
          return eDate >= monthStart && eDate <= monthEnd;
        })
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      months.push({
        month: format(date, 'MMM'),
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses
      });
    }
    return months;
  };

  const chartData = getMonthlyData();

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
        <MetricCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="green"
          trend="up"
          trendValue="+12.5%"
        />
        <MetricCard
          title="Total Expenses"
          value={`$${totalExpenses.toLocaleString()}`}
          icon={TrendingDown}
          color="blue"
          trend="down"
          trendValue="-3.2%"
        />
        <MetricCard
          title="Net Profit"
          value={`$${profit.toLocaleString()}`}
          icon={TrendingUp}
          color="amber"
          trend={profit >= 0 ? "up" : "down"}
          trendValue={`${profitMargin}%`}
        />
        <MetricCard
          title="Active Projects"
          value={metrics.length}
          icon={Briefcase}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialChart
          data={chartData}
          title="Revenue & Expenses Trend"
          type="line"
        />
        <FinancialChart
          data={chartData}
          title="Monthly Comparison"
          type="bar"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Revenue */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-0">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Revenue</h3>
          <div className="space-y-3">
            {revenues.slice(0, 5).map((revenue) => (
              <div key={revenue.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{revenue.source}</p>
                  <p className="text-sm text-slate-500">{format(new Date(revenue.date), 'MMM d, yyyy')}</p>
                </div>
                <p className="font-bold text-green-600">+${revenue.amount.toLocaleString()}</p>
              </div>
            ))}
            {revenues.length === 0 && (
              <p className="text-slate-500 text-center py-8">No revenue recorded yet</p>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-0">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Expenses</h3>
          <div className="space-y-3">
            {expenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{expense.name}</p>
                  <p className="text-sm text-slate-500">{format(new Date(expense.date), 'MMM d, yyyy')}</p>
                </div>
                <p className="font-bold text-red-600">-${expense.amount.toLocaleString()}</p>
              </div>
            ))}
            {expenses.length === 0 && (
              <p className="text-slate-500 text-center py-8">No expenses recorded yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
