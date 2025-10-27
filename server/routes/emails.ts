import type { RequestHandler } from "express";
import { z } from "zod";
import type { EmailActionType, EmailRecord } from "@shared/api";

const labelValueSchema = z.union([
  z.array(z.union([z.string(), z.number()])),
  z.string(),
  z.number(),
]);

const baseEmailFields = {
  subject: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  from_name: z.string().optional().nullable(),
  from_email: z.string().optional().nullable(),
  received_date: z.string().optional().nullable(),
  is_read: z.boolean().optional().nullable(),
  is_archived: z.boolean().optional().nullable(),
  is_starred: z.boolean().optional().nullable(),
  message_id: z.union([z.string(), z.number()]).optional().nullable(),
  thread_id: z.union([z.string(), z.number()]).optional().nullable(),
  threadId: z.union([z.string(), z.number()]).optional().nullable(),
  labels: labelValueSchema.optional().nullable(),
  labelIds: labelValueSchema.optional().nullable(),
  resume_url: z.string().optional().nullable(),
  resumeUrl: z.string().optional().nullable(),
  last_reply_body: z.string().optional().nullable(),
  "return-path": z.string().optional().nullable(),
};

const LooseEmailSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional().nullable(),
    ...baseEmailFields,
  })
  .catchall(z.unknown());

const IncomingEmailPayloadSchema = z.union([
  LooseEmailSchema,
  z.array(LooseEmailSchema),
  z.object({ email: LooseEmailSchema }),
  z.object({ emails: z.array(LooseEmailSchema) }),
  z.object({ data: z.array(LooseEmailSchema) }),
]);
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

const isJsonLikeString = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];

  return (
    (firstChar === "{" && lastChar === "}") ||
    (firstChar === "[" && lastChar === "]") ||
    (firstChar === '"' && lastChar === '"')
  );
};

const parseJsonIfPossible = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  if (!isJsonLikeString(value)) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeBody = (value: unknown): string => {
  const parsed = parseJsonIfPossible(value);

  if (parsed == null) {
    return "";
  }

  if (typeof parsed === "string") {
    return parsed;
  }

  if (typeof parsed === "number" || typeof parsed === "boolean") {
    return String(parsed);
  }

  try {
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(parsed);
  }
};

const normalizeLabels = (value: unknown): string[] | undefined => {
  const parsed = parseJsonIfPossible(value);

  if (parsed == null) {
    return undefined;
  }

  if (Array.isArray(parsed)) {
    const normalized = parsed
      .map((item) => {
        if (item == null) {
          return undefined;
        }

        const stringValue = String(item).trim();
        return stringValue === "" ? undefined : stringValue;
      })
      .filter((item): item is string => item != null);

    return normalized.length > 0 ? normalized : undefined;
  }

  if (typeof parsed === "string") {
    const trimmed = parsed.trim();
    return trimmed ? [trimmed] : undefined;
  }

  if (typeof parsed === "number" || typeof parsed === "boolean") {
    return [String(parsed)];
  }

  return undefined;
};

const normalizeOptionalString = (value: unknown): string | undefined => {
  const parsed = parseJsonIfPossible(value);

  if (parsed == null) {
    return undefined;
  }

  if (typeof parsed === "string") {
    return parsed;
  }

  if (typeof parsed === "number" || typeof parsed === "boolean") {
    return String(parsed);
  }

  try {
    return JSON.stringify(parsed);
  } catch {
    return String(parsed);
  }
};

const normalizeEmail = (email: LooseParsedEmail): EmailRecord & { id: string } => {
  const id = resolveEmailId(email);
  const messageId = email.message_id == null ? undefined : String(email.message_id);
  const receivedDate = normalizeDate(email.received_date ?? undefined);
  const labels = normalizeLabels(
    (email as LooseParsedEmail & { labels?: unknown; labelIds?: unknown }).labels ??
      (email as { labelIds?: unknown }).labelIds,
  );
  const threadValue = email.thread_id ?? (email as { threadId?: unknown }).threadId;
  const normalizedThreadId =
    threadValue == null || threadValue === "" ? undefined : String(threadValue);
  const resumeUrl = normalizeOptionalString(
    (email as LooseParsedEmail & { resume_url?: unknown; resumeUrl?: unknown }).resume_url ??
      (email as { resumeUrl?: unknown }).resumeUrl,
  );
  const returnPath = normalizeOptionalString(
    (email as LooseParsedEmail & { ["return-path"]?: unknown })["return-path"],
  );
  const record: Record<string, unknown> = { ...email };

  record.id = id;
  record.message_id = messageId;
  record.received_date = receivedDate;
  record.is_read = email.is_read ?? false;
  record.is_archived = email.is_archived ?? false;
  record.is_starred = email.is_starred ?? false;
  record.body = normalizeBody(
    (email as LooseParsedEmail & { body?: unknown; text?: unknown }).body ??
      (email as { text?: unknown }).text ??
      "",
  );

  if (labels) {
    record.labels = labels;
  } else {
    delete record.labels;
  }
  delete record.labelIds;

  if (normalizedThreadId) {
    record.thread_id = normalizedThreadId;
    (record as Record<string, unknown>).threadId = normalizedThreadId;
  } else {
    delete record.thread_id;
    delete (record as Record<string, unknown>).threadId;
  }

  if (resumeUrl) {
    record.resume_url = resumeUrl;
    (record as Record<string, unknown>).resumeUrl = resumeUrl;
  } else {
    delete record.resume_url;
    delete (record as Record<string, unknown>).resumeUrl;
  }

  if (returnPath) {
    record["return-path"] = returnPath;
  } else {
    delete record["return-path"];
  }

  return record as EmailRecord & { id: string };
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
export const handleGetEmails: RequestHandler = (_req, res) => {
  res.json({ emails: getStoredEmails() });
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
): NormalizedEmail | null => {
  let currentEmail = emailStore.get(emailId) ?? null;

  if (emailPayload) {
    const enrichedEmail = { ...emailPayload, id: emailPayload.id ?? emailId };
    const parsedEmail = LooseEmailSchema.safeParse(enrichedEmail);

    if (parsedEmail.success) {
      const normalized = normalizeEmail(parsedEmail.data);
      upsertStoredEmails([normalized]);
      currentEmail = emailStore.get(normalized.id) ?? normalized;
    }
  }

  if (action === "archive") {
    updateStoredEmail(emailId, { is_archived: true, is_read: true });
    return emailStore.get(emailId) ?? currentEmail;
  }

  if (action === "delete") {
    emailStore.delete(emailId);
    return null;
  }

  if (action === "reply") {
    updateStoredEmail(emailId, { is_read: true, last_reply_body: replyBody ?? undefined });
    return emailStore.get(emailId) ?? currentEmail;
  }

  return currentEmail;
};

const ACTION_MESSAGES: Record<EmailActionType, string> = {
  reply: "Reply recorded successfully",
  archive: "Email archived successfully",
  delete: "Email deleted successfully",
};

export const handleEmailAction: RequestHandler = (req, res) => {
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
  const updatedEmail = applyActionToStore(action, emailId, email, replyBody);

  res.json({
    message: ACTION_MESSAGES[action],
    email: updatedEmail,
  });
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
