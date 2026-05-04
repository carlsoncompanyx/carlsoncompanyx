// api/n8n-webhook.js - personal n8n ingress for Torch Shorts candidates.
//
// Expected n8n payload shape, intentionally kept loose for now:
// {
//   "workflow": "YouTube Fetch Clips",
//   "topic": "media hypocrisy",
//   "candidates": [
//     {
//       "source": "youtube",
//       "sourceVideoId": "abc123",
//       "sourceUrl": "https://youtube.com/watch?v=abc123",
//       "title": "...",
//       "channel": "...",
//       "publishedAt": "2026-05-02T14:00:00.000Z",
//       "views": 100000,
//       "comments": 2400,
//       "commentHotspots": [],
//       "suggestedClips": []
//     }
//   ]
// }
//
// Discovery stays in n8n. The app reviews stored candidates and sends local render jobs.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ message: "Method Not Allowed. Only POST is accepted." });
  }

  const payload = req.body;
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];

  console.log("n8n webhook received successfully.");
  console.log("Received Payload:", payload);

  return res.status(200).json({
    success: true,
    message: "Payload received and logged.",
    candidateCount: candidates.length,
  });
}
