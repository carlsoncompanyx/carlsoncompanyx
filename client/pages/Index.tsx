import { useEffect, useState } from "react";
import Header from "@/components/Header";
import MetricCard from "@/components/MetricCard";
import FinancialChart from "@/components/FinancialChart";
import RecentList from "@/components/RecentList";

export default function Index() {
  const [exampleFromServer, setExampleFromServer] = useState("");

  useEffect(() => {
    fetchDemo();
  }, []);

  const fetchDemo = async () => {
    try {
      const response = await fetch("/api/demo");
      const data = await response.json();
      setExampleFromServer(data.message ?? "");
    } catch (error) {
      // ignore
    }
  };

  const recentRevenue = [
    { label: "Consulting Services", date: "Jan 19, 2025", amount: "+$ 3,500" },
    { label: "Monthly Subscriptions", date: "Dec 31, 2024", amount: "+$ 1,200" },
    { label: "Product Sales", date: "Jan 14, 2025", amount: "+$ 12,500" },
  ];

  const recentExpenses = [
    { label: "Google Workspace", date: "Jan 4, 2025", amount: "-$ 144" },
    { label: "Marketing Campaign", date: "Jan 9, 2025", amount: "-$ 850" },
    { label: "Office Rent", date: "Dec 31, 2024", amount: "-$ 2,500" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="main max-w-7xl mx-auto">
        <div className="pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-800 to-sky-600">Welcome Back</h1>
              <p className="text-sm text-slate-500 mt-1">Here's what's happening with your business today.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <MetricCard title="Total Revenue" value="$17,200" percent="+12.5%" icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><line x1="12" x2="12" y1="2" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>} />

            <MetricCard title="Total Expenses" value="$3,494" percent="-3.2%" icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline></svg>} />

            <MetricCard title="Net Profit" value="$13,706" percent="+79.7%" icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline></svg>} />

            <MetricCard title="Active Projects" value="3" icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path><rect width="20" height="14" x="2" y="6" rx="2"></rect></svg>} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <FinancialChart title="Revenue & Expenses Trend" />
            <FinancialChart title="Monthly Comparison" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <RecentList title="Recent Revenue" items={recentRevenue} />
            <RecentList title="Recent Expenses" items={recentExpenses} />
          </div>

          <p className="sr-only">{exampleFromServer}</p>
        </div>
      </main>
    </div>
  );
}
