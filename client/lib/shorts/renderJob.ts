import type {
  CaptionMode,
  ShortsRenderJob,
  ShortsRisk,
  SuggestedClip,
  TorchScript,
  TorchTone,
} from "./types";
import {
  containsProfanity,
  getCandidateAgeWarning,
  highestRiskLevel,
  scoreTransformativeRisk,
} from "./scoring";
import type { ShortsCandidate } from "./types";

type CreateRenderJobInput = {
  candidate: ShortsCandidate;
  selectedClip: SuggestedClip;
  script: TorchScript;
  risk: ShortsRisk;
  captionMode: CaptionMode;
  bleepSourceAudio: boolean;
  censorCaptionText: boolean;
  avoidProfanityInMetadata?: boolean;
  markedTransformativeCommentary?: boolean;
  localWorkerUrl: string;
};

export function createDefaultTorchScript(
  candidate: ShortsCandidate,
  selectedClip: SuggestedClip,
  tone: TorchTone = "sarcastic",
): TorchScript {
  const topicLabel = candidate.topicBucket.replace(/-/g, " ");
  const clipSeconds = selectedClip.endSeconds - selectedClip.startSeconds;

  return {
    hook: "Hold up. This is the part where the confident take starts falling apart.",
    liveReactionLines: [
      "There it is. Listen to how fast the story changes once the actual clip shows up.",
      "That is not a misunderstanding. That is a full-speed faceplant with a microphone.",
      "The annoying part is how polished the bad take sounded before reality walked in.",
    ],
    postCommentary: `This is why Torch is clipping this one. The claim sounds clean for about five seconds, then the details start breaking the sales pitch. The useful angle is not just dunking on ${candidate.channel}; it is showing exactly where the argument stops making sense, why people are reacting, and why a ${clipSeconds}-second source clip needs commentary instead of a lazy repost.`,
    titleIdeas: [
      "This Take Collapsed in Real Time",
      `The ${topicLabel} Clip Everyone Is Arguing About`,
      "Torch Checks the Part They Skipped",
    ],
    descriptionDraft: `Torch reacts to a fresh ${topicLabel} clip from ${candidate.channel}, with commentary on the claim, the reaction, and the part that made the comments explode.`,
    hashtags: ["#shorts", "#reaction", "#commentary", "#torchem"],
    pinnedComment:
      "Was Torch too harsh here, or did the original take earn the heat?",
    tone,
    targetAudienceNotes:
      "Male-skewed, conservative-leaning audience that wants sharp commentary, not generic cable-news yelling.",
  };
}

export function createRenderJobPayload({
  candidate,
  selectedClip,
  script,
  risk,
  captionMode,
  bleepSourceAudio,
  censorCaptionText,
  avoidProfanityInMetadata = true,
  markedTransformativeCommentary = true,
  localWorkerUrl,
}: CreateRenderJobInput): ShortsRenderJob {
  const transformativeAssessment = scoreTransformativeRisk(
    selectedClip,
    script,
  );

  return {
    candidateId: candidate.id,
    sourceVideoId: candidate.sourceVideoId,
    sourceUrl: candidate.sourceUrl,
    sourceTitle: candidate.title,
    sourceChannel: candidate.channel,
    selectedClip,
    script,
    risk: {
      ...risk,
      reusedContentRisk: transformativeAssessment.reusedContentRisk,
      overallRisk: highestRiskLevel([
        risk.sourceProfanityRisk,
        risk.torchProfanityRisk,
        risk.slurHateRisk,
        risk.threatRisk,
        risk.sexualGraphicRisk,
        risk.titleThumbnailRisk,
        transformativeAssessment.reusedContentRisk,
        risk.copyrightRisk,
      ]),
      needsSourceBleep: bleepSourceAudio,
      needsCaptionCensor: censorCaptionText,
    },
    layout: "split-screen",
    torchPlacement: "top",
    sourcePlacement: "bottom",
    outputFormat: "1080x1920",
    captionMode,
    bleepSourceAudio,
    censorCaptionText,
    avoidProfanityInMetadata,
    markedTransformativeCommentary,
    localWorkerUrl,
    status: "draft",
    renderMode: "local",
    createdAt: new Date().toISOString(),
    transformativeAssessment,
  };
}

export function getRiskWarnings({
  candidate,
  selectedClip,
  script,
  risk,
}: {
  candidate: ShortsCandidate;
  selectedClip: SuggestedClip;
  script: TorchScript;
  risk: ShortsRisk;
}) {
  const warnings: string[] = [];
  const assessment = scoreTransformativeRisk(selectedClip, script);
  const titleText = script.titleIdeas.join(" ");
  const ageWarning = getCandidateAgeWarning(candidate);

  if (selectedClip.endSeconds - selectedClip.startSeconds > 28) {
    warnings.push("Source clip is long. Trim toward 18-25 seconds for safer transformation.");
  }

  if (assessment.torchCommentarySecondsEstimate < 14) {
    warnings.push("Torch commentary is short. Add critique/context before sending to render.");
  }

  if (containsProfanity(titleText)) {
    warnings.push("A title idea contains profanity. Keep titles, thumbnails, and first-frame captions clean.");
  }

  if (ageWarning) warnings.push(ageWarning);

  if (risk.overallRisk === "high" || risk.overallRisk === "critical") {
    warnings.push("Overall monetization risk is high. Review source audio, captions, and framing before render.");
  }

  return warnings;
}
