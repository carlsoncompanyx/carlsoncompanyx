// ==================================================
// file: api/_lib/gmail.js
// ==================================================
import { google } from "googleapis";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function decodeBase64Url(data) {
  const s = data.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  return Buffer.from(s + pad, "base64").toString("utf8");
}

function base64UrlEncode(data) {
  return Buffer.from(data, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getHeader(headers, name) {
  if (!headers) return undefined;
  const found = headers.find((h) => (h.name || "").toLowerCase() === name.toLowerCase());
  return found?.value;
}

function parseFrom(fromValue) {
  if (!fromValue) return {};
  const match = fromValue.match(/^(.*?)(?:\s*<([^>]+)>)?$/);
  if (!match) return { from_email: fromValue };
  const name = match[1]?.trim()?.replace(/^"|"$/g, "");
  const email = match[2]?.trim();
  if (email) return { from_name: name || undefined, from_email: email };
  return { from_email: fromValue.trim() };
}

function pickBestBody(payload) {
  const walk = (node) => {
    if (!node) return [];
    const out = [];
    if (node?.body?.data) out.push({ mimeType: node?.mimeType, data: node.body.data });
    for (const p of node?.parts || []) out.push(...walk(p));
    return out;
  };

  const parts = walk(payload);
  const plain = parts.find((p) => (p.mimeType || "").toLowerCase() === "text/plain" && p.data);
  if (plain?.data) return decodeBase64Url(plain.data);

  const html = parts.find((p) => (p.mimeType || "").toLowerCase() === "text/html" && p.data);
  if (html?.data) {
    const raw = decodeBase64Url(html.data);
    return raw
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<\/?[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return "";
}

function getGmail() {
  const oauth2 = new google.auth.OAuth2(
    requireEnv("GOOGLE_CLIENT_ID"),
    requireEnv("GOOGLE_CLIENT_SECRET"),
    requireEnv("GOOGLE_REDIRECT_URI"),
  );
  oauth2.setCredentials({ refresh_token: requireEnv("GOOGLE_REFRESH_TOKEN") });
  return google.gmail({ version: "v1", auth: oauth2 });
}

export function requireApiKeyIfConfigured(req) {
  const required = process.env.EMAIL_API_KEY;
  if (!required) return;
  const got = req.headers["x-email-api-key"];
  if (!got || got !== required) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
}

export async function gmailFetchInbox({ limit = 25 } = {}) {
  const gmail = getGmail();

  const list = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults: limit,
  });

  const ids = (list.data.messages || []).map((m) => m.id).filter(Boolean);
  if (!ids.length) return [];

  const out = [];
  for (const id of ids) {
    const msg = await gmail.users.messages.get({ userId: "me", id, format: "full" });

    const payload = msg.data.payload;
    const headers = payload?.headers || [];
    const fromRaw = getHeader(headers, "From");
    const subject = getHeader(headers, "Subject") || "";
    const messageId = getHeader(headers, "Message-ID") || undefined;

    const internalDateMs = msg.data.internalDate ? Number(msg.data.internalDate) : Date.now();
    const labelIds = msg.data.labelIds || [];

    const { from_name, from_email } = parseFrom(fromRaw);
    const body = pickBestBody(payload) || msg.data.snippet || "";

    out.push({
      id,
      message_id: messageId ?? id,
      thread_id: msg.data.threadId || undefined,
      subject,
      body,
      from_name,
      from_email,
      received_date: new Date(internalDateMs).toISOString(),
      is_read: !labelIds.includes("UNREAD"),
      is_archived: !labelIds.includes("INBOX"),
    });
  }

  return out;
}

export async function gmailArchive(id) {
  const gmail = getGmail();
  await gmail.users.messages.modify({
    userId: "me",
    id,
    requestBody: { removeLabelIds: ["INBOX"] },
  });
}

export async function gmailDelete(id) {
  const gmail = getGmail();
  await gmail.users.messages.trash({ userId: "me", id });
}

function buildReplyRaw({ to, subject, inReplyTo, references, body }) {
  const lines = [];
  lines.push(`To: ${to}`);
  lines.push(`Subject: Re: ${subject || ""}`.trim());
  lines.push(`Content-Type: text/plain; charset="UTF-8"`);
  lines.push(`MIME-Version: 1.0`);
  if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`);
  if (references) lines.push(`References: ${references}`);
  lines.push("");
  lines.push(body);
  lines.push("");
  return lines.join("\r\n");
}

export async function gmailReply(id, replyBody) {
  const gmail = getGmail();

  const original = await gmail.users.messages.get({ userId: "me", id, format: "full" });
  const headers = original.data.payload?.headers || [];

  const subject = getHeader(headers, "Subject") || "";
  const inReplyTo = getHeader(headers, "Message-ID") || undefined;

  const replyTo = getHeader(headers, "Reply-To");
  const from = getHeader(headers, "From");
  const { from_email } = parseFrom(replyTo || from);

  if (!from_email) throw new Error("Could not determine recipient (missing Reply-To/From).");

  const references = (() => {
    const refs = getHeader(headers, "References");
    if (refs && inReplyTo && !refs.includes(inReplyTo)) return `${refs} ${inReplyTo}`.trim();
    return refs || inReplyTo;
  })();

  const raw = buildReplyRaw({
    to: from_email,
    subject,
    inReplyTo,
    references,
    body: String(replyBody || "").trim(),
  });

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: base64UrlEncode(raw),
      threadId: original.data.threadId || undefined,
    },
  });
}
