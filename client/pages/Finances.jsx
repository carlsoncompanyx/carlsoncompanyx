import React from 'react';
import FinancialChart from '@/components/FinancialChart';

export default function Finances(){
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Finances</h2>
      <p className="text-sm text-slate-500 mb-6">Overview of your finances (mocked).</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialChart title="Revenue vs Expenses" />
        <FinancialChart title="Cashflow" />
      </div>
    </div>
  );
}
