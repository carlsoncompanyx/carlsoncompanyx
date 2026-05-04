# Torch Shorts Phase 1

Torch Shorts is a desktop-first operator workflow for reviewing YouTube candidate clips, writing Torch commentary, checking monetization risk, and handing a render job to a local worker.

## Ownership Boundary

- n8n handles daily YouTube candidate discovery through the `YouTube Fetch Clips` flow.
- The app consumes stored candidates from n8n output, local mock JSON, or future Supabase rows.
- The app handles candidate review, scripting, monetization risk review, and render-job handoff.
- The local render worker handles Rhubarb/Torch animation, subtitles, FFmpeg composition, and local file output.
- Browser FFmpeg, paid services, real AI commentary generation, and Supabase persistence are later phases.

## Current Mock Data

Phase 1 mock candidates live in `client/lib/shorts/mockCandidates.ts`.

The mock set includes:

- Fresh political/media hypocrisy
- Sports drama
- Scam or bad advice
- AI/tech bad take
- Internet drama

Each candidate includes source metadata, freshness/activity scoring, comment hotspots, suggested clips, topic bucket, status, and risk fields.

## Candidate Contract

Core types live in `client/lib/shorts/types.ts`.

Expected future n8n/Supabase candidate fields include:

- `id`
- `source`
- `sourceVideoId`
- `sourceUrl`
- `title`
- `channel`
- `topicBucket`
- `publishedAt`
- `views`
- `comments`
- `likes`
- `commentHotspots`
- `suggestedClips`
- `transcript`
- `risk`
- `status`
- scoring fields such as `viewsPerHour`, `commentsPer1000Views`, `freshnessScore`, `activityScore`, and `overallScore`

## Scoring

Scoring helpers live in `client/lib/shorts/scoring.ts`.

The current deterministic helpers calculate age, views per hour, comments per 1000 views, freshness, activity, overall candidate score, age bucket, and transformative/reused-content risk.

Freshness is intentionally weighted toward the last 24-72 hours. Candidates up to 7 days old are allowed by default. Anything older than 30 days should be treated as a warning unless n8n attaches a current trend reason.

## Risk Review

The UI exposes risk fields for:

- Source clip profanity
- Torch script profanity
- Title, thumbnail, and caption profanity
- Slur, hate, or identity attack risk
- Threat or violent-language risk
- Sexual or graphic-language risk
- Reused-content and transformative-content risk
- Copyright/legal notes
- Overall monetization risk

The render job includes flags for source audio bleeping and caption text censoring so the local worker can eventually mute/bleep risky parts.

## Local Render Worker

The app sends a JSON payload to:

```text
POST ${VITE_LOCAL_RENDER_WORKER_URL}/render-short
```

Default env:

```text
VITE_LOCAL_RENDER_WORKER_URL=http://localhost:8788
VITE_SHORTS_RENDER_MODE=local
```

If the worker is unavailable, the page keeps working and shows the render job JSON for local handoff.

## Run Locally

```bash
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

Open `/ShortsGenerator` after signing in.
