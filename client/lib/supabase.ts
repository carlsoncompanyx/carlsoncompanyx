const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

const REST_ENDPOINT = SUPABASE_URL ? `${SUPABASE_URL}/rest/v1` : undefined;

export interface ExpensePayload {
  date: string;
  payee: string;
  recurring_expense: boolean;
  amount: number;
}

export type ExpenseRow = {
  id?: number | string;
  date?: string | null;
  created_at?: string | null;
  payee?: string | null;
  recurring_expense?: boolean | null;
  amount?: number | null;
  category?: string | null;
  notes?: string | null;
  [key: string]: unknown;
};

export type RevenueRow = {
  id?: number | string;
  date?: string | null;
  created_at?: string | null;
  amount?: number | null;
  description?: string | null;
  source?: string | null;
  [key: string]: unknown;
};

type FetchFinancialOptions = {
  accessToken?: string | null;
  startDate?: string;
  endDate?: string;
  signal?: AbortSignal;
};

async function fetchFromTable<T>(
  table: string,
  { accessToken, startDate, endDate, signal }: FetchFinancialOptions = {},
): Promise<T[]> {
  if (!REST_ENDPOINT || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured.");
  }

  const url = new URL(`${REST_ENDPOINT}/${table}`);
  url.searchParams.set("select", "*");
  url.searchParams.set("order", "date.asc");

  if (startDate || endDate) {
    url.searchParams.delete("date");
    if (startDate) {
      url.searchParams.append("date", `gte.${startDate}`);
    }
    if (endDate) {
      url.searchParams.append("date", `lte.${endDate}`);
    }
  }

  const token = accessToken || SUPABASE_ANON_KEY;

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to load data from ${table}.`);
  }

  return response.json();
}

export async function fetchExpenses(options?: FetchFinancialOptions) {
  return fetchFromTable<ExpenseRow>("expenses", options);
}

export async function fetchRevenues(options?: FetchFinancialOptions) {
  return fetchFromTable<RevenueRow>("revenue", options);
}

export async function insertExpense(
  payload: ExpensePayload,
  accessToken: string,
) {
  if (!REST_ENDPOINT || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured.");
  }

  if (!accessToken) {
    throw new Error("You must be signed in to submit expenses.");
  }

  const response = await fetch(`${REST_ENDPOINT}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to insert expense.");
  }

  return response.json();
}
