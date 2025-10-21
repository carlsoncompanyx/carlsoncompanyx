import React from 'react';
import { useState } from "react";
import FinancialChart from '@/components/FinancialChart';

export default function Finances(){
  const [tab, setTab] = useState('reporting');

  // mock numbers for charts and tax calc
  const totalRevenue = 13706;
  const totalExpenses = 4200;
  const taxRate = 0.21;
  const estimatedTax = Math.round((totalRevenue - totalExpenses) * taxRate);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Finances</h2>
      <p className="text-sm text-slate-500 mb-6">Overview of your finances (mocked).</p>

      <div role="tablist" aria-orientation="horizontal" className="bg-gray-100 rounded-md p-1 max-w-3xl mb-6 grid grid-cols-3 gap-2">
        <button
          role="tab"
          aria-selected={tab === 'reporting'}
          onClick={() => setTab('reporting')}
          className={`py-2 px-4 text-sm font-medium rounded ${tab === 'reporting' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
        >
          Reporting
        </button>
        <button
          role="tab"
          aria-selected={tab === 'expenses'}
          onClick={() => setTab('expenses')}
          className={`py-2 px-4 text-sm font-medium rounded ${tab === 'expenses' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
        >
          Expenses
        </button>
        <button
          role="tab"
          aria-selected={tab === 'taxes'}
          onClick={() => setTab('taxes')}
          className={`py-2 px-4 text-sm font-medium rounded ${tab === 'taxes' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
        >
          Tax Estimate
        </button>
      </div>

      <div>
        {tab === 'reporting' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinancialChart title="Revenue vs Expenses" />
            <FinancialChart title="Cashflow" />
          </div>
        )}

        {tab === 'expenses' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Recent Expenses</h3>
              <ul className="space-y-3">
                <li className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                  <div>
                    <div className="font-medium text-slate-900">Marketing Campaign</div>
                    <div className="text-sm text-slate-500">Sep 12, 2025</div>
                  </div>
                  <div className="font-bold text-red-600">-$850</div>
                </li>
                <li className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                  <div>
                    <div className="font-medium text-slate-900">Google Workspace</div>
                    <div className="text-sm text-slate-500">Sep 1, 2025</div>
                  </div>
                  <div className="font-bold text-red-600">-$144</div>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Expense Summary</h3>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">Total Expenses</div>
                <div className="font-semibold text-slate-900">${totalExpenses.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {tab === 'taxes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Estimate</h3>
              <p className="text-sm text-slate-500 mb-4">Estimated tax based on your mocked revenue and expenses.</p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">Taxable Income</div>
                <div className="font-semibold text-slate-900">${(totalRevenue - totalExpenses).toLocaleString()}</div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-slate-500">Tax Rate</div>
                <div className="font-semibold text-slate-900">{Math.round(taxRate * 100)}%</div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-slate-500">Estimated Tax</div>
                <div className="text-2xl font-bold text-slate-900">${estimatedTax.toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Notes</h3>
              <p className="text-sm text-slate-500">This is a simple estimate using a flat tax rate for demonstration. Connect a real accounting service or Supabase records for accurate results.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
