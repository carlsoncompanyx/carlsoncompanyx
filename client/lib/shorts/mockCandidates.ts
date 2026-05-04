import type {
  CommentHotspot,
  ShortsCandidate,
  ShortsRisk,
  ShortsTopicBucket,
  SuggestedClip,
} from "./types";
import {
  calculateAgeHours,
  calculateCommentsPer1000Views,
  calculateViewsPerHour,
  scoreActivity,
  scoreFreshness,
  scoreOverallCandidate,
} from "./scoring";

type MockCandidateInput = {
  id: string;
  sourceVideoId: string;
  title: string;
  channel: string;
  topicBucket: ShortsTopicBucket;
  ageHoursAgo: number;
  views: number;
  comments: number;
  likes?: number;
  controversyScore: number;
  torchFitScore: number;
  clipabilityScore: number;
  monetizationSafetyScore: number;
  transcript?: string;
  commentHotspots: CommentHotspot[];
  suggestedClips: SuggestedClip[];
  notes: string;
  risk: ShortsRisk;
};

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

function buildCandidate(input: MockCandidateInput): ShortsCandidate {
  const publishedAt = hoursAgo(input.ageHoursAgo);
  const ageHours = calculateAgeHours(publishedAt);
  const viewsPerHour = calculateViewsPerHour(input.views, ageHours);
  const commentsPer1000Views = calculateCommentsPer1000Views(
    input.comments,
    input.views,
  );
  const freshnessScore = scoreFreshness(ageHours);
  const activityScore = scoreActivity(viewsPerHour, commentsPer1000Views);

  return {
    id: input.id,
    source: "youtube",
    sourceVideoId: input.sourceVideoId,
    sourceUrl: `https://youtube.example/watch?v=${input.sourceVideoId}`,
    title: input.title,
    channel: input.channel,
    topicBucket: input.topicBucket,
    publishedAt,
    ageHours,
    views: input.views,
    comments: input.comments,
    likes: input.likes,
    viewsPerHour,
    commentsPer1000Views,
    freshnessScore,
    activityScore,
    controversyScore: input.controversyScore,
    torchFitScore: input.torchFitScore,
    clipabilityScore: input.clipabilityScore,
    monetizationSafetyScore: input.monetizationSafetyScore,
    overallScore: scoreOverallCandidate({
      freshnessScore,
      activityScore,
      controversyScore: input.controversyScore,
      torchFitScore: input.torchFitScore,
      clipabilityScore: input.clipabilityScore,
      monetizationSafetyScore: input.monetizationSafetyScore,
    }),
    transcript: input.transcript,
    commentHotspots: input.commentHotspots,
    suggestedClips: input.suggestedClips,
    status: "new",
    notes: input.notes,
    risk: input.risk,
  };
}

