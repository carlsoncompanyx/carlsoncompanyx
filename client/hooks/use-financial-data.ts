import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchExpenses, fetchRevenues, type ExpenseRow, type RevenueRow } from "@/lib/supabase";
import {
  computeFinancialTotals,
  createMonthlyTotals,
  identifyTaxExpenses,
  type MonthlyTotal,
  type TaxExpenseSummary,
} from "@/lib/financial-data";
import { useAuth } from "@/hooks/use-auth";

interface UseFinancialDataResult {
  revenues: RevenueRow[];
  expenses: ExpenseRow[];
  monthlyTotals: MonthlyTotal[];
  chartData: { period: string; revenue: number; expenses: number; profit: number }[];
  totals: ReturnType<typeof computeFinancialTotals>;
  taxExpenses: TaxExpenseSummary[];
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
}

export function useFinancialData(): UseFinancialDataResult {
  const { session } = useAuth();
  const [revenues, setRevenues] = useState<RevenueRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFinancials = useCallback(
    async ({ signal }: { signal?: AbortSignal } = {}) => {
      setIsLoading(true);
      setError("");

      try {
        const [revenueData, expenseData] = await Promise.all([
          fetchRevenues({ accessToken: session?.accessToken, signal }),
          fetchExpenses({ accessToken: session?.accessToken, signal }),
        ]);

        setRevenues(Array.isArray(revenueData) ? revenueData : []);
        setExpenses(Array.isArray(expenseData) ? expenseData : []);
      } catch (caughtError) {
        if ((caughtError as Error)?.name === "AbortError") {
          return;
        }

        console.error("Failed to load financial data", caughtError);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load financial data.",
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [session?.accessToken],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadFinancials({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [loadFinancials]);

  const monthlyTotals = useMemo(
    () => createMonthlyTotals(revenues, expenses),
    [revenues, expenses],
  );

  const chartData = useMemo(
    () =>
      monthlyTotals.map((entry) => ({
        period: entry.period,
        revenue: entry.revenue,
        expenses: entry.expenses,
        profit: entry.profit,
      })),
    [monthlyTotals],
  );

  const totals = useMemo(
    () => computeFinancialTotals(monthlyTotals),
    [monthlyTotals],
  );

  const taxExpenses = useMemo(
    () => identifyTaxExpenses(expenses),
    [expenses],
  );

  const refresh = useCallback(async () => {
    await loadFinancials();
  }, [loadFinancials]);

  return {
    revenues,
    expenses,
    monthlyTotals,
    chartData,
    totals,
    taxExpenses,
    isLoading,
    error,
    refresh,
  };
}

export default useFinancialData;
