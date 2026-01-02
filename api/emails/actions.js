import { gmailArchive, gmailDelete, gmailReply, requireApiKeyIfConfigured } from "../_lib/gmail.js";

const ALLOWED_METHODS = ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Email-Api-Key",
};

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function setCorsHeaders(res) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
}

export default async function handler(req, res) {
  const method = (req.method || "").toUpperCase();

  if (method === "OPTIONS") {
    setCorsHeaders(res);
    res.setHeader("Allow", ALLOWED_METHODS.join(", "));
    res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS.join(", "));
    return res.status(204).end();
  }

  if (!ALLOWED_METHODS.includes(method)) {
    res.setHeader("Allow", ALLOWED_METHODS.join(", "));
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    requireApiKeyIfConfigured(req);

    const queryId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
    const body = await readJsonBody(req);
    const actionFromBody = body?.action;
    const actionFromQuery = Array.isArray(req.query?.action) ? req.query.action[0] : req.query?.action;
    const action =
      actionFromBody ||
      actionFromQuery ||
      (method === "DELETE"
        ? "delete"
        : method === "PATCH"
        ? "archive"
        : method === "PUT" || method === "POST"
        ? "reply"
        : undefined);

    const id = body?.id || body?.email?.id || queryId;
    if (!id) return res.status(400).json({ error: "Missing email id" });

    const replyText = (body?.replyBody ?? body?.replyText ?? "").toString();

    setCorsHeaders(res);

    switch (action) {
      case "archive":
        await gmailArchive(id);
        return res.status(200).json({ ok: true });

      case "delete":
        await gmailDelete(id);
        return res.status(200).json({ ok: true });

      case "reply":
        if (!replyText.trim()) {
          return res.status(400).json({ error: "Reply body is required" });
        }
        await gmailReply(id, replyText);
        return res.status(200).json({ ok: true });

      default:
        return res.status(400).json({ error: "Invalid action" });
    }
  } catch (err) {
    console.error("Email action failed:", err);
    setCorsHeaders(res);
    return res.status(500).json({ error: "Action failed" });
  }
}
