import type { RequestHandler } from "express";
import { z } from "zod";
import type { EmailActionType, EmailRecord } from "@shared/api";

const EMAILS_FALLBACK_PATH = "/webhook/emails";
const ACTION_FALLBACK_PATH = "/webhook/email-action";

const n8nBaseUrl = process.env.N8N_BASE_URL?.replace(/\/$/, "");

const resolveEndpoint = (envValue: string | undefined, fallbackPath: string) => {
  if (!envValue) {
    if (!n8nBaseUrl) {
      return undefined;
    }

    return `${n8nBaseUrl}${fallbackPath}`;
  }

  if (envValue.startsWith("http")) {
    return envValue;
  }

  if (!n8nBaseUrl) {
    return undefined;
  }

  const normalizedPath = envValue.startsWith("/") ? envValue : `/${envValue}`;
  return `${n8nBaseUrl}${normalizedPath}`;
};

const emailsUrl = resolveEndpoint(process.env.N8N_EMAILS_URL, EMAILS_FALLBACK_PATH);
const actionUrl = resolveEndpoint(process.env.N8N_EMAIL_ACTION_URL, ACTION_FALLBACK_PATH);

const apiToken = process.env.N8N_API_TOKEN;
const bypassToken = process.env.N8N_PROTECTION_BYPASS_TOKEN?.trim();

const withBypassParameters = (targetUrl: string) => {
  if (!bypassToken) {
    return { url: targetUrl, headers: {} as Record<string, string> };
  }

  try {
    const parsedUrl = new URL(targetUrl);
    parsedUrl.searchParams.set("x-vercel-protection-bypass", bypassToken);
    parsedUrl.searchParams.set("x-vercel-set-bypass-cookie", "true");

    return {
      url: parsedUrl.toString(),
      headers: { "x-vercel-protection-bypass": bypassToken },
    };
  } catch {
    return {
      url: targetUrl,
      headers: { "x-vercel-protection-bypass": bypassToken },
    };
  }
};

const baseEmailFields = {
  subject: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  from_name: z.string().optional().nullable(),
  from_email: z.string().optional().nullable(),
  received_date: z.string().optional().nullable(),
  is_read: z.boolean().optional().nullable(),
  is_archived: z.boolean().optional().nullable(),
  message_id: z.union([z.string(), z.number()]).optional().nullable(),
};

const EmailSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    ...baseEmailFields,
  })
  .catchall(z.unknown());

const LooseEmailSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional().nullable(),
    ...baseEmailFields,
  })
  .catchall(z.unknown());

const EmailArraySchema = z.array(EmailSchema);

const EmailsResponseSchema = z.union([
  EmailArraySchema,
  z.object({ emails: EmailArraySchema }),
  z.object({ data: EmailArraySchema }),
]);

const IncomingEmailPayloadSchema = z.union([
  LooseEmailSchema,
  z.array(LooseEmailSchema),
  z.object({ email: LooseEmailSchema }),
  z.object({ emails: z.array(LooseEmailSchema) }),
  z.object({ data: z.array(LooseEmailSchema) }),
]);

type ParsedEmail = z.infer<typeof EmailSchema>;
type LooseParsedEmail = z.infer<typeof LooseEmailSchema>;

const normalizeDate = (value: string | undefined) => {
  const timestamp = value ? new Date(value).valueOf() : Number.NaN;

  if (Number.isNaN(timestamp)) {
    return new Date().toISOString();
  }

  return new Date(timestamp).toISOString();
};

const resolveEmailId = (email: LooseParsedEmail) => {
  if (email.id != null && email.id !== "") {
    return String(email.id);
  }

  if (email.message_id != null && email.message_id !== "") {
    return String(email.message_id);
  }

  return `generated-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeEmail = (email: LooseParsedEmail): EmailRecord & { id: string } => {
  const id = resolveEmailId(email);
  const messageId = email.message_id == null ? undefined : String(email.message_id);
  const receivedDate = normalizeDate(email.received_date ?? undefined);

  return {
    ...email,
    id,
    message_id: messageId,
    received_date: receivedDate,
    is_read: email.is_read ?? false,
    is_archived: email.is_archived ?? false,
    body: email.body ?? "",
  };
};

type NormalizedEmail = ReturnType<typeof normalizeEmail>;

const emailStore = new Map<string, NormalizedEmail>();

const upsertStoredEmails = (emails: NormalizedEmail[]) => {
  emails.forEach((email) => {
    const existing = emailStore.get(email.id);
    emailStore.set(email.id, existing ? { ...existing, ...email } : email);
  });
};

const getStoredEmails = (): NormalizedEmail[] => {
  const emails = Array.from(emailStore.values());

  return emails.sort((a, b) => {
    const aTime = new Date(a.received_date ?? "").valueOf();
    const bTime = new Date(b.received_date ?? "").valueOf();

    if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
      return 0;
    }

    if (Number.isNaN(aTime)) {
      return 1;
    }

    if (Number.isNaN(bTime)) {
      return -1;
    }

    return bTime - aTime;
  });
};

const updateStoredEmail = (emailId: string, updates: Partial<NormalizedEmail>) => {
  const existing = emailStore.get(emailId);

  if (!existing) {
    return;
  }

  emailStore.set(emailId, { ...existing, ...updates });
};

const parseEmailPayload = (payload: unknown): NormalizedEmail[] => {
  const parsed = IncomingEmailPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    throw parsed.error;
  }

  const data = parsed.data;

  if (Array.isArray(data)) {
    return data.map((email) => normalizeEmail(email));
  }

  if (data && typeof data === "object") {
    const objectData = data as {
      email?: LooseParsedEmail;
      emails?: LooseParsedEmail[];
      data?: LooseParsedEmail[];
    };

    if (Array.isArray(objectData.emails)) {
      return objectData.emails.map((email) => normalizeEmail(email));
    }

    if (Array.isArray(objectData.data)) {
      return objectData.data.map((email) => normalizeEmail(email));
    }

    if (objectData.email) {
      return [normalizeEmail(objectData.email)];
    }
  }

  return [normalizeEmail(data as LooseParsedEmail)];
};

const createAuthHeaders = () => {
  if (!apiToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${apiToken}`,
  };
};

