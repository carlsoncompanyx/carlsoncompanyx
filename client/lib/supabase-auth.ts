const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

const AUTH_ENDPOINT = SUPABASE_URL ? `${SUPABASE_URL}/auth/v1` : undefined;

export interface SupabaseAuthUser {
  id: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface SupabaseSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
  user: SupabaseAuthUser;
}

interface SupabaseTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: SupabaseAuthUser;
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

function ensureConfigured() {
  if (!AUTH_ENDPOINT || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured.");
  }
}

async function parseErrorMessage(response: Response) {
  try {
    const data = await response.json();
    return (
      (typeof data === "object" &&
        data !== null &&
        (data.error_description || data.message)) ||
      response.statusText ||
      "Unexpected Supabase response."
    );
  } catch {
    return response.statusText || "Unexpected Supabase response.";
  }
}

function toSession(payload: SupabaseTokenResponse): SupabaseSession {
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
    tokenType: payload.token_type,
    user: payload.user,
  };
}

export function isSessionExpired(session: SupabaseSession, bufferMs = 0) {
  return session.expiresAt <= Date.now() + bufferMs;
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<SupabaseSession> {
  ensureConfigured();

  const response = await fetch(`${AUTH_ENDPOINT}/token?grant_type=password`, {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      apikey: SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const payload = (await response.json()) as SupabaseTokenResponse;
  return toSession(payload);
}

export async function refreshSession(
  refreshToken: string,
): Promise<SupabaseSession> {
  ensureConfigured();

  const response = await fetch(
    `${AUTH_ENDPOINT}/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        ...JSON_HEADERS,
        apikey: SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const payload = (await response.json()) as SupabaseTokenResponse;
  return toSession(payload);
}

export async function signOutRequest(accessToken: string) {
  ensureConfigured();

  const response = await fetch(`${AUTH_ENDPOINT}/logout`, {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(await parseErrorMessage(response));
  }
}
