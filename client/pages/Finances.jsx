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
          <div className="space-y-6">
            {/* Report Filters header */}
            <div className="bg-white rounded-lg border-b border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                <h3 className="text-xl font-semibold">Report Filters</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Timeframe</label>
                  <button className="mt-2 w-full bg-white border border-slate-200 rounded-md h-10 flex items-center justify-between px-3">
                    <span className="text-sm text-slate-800">Monthly</span>
                    <svg className="w-4 h-4 opacity-50 text-slate-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Data Type</label>
                  <button className="mt-2 w-full bg-white border border-slate-200 rounded-md h-10 flex items-center justify-between px-3">
                    <span className="text-sm text-slate-800">All (Revenue, Expenses, Profit)</span>
                    <svg className="w-4 h-4 opacity-50 text-slate-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Tool Filter</label>
                  <button className="mt-2 w-full bg-white border border-slate-200 rounded-md h-10 flex items-center justify-between px-3">
                    <span className="text-sm text-slate-800">All Tools</span>
                    <svg className="w-4 h-4 opacity-50 text-slate-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-700">Timeline Range (Months)</div>
                  <div className="text-xs text-slate-500">-12 to 0 months relative to today</div>
                </div>

                <div className="mt-3">
                  <div className="h-2 bg-gray-100 rounded-full relative">
                    <div className="absolute left-1/3 right-1/3 h-2 bg-slate-900 rounded-full" />
                    <div className="absolute" style={{ left: '33.3333%', transform: 'translateX(-10px)' }}>
                      <div className="w-5 h-5 bg-white border-2 border-slate-900 rounded-full" />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>2 years ago</span>
                    <span>Today</span>
                    <span>1 year future</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Big chart + legend */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="overflow-x-auto">
                <FinancialChart title="Revenue vs Expenses" />
              </div>

              <div className="mt-4">
                <p className="text-sm text-slate-800 font-semibold">Note</p>
                <p className="text-sm text-slate-600">Dashed lines indicate that the data range includes projected future values. Hollow dots indicate projected values.</p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg p-6 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-3">Period</th>
                    <th className="py-3 text-right">Revenue</th>
                    <th className="py-3 text-right">Expenses</th>
                    <th className="py-3 text-right">Profit</th>
                    <th className="py-3 text-center">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Oct 2024','$0','$0','$0'],
                    ['Nov 2024','$0','$0','$0'],
                    ['Dec 2024','$1,200','$2,500','-$1,300'],
                    ['Jan 2025','$16,000','$994','$15,006'],
                    ['Feb 2025','$0','$0','$0'],
                    ['Mar 2025','$0','$0','$0'],
                    ['Apr 2025','$0','$0','$0'],
                    ['May 2025','$0','$0','$0'],
                    ['Jun 2025','$0','$0','$0'],
                    ['Jul 2025','$0','$0','$0'],
                    ['Aug 2025','$0','$0','$0'],
                    ['Sep 2025','$0','$0','$0'],
                    ['Oct 2025','$0','$0','$0'],
                  ].map((r) => (
                    <tr key={r[0]} className="border-t border-slate-100">
                      <td className="py-3 font-medium">{r[0]}</td>
                      <td className="py-3 text-right text-green-600 font-semibold">{r[1]}</td>
                      <td className="py-3 text-right text-red-600 font-semibold">{r[2]}</td>
                      <td className="py-3 text-right text-blue-600 font-semibold">{r[3]}</td>
                      <td className="py-3 text-center"><span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold">Actual</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
