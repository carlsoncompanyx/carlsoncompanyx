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
