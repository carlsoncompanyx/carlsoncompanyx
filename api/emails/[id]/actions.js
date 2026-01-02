import { gmailArchive, gmailDelete, gmailReply, requireApiKeyIfConfigured } from "../../_lib/gmail.js";

async function readJsonBody(req) {
  // Vercel's Node runtime usually parses JSON bodies, but handle raw streams just in case.
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

export default async function handler(req, res) {
  // Preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    requireApiKeyIfConfigured(req);

    const id = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
    if (!id) return res.status(400).json({ error: "Missing email id" });

    const body = await readJsonBody(req);
    const action = body?.action;

    // Frontend currently sends `replyBody`; previous server code used `replyText`.
    const replyText = (body?.replyBody ?? body?.replyText ?? "").toString();

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
    return res.status(500).json({ error: "Action failed" });
  }
}
