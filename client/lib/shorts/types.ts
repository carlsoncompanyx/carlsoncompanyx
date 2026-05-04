export type ShortsTopicBucket =
  | "politics"
  | "media-hypocrisy"
  | "sports-drama"
  | "internet-drama"
  | "scams"
  | "bad-takes"
  | "tech-ai"
  | "business-failures"
  | "local-current"
  | "viral-arguments";

export type ShortsCandidateStatus =
  | "new"
  | "shortlisted"
  | "scripted"
  | "rendered"
  | "rejected"
  | "posted";

export type ShortsRiskLevel = "low" | "medium" | "high" | "critical";

export type TorchTone =
  | "aggressive"
  | "sarcastic"
  | "explanatory"
  | "comedic"
  | "restrained";

export type CaptionMode =
  | "burned-in-clean"
  | "burned-in-verbatim"
  | "none";

export interface CommentHotspot {
  timestampSeconds: number;
  count: number;
  exampleComments: string[];
  score: number;
}

export interface SuggestedClip {
  id: string;
  startSeconds: number;
  endSeconds: number;
  source: "comment-hotspot" | "transcript" | "manual" | "n8n";
  reason: string;
  confidence: number;
  timestampClusterCount?: number;
  riskNotes?: string;
}

export interface ShortsRisk {
  sourceProfanityRisk: ShortsRiskLevel;
  torchProfanityRisk: ShortsRiskLevel;
  slurHateRisk: ShortsRiskLevel;
  threatRisk: ShortsRiskLevel;
  sexualGraphicRisk: ShortsRiskLevel;
  titleThumbnailRisk: ShortsRiskLevel;
  reusedContentRisk: ShortsRiskLevel;
  copyrightRisk: ShortsRiskLevel;
  overallRisk: ShortsRiskLevel;
  needsSourceBleep: boolean;
  needsCaptionCensor: boolean;
  riskNotes: string[];
}

export interface ShortsCandidate {
  id: string;
  source: "youtube";
  sourceVideoId: string;
  sourceUrl: string;
  title: string;
  channel: string;
  topicBucket: ShortsTopicBucket;
  publishedAt: string;
  ageHours: number;
  views: number;
  comments: number;
  likes?: number;
  viewsPerHour: number;
  commentsPer1000Views: number;
  freshnessScore: number;
  activityScore: number;
  controversyScore: number;
  torchFitScore: number;
  clipabilityScore: number;
  monetizationSafetyScore: number;
  overallScore: number;
  transcript?: string;
  commentHotspots: CommentHotspot[];
  suggestedClips: SuggestedClip[];
  status: ShortsCandidateStatus;
  thumbnailUrl?: string;
  notes?: string;
  risk: ShortsRisk;
}

export interface TorchScript {
  hook: string;
  liveReactionLines: string[];
  postCommentary: string;
  titleIdeas: string[];
  descriptionDraft: string;
  hashtags: string[];
  pinnedComment?: string;
  tone: TorchTone;
  targetAudienceNotes: string;
}

export interface TransformativeAssessment {
  sourceClipSeconds: number;
  torchCommentarySecondsEstimate: number;
  commentaryToClipRatio: number;
  transformativeScore: number;
  reusedContentRisk: ShortsRiskLevel;
  notes: string[];
}

export interface ShortsRenderJob {
  candidateId: string;
  sourceVideoId: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceChannel: string;
  selectedClip: SuggestedClip;
  script: TorchScript;
  risk: ShortsRisk;
  layout: "split-screen";
  torchPlacement: "top";
  sourcePlacement: "bottom";
  outputFormat: "1080x1920";
  captionMode: CaptionMode;
  bleepSourceAudio: boolean;
  censorCaptionText: boolean;
  avoidProfanityInMetadata: boolean;
  markedTransformativeCommentary: boolean;
  localWorkerUrl: string;
  status: "draft" | "queued" | "sending" | "failed" | "completed";
  renderMode: "local";
  createdAt: string;
  transformativeAssessment: TransformativeAssessment;
}