export const mockShortsCandidates: ShortsCandidate[] = [
  buildCandidate({
    id: "torch-pol-media-001",
    sourceVideoId: "mock-pol-9h",
    title: "Anchor Dismisses a Viral Hearing Clip, Then the Full Exchange Lands",
    channel: "Civic Signal Clips",
    topicBucket: "media-hypocrisy",
    ageHoursAgo: 9,
    views: 184000,
    comments: 5400,
    likes: 13200,
    controversyScore: 86,
    torchFitScore: 92,
    clipabilityScore: 84,
    monetizationSafetyScore: 76,
    transcript:
      "The panel argues the clip is out of context before the full answer contradicts the setup.",
    commentHotspots: [
      {
        timestampSeconds: 68,
        count: 128,
        exampleComments: [
          "Start at 1:08, that is the whole ballgame.",
          "The correction was quieter than the smear.",
        ],
        score: 92,
      },
      {
        timestampSeconds: 104,
        count: 77,
        exampleComments: ["1:44 is where the room changes."],
        score: 76,
      },
    ],
    suggestedClips: [
      {
        id: "pol-media-clip-a",
        startSeconds: 61,
        endSeconds: 84,
        source: "comment-hotspot",
        reason: "Comment cluster points to the contradiction and reversal.",
        confidence: 0.9,
        timestampClusterCount: 128,
        riskNotes: "Panel language is heated but not explicit.",
      },
      {
        id: "pol-media-clip-b",
        startSeconds: 98,
        endSeconds: 116,
        source: "n8n",
        reason: "Short rebuttal beat with clear reaction timing.",
        confidence: 0.78,
        timestampClusterCount: 77,
      },
    ],
    notes:
      "Fresh media hypocrisy angle. Better as critique of framing than partisan recap.",
    risk: {
      sourceProfanityRisk: "low",
      torchProfanityRisk: "medium",
      slurHateRisk: "low",
      threatRisk: "low",
      sexualGraphicRisk: "low",
      titleThumbnailRisk: "low",
      reusedContentRisk: "medium",
      copyrightRisk: "medium",
      overallRisk: "medium",
      needsSourceBleep: false,
      needsCaptionCensor: true,
      riskNotes: [
        "Keep title clean and critique the framing, not identity groups.",
        "Use short clips with Torch commentary over the reversal.",
      ],
    },
  }),
  buildCandidate({
    id: "torch-sports-002",
    sourceVideoId: "mock-sports-17h",
    title: "Coach Snaps After a Last-Second Call Gets Explained in Slow Motion",
    channel: "Fourth Quarter Wire",
    topicBucket: "sports-drama",
    ageHoursAgo: 17,
    views: 431000,
    comments: 8200,
    likes: 28600,
    controversyScore: 82,
    torchFitScore: 83,
    clipabilityScore: 91,
    monetizationSafetyScore: 82,
    transcript:
      "A coach reacts to a disputed final whistle while the broadcast shows the angle that changes the story.",
    commentHotspots: [
      {
        timestampSeconds: 47,
        count: 203,
        exampleComments: [
          "0:47 is the freeze frame everyone is arguing about.",
          "That ref explanation made it worse.",
        ],
        score: 94,
      },
      {
        timestampSeconds: 73,
        count: 96,
        exampleComments: ["1:13, coach knew he lost the argument."],
        score: 81,
      },
    ],
    suggestedClips: [
      {
        id: "sports-clip-a",
        startSeconds: 43,
        endSeconds: 66,
        source: "comment-hotspot",
        reason: "The replay angle, reaction, and ref explanation land together.",
        confidence: 0.93,
        timestampClusterCount: 203,
      },
    ],
    notes:
      "Strong non-political velocity. Torch can call out the theatrics without legal or identity risk.",
    risk: {
      sourceProfanityRisk: "medium",
      torchProfanityRisk: "medium",
      slurHateRisk: "low",
      threatRisk: "low",
      sexualGraphicRisk: "low",
      titleThumbnailRisk: "low",
      reusedContentRisk: "medium",
      copyrightRisk: "medium",
      overallRisk: "medium",
      needsSourceBleep: true,
      needsCaptionCensor: true,
      riskNotes: [
        "Crowd audio may contain quick profanity.",
        "Avoid implying corruption without evidence.",
      ],
    },
  }),
  buildCandidate({
    id: "torch-scam-003",
    sourceVideoId: "mock-scam-28h",
    title: "Finance Guru Says Max Out Credit Cards for Algorithm Leverage",
    channel: "Receipt Review",
    topicBucket: "scams",
    ageHoursAgo: 28,
    views: 96200,
    comments: 4800,
    likes: 7100,
    controversyScore: 88,
    torchFitScore: 94,
    clipabilityScore: 78,
    monetizationSafetyScore: 84,
    transcript:
      "A self-styled finance coach tells viewers to create leverage by opening more cards and carrying balances.",
    commentHotspots: [
      {
        timestampSeconds: 132,
        count: 141,
        exampleComments: [
          "2:12 is where it turns into financial fan fiction.",
          "Please do not take debt advice from this guy.",
        ],
        score: 91,
      },
    ],
    suggestedClips: [
      {
        id: "scam-clip-a",
        startSeconds: 126,
        endSeconds: 151,
        source: "comment-hotspot",
        reason: "Bad-advice claim is concise and easy to critique.",
        confidence: 0.88,
        timestampClusterCount: 141,
      },
    ],
    notes:
      "Great Torch fit. Keep critique framed as consumer warning and avoid personal allegations.",
    risk: {
      sourceProfanityRisk: "low",
      torchProfanityRisk: "medium",
      slurHateRisk: "low",
      threatRisk: "low",
      sexualGraphicRisk: "low",
      titleThumbnailRisk: "low",
      reusedContentRisk: "low",
      copyrightRisk: "low",
      overallRisk: "low",
      needsSourceBleep: false,
      needsCaptionCensor: true,
      riskNotes: [
        "Do not accuse criminal fraud without proof.",
        "Add clear commentary and consumer-safety context.",
      ],
    },
  }),
  buildCandidate({
    id: "torch-ai-004",
    sourceVideoId: "mock-ai-46h",
    title: "Founder Claims AI Agents Made Junior Developers Obsolete Overnight",
    channel: "Build Cycle Daily",
    topicBucket: "tech-ai",
    ageHoursAgo: 46,
    views: 211000,
    comments: 7300,
    likes: 18400,
    controversyScore: 79,
    torchFitScore: 86,
    clipabilityScore: 73,
    monetizationSafetyScore: 88,
    transcript:
      "A startup founder says hiring junior developers no longer makes sense because agents can do the work.",
    commentHotspots: [
      {
        timestampSeconds: 58,
        count: 118,
        exampleComments: [
          "0:58 is peak LinkedIn fantasy.",
          "Ask him who fixes the AI output.",
        ],
        score: 84,
      },
    ],
    suggestedClips: [
      {
        id: "ai-clip-a",
        startSeconds: 53,
        endSeconds: 78,
        source: "comment-hotspot",
        reason: "Clean bad-take segment with a natural Torch punch-in.",
        confidence: 0.82,
        timestampClusterCount: 118,
      },
    ],
    notes:
      "Useful tech/business bad-take entry. Keep it sharp but grounded.",
    risk: {
      sourceProfanityRisk: "low",
      torchProfanityRisk: "medium",
      slurHateRisk: "low",
      threatRisk: "low",
      sexualGraphicRisk: "low",
      titleThumbnailRisk: "low",
      reusedContentRisk: "medium",
      copyrightRisk: "low",
      overallRisk: "low",
      needsSourceBleep: false,
      needsCaptionCensor: true,
      riskNotes: [
        "Low legal risk if commentary focuses on the claim.",
        "Avoid blanket insults at workers or founders.",
      ],
    },
  }),
  buildCandidate({
    id: "torch-drama-005",
    sourceVideoId: "mock-drama-62h",
    title: "Streamer Apology Tour Falls Apart When Chat Pulls the Receipts",
    channel: "Stream Court",
    topicBucket: "internet-drama",
    ageHoursAgo: 62,
    views: 682000,
    comments: 26200,
    likes: 49700,
    controversyScore: 91,
    torchFitScore: 89,
    clipabilityScore: 86,
    monetizationSafetyScore: 61,
    transcript:
      "A streamer apologizes for a previous claim while chat posts timestamps contradicting the story.",
    commentHotspots: [
      {
        timestampSeconds: 214,
        count: 312,
        exampleComments: [
          "3:34 is when the receipts hit.",
          "Chat did the production team's job.",
        ],
        score: 97,
      },
      {
        timestampSeconds: 246,
        count: 144,
        exampleComments: ["4:06 is the backpedal."],
        score: 83,
      },
    ],
    suggestedClips: [
      {
        id: "drama-clip-a",
        startSeconds: 209,
        endSeconds: 236,
        source: "comment-hotspot",
        reason: "Strong contradiction beat with visible audience reaction.",
        confidence: 0.91,
        timestampClusterCount: 312,
        riskNotes: "Chat overlay may include profanity; caption censor recommended.",
      },
    ],
    notes:
      "Huge comments-per-view signal. Needs stronger risk review because chat/source language may get messy.",
    risk: {
      sourceProfanityRisk: "high",
      torchProfanityRisk: "medium",
      slurHateRisk: "medium",
      threatRisk: "low",
      sexualGraphicRisk: "medium",
      titleThumbnailRisk: "medium",
      reusedContentRisk: "medium",
      copyrightRisk: "medium",
      overallRisk: "high",
      needsSourceBleep: true,
      needsCaptionCensor: true,
      riskNotes: [
        "Review chat overlay before render.",
        "Avoid sexualized insults and identity attacks.",
        "Use a clean title and first-frame caption.",
      ],
    },
  }),
].sort((a, b) => b.overallScore - a.overallScore);
