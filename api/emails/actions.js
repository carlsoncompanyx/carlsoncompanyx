import { parse } from "node:url";
import {
  requireApiKeyIfConfigured,
  gmailArchive,
  gmailDelete,
  gmailReply,
} from "../_lib/gmail.js";

/**
 * Route (via vercel.json rewrite):
 *   POST /api/emails/:id/actions  ->  /api/emails/actions?id=:id
 *
 * Body:
 *   { "action": "archive" | "delete" | "reply", ... }
 */
export default async function handler(req, res) {
  try {
    if (!requireApiKeyIfConfigured(req, res)) return;

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { query } = parse(req.url, true);
    const id = query?.id;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Missing email id" });
    }

    const { action, replyText } = req.body ?? {};

    switch (action) {
      case "archive":
        await gmailArchive(id);
        return res.status(200).json({ ok: true });

      case "delete":
        await gmailDelete(id);
        return res.status(200).json({ ok: true });

      case "reply":
        await gmailReply(id, replyText ?? "");
        return res.status(200).json({ ok: true });

      default:
        return res.status(400).json({ error: "Invalid action" });
    }
  } catch (err) {
    console.error("Email action failed:", err);
    return res.status(500).json({ error: "Action failed" });
  }
}
