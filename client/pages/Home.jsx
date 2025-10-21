import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, TrendingDown, Mail, Youtube, ShoppingBag } from "lucide-react";
import MetricCard from "../components/dashboard/MetricCard";
import FinancialChart from "../components/charts/FinancialChart";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export default function Home() {
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list("-created_date"),
  });

  const { data: revenues = [] } = useQuery({
    queryKey: ['revenues'],
    queryFn: () => base44.entities.Revenue.list("-created_date"),
  });

  const { data: emails = [] } = useQuery({
    queryKey: ['emails'],
    queryFn: () => base44.entities.Email.list("-received_date"),
  });

  const { data: youtubeMetrics = [] } = useQuery({
    queryKey: ['youtube_metrics'],
    queryFn: () => base44.entities.YouTubeMetric.list("-date"),
  });

  const { data: etsyMetrics = [] } = useQuery({
    queryKey: ['etsy_metrics'],
    queryFn: () => base44.entities.EtsyMetric.list("-date"),
  });

  const totalRevenue = revenues.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const profit = totalRevenue - totalExpenses;
  const unreadEmails = emails.filter(e => !e.is_read).length;

  const latestYouTube = youtubeMetrics[0];
  const latestEtsy = etsyMetrics[0];

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
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
          Welcome Back
        </h1>
        <p className="text-slate-600">Here's an overview of your business performance.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Net Profit"
          value={`$${profit.toLocaleString()}`}
          icon={DollarSign}
          color="green"
          trend={profit >= 0 ? "up" : "down"}
          trendValue={`$${Math.abs(profit).toLocaleString()}`}
        />
        <MetricCard
          title="Unread Emails"
          value={unreadEmails}
          icon={Mail}
          color="blue"
        />
        <MetricCard
          title="YouTube Views"
          value={latestYouTube?.views?.toLocaleString() || "0"}
          icon={Youtube}
          color="amber"
          trend="up"
          trendValue="+8.2%"
        />
        <MetricCard
          title="Etsy Sales"
          value={latestEtsy?.orders || "0"}
          icon={ShoppingBag}
          color="purple"
          trend="up"
          trendValue="+5 today"
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

        <div className="bg-white rounded-2xl shadow-xl p-6 border-0">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Emails</h3>
          <div className="space-y-3">
            {emails.slice(0, 5).map((email) => (
              <div key={email.id} className={`flex items-center justify-between p-3 rounded-lg ${email.is_read ? 'bg-slate-50' : 'bg-blue-50'}`}>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-slate-900 truncate ${!email.is_read ? 'font-bold' : ''}`}>
                    {email.from_name || email.from_email}
                  </p>
                  <p className="text-sm text-slate-500 truncate">{email.subject}</p>
                </div>
                {!email.is_read && (
                  <div className="w-2 h-2 rounded-full bg-blue-600 ml-2" />
                )}
              </div>
            ))}
            {emails.length === 0 && (
              <p className="text-slate-500 text-center py-8">No emails yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
