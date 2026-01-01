// ==================================================
// file: api/emails/[id]/actions.js
// POST /api/emails/:id/actions
// body: { action: "reply"|"archive"|"delete", replyBody?: string }
// ==================================================
import { gmailArchive, gmailDelete, gmailReply, requireApiKeyIfConfigured } from "../../_lib/gmail.js";

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    requireApiKeyIfConfigured(req);

    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    const id = req.query?.id;
    if (!id) return res.status(400).json({ message: "Missing email id in URL." });

    const body = await readJsonBody(req);
    const action = body?.action;
    const replyBody = body?.replyBody;

    if (!["reply", "archive", "delete"].includes(action)) {
      return res.status(400).json({ message: "Invalid action (reply|archive|delete required)." });
    }

    if (action === "archive") {
      await gmailArchive(String(id));
      return res.status(200).json({ message: "Archived." });
    }

    if (action === "delete") {
      await gmailDelete(String(id));
      return res.status(200).json({ message: "Deleted (moved to trash)." });
    }

    if (!replyBody || !String(replyBody).trim()) {
      return res.status(400).json({ message: "replyBody is required when replying." });
    }

    await gmailReply(String(id), String(replyBody));
    return res.status(200).json({ message: "Reply sent." });
  } catch (e) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ message: e?.message || "Action failed." });
  }
}
