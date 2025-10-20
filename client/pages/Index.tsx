import { DemoResponse } from "@shared/api";
import { useEffect, useState } from "react";

import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import ChartPlaceholder from "@/components/ChartPlaceholder";

export default function Index() {
  const [exampleFromServer, setExampleFromServer] = useState("");

  useEffect(() => {
    fetchDemo();
  }, []);

  const fetchDemo = async () => {
    try {
      const response = await fetch("/api/demo");
      const data = (await response.json()) as DemoResponse;
      setExampleFromServer(data.message);
    } catch (error) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-800">Welcome Back</h1>
          <p className="text-sm text-slate-500 mt-1">Here's what's happening with your business today.</p>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard title="Total Revenue" value="$17,200" icon={<span className="text-green-600">$</span>} percent="+12.5%" />
          <StatsCard title="Total Expenses" value="$3,494" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>} percent="-3.2%" />
          <StatsCard title="Net Profit" value="$13,706" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" /></svg>} percent="+79.7%" />
          <StatsCard title="Active Projects" value="3" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" /></svg>} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartPlaceholder title="Revenue & Expenses Trend" />
          <ChartPlaceholder title="Monthly Comparison" />
        </section>

        <p className="sr-only">{exampleFromServer}</p>
      </main>
    </div>
  );
}
