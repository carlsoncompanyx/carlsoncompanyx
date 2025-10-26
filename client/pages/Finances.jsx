import { useMemo, useState } from "react";
import FinancialChart from "@/components/FinancialChart";
import { insertExpense } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useFinancialData } from "@/hooks/use-financial-data";

export default function Finances() {
  const { session } = useAuth();
  const [tab, setTab] = useState("reporting");
  const [date, setDate] = useState("");
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState("");
  const {
    monthlyTotals,
    chartData,
    totals,
    taxExpenses,
    isLoading: isLoadingFinancials,
    error: financialError,
    refresh: refreshFinancials,
  } = useFinancialData();

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }),
    [],
  );

  const chartDescription =
    "Values are aggregated by month using revenue and expense entries from Supabase. Profit represents revenue minus expenses.";

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Finances</h2>
      <p className="text-sm text-slate-500 mb-6">
        Overview of your finances based on revenue and expense records stored in Supabase.
      </p>

      <div
        role="tablist"
        aria-orientation="horizontal"
        className="bg-gray-100 rounded-md p-1 max-w-3xl mb-6 grid grid-cols-3 gap-2"
      >
        <button
          role="tab"
          aria-selected={tab === "reporting"}
          onClick={() => setTab("reporting")}
          className={`py-2 px-4 text-sm font-medium rounded ${tab === "reporting" ? "bg-white shadow-sm" : "text-gray-600"}`}
        >
          Reporting
        </button>
        <button
          role="tab"
          aria-selected={tab === "submit-expense"}
          onClick={() => setTab("submit-expense")}
          className={`py-2 px-4 text-sm font-medium rounded ${tab === "submit-expense" ? "bg-white shadow-sm" : "text-gray-600"}`}
        >
          Submit Expense
        </button>
        <button
          role="tab"
          aria-selected={tab === "taxes"}
          onClick={() => setTab("taxes")}
          className={`py-2 px-4 text-sm font-medium rounded ${tab === "taxes" ? "bg-white shadow-sm" : "text-gray-600"}`}
        >
          Tax Estimate
        </button>
      </div>

      <div>
        {tab === "reporting" && (
          <div className="space-y-6">
            {/* Report Filters header */}
            <div className="bg-white rounded-lg border-b border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <svg
                  className="w-6 h-6 text-slate-900"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <h3 className="text-xl font-semibold">Report Filters</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Timeframe
                  </label>
                  <button className="mt-2 w-full bg-white border border-slate-200 rounded-md h-10 flex items-center justify-between px-3">
                    <span className="text-sm text-slate-800">Monthly</span>
                    <svg
                      className="w-4 h-4 opacity-50 text-slate-900"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Data Type
                  </label>
                  <button className="mt-2 w-full bg-white border border-slate-200 rounded-md h-10 flex items-center justify-between px-3">
                    <span className="text-sm text-slate-800">
                      All (Revenue, Expenses, Profit)
                    </span>
                    <svg
                      className="w-4 h-4 opacity-50 text-slate-900"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Tool Filter
                  </label>
                  <button className="mt-2 w-full bg-white border border-slate-200 rounded-md h-10 flex items-center justify-between px-3">
                    <span className="text-sm text-slate-800">All Tools</span>
                    <svg
                      className="w-4 h-4 opacity-50 text-slate-900"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-700">
                    Timeline Range (Months)
                  </div>
                  <div className="text-xs text-slate-500">
                    -12 to 0 months relative to today
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-2 bg-gray-100 rounded-full relative">
                    <div className="absolute left-1/3 right-1/3 h-2 bg-slate-900 rounded-full" />
                    <div
                      className="absolute"
                      style={{
                        left: "33.3333%",
                        transform: "translateX(-10px)",
                      }}
                    >
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
                <FinancialChart
                  title="Revenue vs Expenses"
                  data={chartData}
                />
              </div>

              {isLoadingFinancials ? (
                <p className="mt-4 text-sm text-slate-500">
                  Loading financial data…
                </p>
              ) : financialError ? (
                <p className="mt-4 text-sm text-red-600">{financialError}</p>
              ) : (
                <div className="mt-4 space-y-1">
                  <p className="text-sm text-slate-800 font-semibold">
                    About this chart
                  </p>
                  <p className="text-sm text-slate-600">
                    {chartDescription}
                  </p>
                </div>
              )}
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
                  {isLoadingFinancials ? (
                    <tr>
                      <td
                        className="py-6 text-center text-slate-500"
                        colSpan={5}
                      >
                        Loading financial data…
                      </td>
                    </tr>
                  ) : financialError ? (
                    <tr>
                      <td
                        className="py-6 text-center text-red-600"
                        colSpan={5}
                      >
                        {financialError}
                      </td>
                    </tr>
                  ) : monthlyTotals.length === 0 ? (
                    <tr>
                      <td
                        className="py-6 text-center text-slate-500"
                        colSpan={5}
                      >
                        No financial records found yet.
                      </td>
                    </tr>
                  ) : (
                    monthlyTotals.map((row) => {
                      const profitClass =
                        row.profit >= 0
                          ? "text-right text-emerald-600 font-semibold"
                          : "text-right text-red-600 font-semibold";
                      const typeLabel =
                        row.revenue > 0 && row.expenses > 0
                          ? "Revenue & Expenses"
                          : row.revenue > 0
                          ? "Revenue"
                          : "Expenses";

                      return (
                        <tr key={row.key} className="border-t border-slate-100">
                          <td className="py-3 font-medium">{row.period}</td>
                          <td className="py-3 text-right text-emerald-600 font-semibold">
                            {currencyFormatter.format(row.revenue)}
                          </td>
                          <td className="py-3 text-right text-red-600 font-semibold">
                            {currencyFormatter.format(row.expenses)}
                          </td>
                          <td className={`py-3 ${profitClass}`}>
                            {currencyFormatter.format(row.profit)}
                          </td>
                          <td className="py-3 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold">
                              {typeLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "submit-expense" && (
          <div className="bg-white rounded-2xl shadow p-6 max-w-xl">
            <h3 className="text-lg font-semibold mb-3">Submit a new expense</h3>
            <p className="text-sm text-slate-500 mb-6">
              Enter the expense details below to send them to your Supabase
              expenses table.
            </p>
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setSubmissionError("");
                setSubmissionSuccess("");

                if (!date || !payee || !amount) {
                  setSubmissionError(
                    "Please provide a date, payee, and amount before submitting.",
                  );
                  return;
                }

                const parsedAmount = Number(amount);
                if (Number.isNaN(parsedAmount)) {
                  setSubmissionError("Amount must be a valid number.");
                  return;
                }

                setIsSubmitting(true);
                try {
                  if (!session) {
                    throw new Error(
                      "You must be signed in to submit expenses.",
                    );
                  }

                  await insertExpense(
                    {
                      date,
                      payee: payee.trim(),
                      recurring_expense: isRecurring,
                      amount: parsedAmount,
                    },
                    session.accessToken,
                  );
                  setSubmissionSuccess("Expense submitted successfully.");
                  setDate("");
                  setPayee("");
                  setAmount("");
                  setIsRecurring(false);
                  await refreshFinancials();
                } catch (error) {
                  setSubmissionError(
                    error instanceof Error
                      ? error.message
                      : "Failed to submit expense.",
                  );
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div>
                <label
                  className="block text-sm font-medium text-slate-700"
                  htmlFor="expense-date"
                >
                  Date
                </label>
                <input
                  id="expense-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-2 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-slate-700"
                  htmlFor="expense-payee"
                >
                  Payee
                </label>
                <input
                  id="expense-payee"
                  type="text"
                  value={payee}
                  onChange={(event) => setPayee(event.target.value)}
                  className="mt-2 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  placeholder="e.g. Google Workspace"
                  required
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-slate-700"
                  htmlFor="expense-amount"
                >
                  Amount
                </label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">
                    $
                  </span>
                  <input
                    id="expense-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 pl-7 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="expense-recurring"
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(event) => setIsRecurring(event.target.checked)}
                  className="h-4 w-4 rounded border border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                <label
                  htmlFor="expense-recurring"
                  className="text-sm text-slate-700"
                >
                  Recurring expense
                </label>
              </div>

              {submissionError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {submissionError}
                </div>
              )}

              {submissionSuccess && (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {submissionSuccess}
                </div>
              )}

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting…" : "Submit expense"}
              </button>
            </form>
          </div>
        )}

        {tab === "taxes" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Estimate</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Estimated quarterly tax liability using revenue and expense
                  records stored in Supabase.
                </p>
                {isLoadingFinancials ? (
                  <p className="text-sm text-slate-500">
                    Loading financial data…
                  </p>
                ) : financialError ? (
                  <p className="text-sm text-red-600">{financialError}</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-500">Total Revenue</div>
                      <div className="font-semibold text-slate-900">
                        {currencyFormatter.format(totals.revenueTotal)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-500">
                        Total Expenses
                      </div>
                      <div className="font-semibold text-slate-900">
                        {currencyFormatter.format(totals.expensesTotal)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-500">
                        Taxable Income
                      </div>
                      <div className="font-semibold text-slate-900">
                        {currencyFormatter.format(totals.taxableIncome)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-500">Tax Rate</div>
                      <div className="font-semibold text-slate-900">
                        {Math.round(totals.taxRate * 100)}%
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="text-sm text-slate-500">Estimated Tax</div>
                      <div className="text-2xl font-bold text-slate-900">
                        {currencyFormatter.format(totals.estimatedTax)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Notes</h3>
                <p className="text-sm text-slate-500">
                  Tax expenses are identified automatically when “tax” appears
                  in the payee, category, or notes fields of an expense. Update
                  Supabase entries to refine the estimate or to add missing
                  quarterly payments.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
              <h3 className="text-lg font-semibold mb-3">
                Tax payments this year
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                The table below lists tax-related expenses detected for the
                current calendar year so you can track quarterly payments.
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-3">Date</th>
                    <th className="py-3">Quarter</th>
                    <th className="py-3">Payee</th>
                    <th className="py-3 text-right">Amount</th>
                    <th className="py-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingFinancials ? (
                    <tr>
                      <td
                        className="py-6 text-center text-slate-500"
                        colSpan={5}
                      >
                        Loading tax expenses…
                      </td>
                    </tr>
                  ) : financialError ? (
                    <tr>
                      <td
                        className="py-6 text-center text-red-600"
                        colSpan={5}
                      >
                        {financialError}
                      </td>
                    </tr>
                  ) : taxExpenses.length === 0 ? (
                    <tr>
                      <td
                        className="py-6 text-center text-slate-500"
                        colSpan={5}
                      >
                        No tax-related expenses recorded for this year yet.
                      </td>
                    </tr>
                  ) : (
                    taxExpenses.map((expense) => {
                      const quarter = `Q${
                        Math.floor(expense.date.getMonth() / 3) + 1
                      }`;
                      return (
                        <tr
                          key={expense.id}
                          className="border-t border-slate-100"
                        >
                          <td className="py-3">
                            {expense.date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3">
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {quarter}
                            </span>
                          </td>
                          <td className="py-3 font-medium text-slate-700">
                            {expense.payee}
                          </td>
                          <td className="py-3 text-right font-semibold text-slate-900">
                            {currencyFormatter.format(expense.amount)}
                          </td>
                          <td className="py-3 text-slate-500">
                            {expense.notes?.trim() ? expense.notes : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
