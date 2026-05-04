import type {
  ShortsCandidate,
  ShortsRiskLevel,
  SuggestedClip,
  TorchScript,
  TransformativeAssessment,
} from "./types";

const HOUR_MS = 60 * 60 * 1000;
const DAY_HOURS = 24;

export function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateAgeHours(publishedAt: string, now = new Date()) {
  const publishedMs = new Date(publishedAt).getTime();
  if (!Number.isFinite(publishedMs)) return 0;
  return Math.max(0, Math.round((now.getTime() - publishedMs) / HOUR_MS));
}

export function calculateViewsPerHour(views: number, ageHours: number) {
  return Math.round(views / Math.max(ageHours, 1));
}

export function calculateCommentsPer1000Views(comments: number, views: number) {
  if (!views) return 0;
  return Number(((comments / views) * 1000).toFixed(1));
}

export function classifyAgeBucket(ageHours: number) {
  if (ageHours <= 24) return "fresh";
  if (ageHours <= 72) return "accelerating";
  if (ageHours <= 168) return "watch";
  if (ageHours <= 720) return "stale";
  return "flag-old";
}

export function scoreFreshness(ageHours: number) {
  if (ageHours <= 12) return 100;
  if (ageHours <= 24) return 92;
  if (ageHours <= 48) return 82;
  if (ageHours <= 72) return 72;
  if (ageHours <= 168) return 48;
  if (ageHours <= 720) return 18;
  return 5;
}

export function scoreActivity(
  viewsPerHour: number,
  commentsPer1000Views: number,
) {
  const velocityScore = clampScore(Math.log10(Math.max(viewsPerHour, 1)) * 22);
  const debateScore = clampScore(commentsPer1000Views * 4);
  return clampScore(velocityScore * 0.62 + debateScore * 0.38);
}

export function scoreOverallCandidate(candidate: {
  freshnessScore: number;
  activityScore: number;
  controversyScore: number;
  torchFitScore: number;
  clipabilityScore: number;
  monetizationSafetyScore: number;
}) {
  return clampScore(
    candidate.freshnessScore * 0.2 +
      candidate.activityScore * 0.22 +
      candidate.controversyScore * 0.18 +
      candidate.torchFitScore * 0.18 +
      candidate.clipabilityScore * 0.12 +
      candidate.monetizationSafetyScore * 0.1,
  );
}

export function scoreTransformativeRisk(
  selectedClip: SuggestedClip,
  script: TorchScript,
): TransformativeAssessment {
  const sourceClipSeconds = Math.max(
    0,
    selectedClip.endSeconds - selectedClip.startSeconds,
  );
  const torchCommentarySecondsEstimate =
    estimateCommentarySecondsFromScript(script);
  const commentaryToClipRatio = Number(
    (torchCommentarySecondsEstimate / Math.max(sourceClipSeconds, 1)).toFixed(2),
  );

  const clipLengthScore =
    sourceClipSeconds <= 18 ? 36 : sourceClipSeconds <= 28 ? 26 : 12;
  const commentaryScore = clampScore(commentaryToClipRatio * 55);
  const directCritiqueScore = script.postCommentary.trim().length > 80 ? 18 : 8;
  const visibleHostScore = 18;
  const transformativeScore = clampScore(
    clipLengthScore + commentaryScore + directCritiqueScore + visibleHostScore,
  );

  const reusedContentRisk: ShortsRiskLevel =
    transformativeScore >= 78
      ? "low"
      : transformativeScore >= 58
        ? "medium"
        : transformativeScore >= 38
          ? "high"
          : "critical";

  const notes = [
    "Torch is visible in the split-screen layout.",
    "Torch voice commentary is included before, during, and after the source clip.",
    sourceClipSeconds <= 28
      ? "The selected source segment is short enough to support critique."
      : "The selected source segment is long; tighten it before render.",
    commentaryToClipRatio >= 0.7
      ? "Commentary volume is strong against the clip length."
      : "Add more commentary or shorten the source clip to reduce reused-content risk.",
  ];

  return {
    sourceClipSeconds,
    torchCommentarySecondsEstimate,
    commentaryToClipRatio,
    transformativeScore,
    reusedContentRisk,
    notes,
  };
}

export function estimateCommentarySecondsFromScript(script: TorchScript) {
  const words = [
    script.hook,
    ...script.liveReactionLines,
    script.postCommentary,
    script.pinnedComment ?? "",
  ]
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(0, Math.round((words / 2.65) * 10) / 10);
}

export function highestRiskLevel(
  levels: ShortsRiskLevel[],
): ShortsRiskLevel {
  const weight: Record<ShortsRiskLevel, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  };

  return levels.reduce(
    (highest, level) => (weight[level] > weight[highest] ? level : highest),
    "low" as ShortsRiskLevel,
  );
}

export function containsProfanity(text: string) {
  return /\b(fuck|fucking|shit|bullshit|bitch|asshole|damn|hell)\b/i.test(text);
}

export function getCandidateAgeWarning(candidate: ShortsCandidate) {
  if (candidate.ageHours > 720) {
    return "This source is older than 30 days. Only use it if n8n tied it to a current trend.";
  }

  if (candidate.ageHours > 168) {
    return "This source is older than the default 7-day window. Check why it is still relevant.";
  }

  return null;
}
