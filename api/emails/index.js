// ==================================================
// file: api/emails/index.js
// GET /api/emails
// ==================================================
import { gmailFetchInbox, requireApiKeyIfConfigured } from "../_lib/gmail.js";

export default async function handler(req, res) {
  try {
    requireApiKeyIfConfigured(req);

    if (req.method !== "GET") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    const limit = Number(req.query?.limit ?? 25);
    const emails = await gmailFetchInbox({ limit: Number.isFinite(limit) ? limit : 25 });

    return res.status(200).json({ emails });
  } catch (e) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ message: e?.message || "Failed to load emails." });
  }
}
