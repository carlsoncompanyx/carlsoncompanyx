import type { ExpenseRow, RevenueRow } from "@/lib/supabase";

export interface MonthlyTotal {
  key: string;
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface TaxExpenseSummary {
  id: string;
  date: Date;
  payee: string;
  amount: number;
  notes: string;
}

export function normalizeAmount(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function parseRecordDate(
  record: Pick<ExpenseRow & RevenueRow, "date" | "created_at">,
): Date | null {
  const dateValue =
    (typeof record?.date === "string" && record.date) ||
    (typeof record?.created_at === "string" && record.created_at) ||
    null;

  if (!dateValue) {
    return null;
  }

  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function createMonthlyTotals(
  revenues: RevenueRow[] = [],
  expenses: ExpenseRow[] = [],
): MonthlyTotal[] {
  const totals = new Map<string, { revenue: number; expenses: number }>();

  const addRecord = (record: ExpenseRow | RevenueRow, key: "revenue" | "expenses") => {
    const date = parseRecordDate(record);
    if (!date) {
      return;
    }

    const rawAmount = normalizeAmount(record?.amount);
    const amount = key === "expenses" ? Math.abs(rawAmount) : rawAmount;

    if (!amount) {
      return;
    }

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!totals.has(monthKey)) {
      totals.set(monthKey, { revenue: 0, expenses: 0 });
    }

    const entry = totals.get(monthKey);
    if (!entry) {
      return;
    }

    entry[key] += amount;
  };

  revenues.forEach((record) => addRecord(record, "revenue"));
  expenses.forEach((record) => addRecord(record, "expenses"));

  return Array.from(totals.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, { revenue, expenses: expensesTotal }]) => {
      const [year, month] = monthKey.split("-");
      const labelDate = new Date(Number(year), Number(month) - 1, 1);
      const period = labelDate.toLocaleString("en-US", { month: "short", year: "numeric" });

      return {
        key: monthKey,
        period,
        revenue,
        expenses: expensesTotal,
        profit: revenue - expensesTotal,
      } satisfies MonthlyTotal;
    });
}

export function computeFinancialTotals(monthlyTotals: MonthlyTotal[]) {
  const revenueTotal = monthlyTotals.reduce((sum, entry) => sum + entry.revenue, 0);
  const expensesTotal = monthlyTotals.reduce((sum, entry) => sum + entry.expenses, 0);
  const netIncome = revenueTotal - expensesTotal;
  const taxableIncome = Math.max(netIncome, 0);
  const taxRate = 0.21;

  return {
    revenueTotal,
    expensesTotal,
    netIncome,
    taxableIncome,
    taxRate,
    estimatedTax: taxableIncome * taxRate,
  };
}

export function identifyTaxExpenses(
  expenses: ExpenseRow[] = [],
  year: number = new Date().getFullYear(),
): TaxExpenseSummary[] {
  return expenses
    .map((expense) => {
      const date = parseRecordDate(expense);

      if (!date || date.getFullYear() !== year) {
        return null;
      }

      const potentialFields = [
        expense?.category,
        expense?.payee,
        expense?.notes,
        expense?.description,
        (expense as Record<string, unknown>)?.memo,
      ].filter((value): value is string => typeof value === "string");

      const isTaxRelated = potentialFields.some((value) => value.toLowerCase().includes("tax"));

      if (!isTaxRelated) {
        return null;
      }

      const amount = Math.abs(normalizeAmount(expense?.amount));

      if (!amount) {
        return null;
      }

      const payee =
        (typeof expense?.payee === "string" && expense.payee) ||
        (typeof expense?.category === "string" && expense.category) ||
        "Tax Payment";

      const notes =
        (typeof expense?.notes === "string" && expense.notes) ||
        (typeof expense?.description === "string" && expense.description) ||
        "";

      return {
        id: String(expense?.id ?? `tax-${date.toISOString()}`),
        date,
        payee,
        amount,
        notes,
      } satisfies TaxExpenseSummary;
    })
    .filter((value): value is TaxExpenseSummary => Boolean(value))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