export const handleGetEmails: RequestHandler = async (_req, res) => {
  if (!emailsUrl) {
    res.json({ emails: getStoredEmails() });
    return;
  }

  try {
    const { url: resolvedUrl, headers: bypassHeaders } = withBypassParameters(emailsUrl);

    const response = await fetch(resolvedUrl, {
      headers: {
        "Content-Type": "application/json",
        ...createAuthHeaders(),
        ...bypassHeaders,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to retrieve emails from n8n (${response.status}): ${errorText}`);
    }

    const rawPayload = await response.json();
    const parsed = EmailsResponseSchema.safeParse(rawPayload);

    if (!parsed.success) {
      throw new Error("Received an invalid email payload from n8n.");
    }

    const payload = parsed.data;
    let emailList: ParsedEmail[] = [];

    if (Array.isArray(payload)) {
      emailList = payload;
    } else if (payload && typeof payload === "object") {
      const payloadObject = payload as { emails?: ParsedEmail[]; data?: ParsedEmail[] };

      if (Array.isArray(payloadObject.emails)) {
        emailList = payloadObject.emails;
      } else if (Array.isArray(payloadObject.data)) {
        emailList = payloadObject.data;
      }
    }

    const normalizedEmails = emailList.map((email) => normalizeEmail(email));

    upsertStoredEmails(normalizedEmails);

    res.json({ emails: normalizedEmails });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const fallbackEmails = getStoredEmails();

    if (fallbackEmails.length > 0) {
      res.json({ emails: fallbackEmails, message });
      return;
    }

    res.status(500).json({ message });
  }
};

const EmailActionRequestSchema = z.object({
  action: z.enum(["reply", "archive", "delete"]),
  replyBody: z.string().trim().min(1, "Reply body is required").optional(),
  email: LooseEmailSchema.optional(),
});

const applyActionToStore = (
  action: EmailActionType,
  emailId: string,
  emailPayload?: LooseParsedEmail,
  replyBody?: string,
) => {
  if (emailPayload) {
    const enrichedEmail = { ...emailPayload, id: emailPayload.id ?? emailId };
    const parsedEmail = LooseEmailSchema.safeParse(enrichedEmail);

    if (parsedEmail.success) {
      const normalized = normalizeEmail(parsedEmail.data);
      upsertStoredEmails([normalized]);
    }
  }

  if (action === "archive") {
    updateStoredEmail(emailId, { is_archived: true, is_read: true });
    return;
  }

  if (action === "delete") {
    emailStore.delete(emailId);
    return;
  }

  if (action === "reply") {
    updateStoredEmail(emailId, { is_read: true, last_reply_body: replyBody ?? undefined });
  }
};

export const handleEmailAction: RequestHandler = async (req, res) => {
  const { emailId } = req.params;

  const parseResult = EmailActionRequestSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({ message: "Invalid request body", issues: parseResult.error.flatten() });
    return;
  }

  const { action, replyBody, email } = parseResult.data;

  if (action === "reply" && !replyBody) {
    res.status(400).json({ message: "Reply body is required when replying to an email." });
    return;
  }

  const completeAction = (payload?: unknown) => {
    applyActionToStore(action, emailId, email, replyBody);
    res.json(payload ?? { message: "Action completed successfully" });
  };

  if (!actionUrl) {
    completeAction({ message: "Action recorded locally" });
    return;
  }

  try {
    const { url: resolvedUrl, headers: bypassHeaders } = withBypassParameters(actionUrl);

    const payload: Record<string, unknown> = {
      action: action as EmailActionType,
      emailId,
    };

    if (replyBody && action === "reply") {
      payload.replyBody = replyBody;
    }

    if (email) {
      payload.email = email;
    }

    const response = await fetch(resolvedUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...createAuthHeaders(),
        ...bypassHeaders,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseJson: unknown = null;

    try {
      responseJson = responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      if (response.ok) {
        responseJson = { message: responseText };
      } else {
        throw new Error(`Invalid JSON response from n8n: ${responseText}`);
      }
    }

    if (!response.ok) {
      const errorMessage =
        typeof responseJson === "object" && responseJson && "message" in responseJson
          ? String((responseJson as Record<string, unknown>).message)
          : responseText || `n8n request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    completeAction(responseJson ?? { message: "Action completed successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message });
  }
};

export const handlePostEmails: RequestHandler = (req, res) => {
  try {
    const normalizedEmails = parseEmailPayload(req.body);

    if (normalizedEmails.length === 0) {
      res.status(400).json({ message: "No email data provided." });
      return;
    }

    upsertStoredEmails(normalizedEmails);

    res.json({
      message:
        normalizedEmails.length === 1
          ? "Email received successfully"
          : `${normalizedEmails.length} emails received successfully`,
      emails: normalizedEmails,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid email payload", issues: error.flatten() });
      return;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message });
  }
};
