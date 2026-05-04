import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  FileText,
  Flame,
  Gauge,
  Loader2,
  MessageSquare,
  Radio,
  RefreshCw,
  Scissors,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { mockShortsCandidates } from "@/lib/shorts/mockCandidates";
import {
  classifyAgeBucket,
  scoreTransformativeRisk,
} from "@/lib/shorts/scoring";
import {
  createDefaultTorchScript,
  createRenderJobPayload,
  getRiskWarnings,
} from "@/lib/shorts/renderJob";

const topicLabels = {
  politics: "Politics",
  "media-hypocrisy": "Media Hypocrisy",
  "sports-drama": "Sports Drama",
  "internet-drama": "Internet Drama",
  scams: "Scams",
  "bad-takes": "Bad Takes",
  "tech-ai": "Tech / AI",
  "business-failures": "Business Failures",
  "local-current": "Local / Current",
  "viral-arguments": "Viral Arguments",
};

const statusLabels = {
  new: "New",
  shortlisted: "Shortlisted",
  scripted: "Scripted",
  rendered: "Rendered",
  rejected: "Rejected",
  posted: "Posted",
};

const riskLevels = ["low", "medium", "high", "critical"];

const riskLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const riskFields = [
  ["sourceProfanityRisk", "Source clip profanity"],
  ["torchProfanityRisk", "Torch script profanity"],
  ["titleThumbnailRisk", "Title / thumbnail / captions"],
  ["slurHateRisk", "Slur / hate / identity attack"],
  ["threatRisk", "Threat / violent language"],
  ["sexualGraphicRisk", "Sexual / graphic language"],
  ["reusedContentRisk", "Reused-content risk"],
  ["copyrightRisk", "Copyright / legal"],
  ["overallRisk", "Overall monetization"],
];

const statusOptions = ["new", "shortlisted", "scripted", "rendered", "rejected", "posted"];

const formatter = new Intl.NumberFormat("en-US");

function formatNumber(value) {
  return formatter.format(value);
}

function formatCompact(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = String(Math.round(seconds % 60)).padStart(2, "0");
  return `${minutes}:${remaining}`;
}

function getRiskBadgeClass(risk) {
  return {
    low: "border-emerald-200 bg-emerald-50 text-emerald-700",
    medium: "border-amber-200 bg-amber-50 text-amber-700",
    high: "border-orange-200 bg-orange-50 text-orange-700",
    critical: "border-red-200 bg-red-50 text-red-700",
  }[risk];
}

function getStatusBadgeClass(status) {
  return {
    new: "border-slate-200 bg-slate-50 text-slate-700",
    shortlisted: "border-cyan-200 bg-cyan-50 text-cyan-700",
    scripted: "border-indigo-200 bg-indigo-50 text-indigo-700",
    rendered: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-red-200 bg-red-50 text-red-700",
    posted: "border-purple-200 bg-purple-50 text-purple-700",
  }[status];
}

function getAgeBadgeClass(ageBucket) {
  return {
    fresh: "border-emerald-200 bg-emerald-50 text-emerald-700",
    accelerating: "border-cyan-200 bg-cyan-50 text-cyan-700",
    watch: "border-amber-200 bg-amber-50 text-amber-700",
    stale: "border-orange-200 bg-orange-50 text-orange-700",
    "flag-old": "border-red-200 bg-red-50 text-red-700",
  }[ageBucket];
}

function updateLines(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function CheckboxRow({ checked, label, description, onCheckedChange }) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-white px-3 py-3">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(Boolean(value))}
        className="mt-0.5"
      />
      <span className="space-y-1">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description ? (
          <span className="block text-xs leading-5 text-slate-500">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function RiskSelect({ value, onValueChange }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {riskLevels.map((level) => (
          <SelectItem key={level} value={level}>
            {riskLabels[level]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ScoreBar({ label, value }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span className="font-semibold text-slate-700">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-cyan-500"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export default function ShortsGenerator() {
  const [candidates, setCandidates] = useState(mockShortsCandidates);
  const [selectedCandidateId, setSelectedCandidateId] = useState(
    mockShortsCandidates[0]?.id ?? "",
  );
  const [topicFilter, setTopicFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("overallScore");
  const [activeTab, setActiveTab] = useState("queue");
  const [selectedClip, setSelectedClip] = useState(
    mockShortsCandidates[0]?.suggestedClips[0] ?? null,
  );
  const [script, setScript] = useState(() =>
    mockShortsCandidates[0]
      ? createDefaultTorchScript(
          mockShortsCandidates[0],
          mockShortsCandidates[0].suggestedClips[0],
        )
      : null,
  );
  const [risk, setRisk] = useState(mockShortsCandidates[0]?.risk ?? null);
  const [captionMode, setCaptionMode] = useState("burned-in-clean");
  const [bleepSourceAudio, setBleepSourceAudio] = useState(
    mockShortsCandidates[0]?.risk.needsSourceBleep ?? false,
  );
  const [censorCaptionText, setCensorCaptionText] = useState(true);
  const [avoidMetadataProfanity, setAvoidMetadataProfanity] = useState(true);
  const [markedTransformative, setMarkedTransformative] = useState(true);
  const [workerUrl, setWorkerUrl] = useState(
    import.meta.env.VITE_LOCAL_RENDER_WORKER_URL || "http://localhost:8788",
  );
  const [renderState, setRenderState] = useState({
    status: "idle",
    message: "Render job JSON is ready when the local worker is online.",
    response: null,
  });
  const [copyState, setCopyState] = useState("");

  const selectedCandidate = useMemo(
    () =>
      candidates.find((candidate) => candidate.id === selectedCandidateId) ??
      candidates[0] ??
      null,
    [candidates, selectedCandidateId],
  );

  useEffect(() => {
    if (!selectedCandidate) return;

    const nextClip = selectedCandidate.suggestedClips[0];
    setSelectedClip(nextClip);
    setScript(createDefaultTorchScript(selectedCandidate, nextClip));
    setRisk({ ...selectedCandidate.risk });
    setBleepSourceAudio(selectedCandidate.risk.needsSourceBleep);
    setCensorCaptionText(selectedCandidate.risk.needsCaptionCensor);
    setMarkedTransformative(true);
    setRenderState({
      status: "idle",
      message: "Render job JSON is ready when the local worker is online.",
      response: null,
    });
  }, [selectedCandidate?.id]);

  const topicOptions = useMemo(
    () => Array.from(new Set(candidates.map((candidate) => candidate.topicBucket))),
    [candidates],
  );

  const visibleCandidates = useMemo(() => {
    const filtered = candidates.filter((candidate) => {
      const topicMatch = topicFilter === "all" || candidate.topicBucket === topicFilter;
      const statusMatch = statusFilter === "all" || candidate.status === statusFilter;
      return topicMatch && statusMatch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "risk") {
        const riskWeight = { low: 0, medium: 1, high: 2, critical: 3 };
        return riskWeight[a.risk.overallRisk] - riskWeight[b.risk.overallRisk];
      }
      return b[sortBy] - a[sortBy];
    });
  }, [candidates, sortBy, statusFilter, topicFilter]);

  const renderJob = useMemo(() => {
    if (!selectedCandidate || !selectedClip || !script || !risk) return null;

    return createRenderJobPayload({
      candidate: selectedCandidate,
      selectedClip,
      script,
      risk,
      captionMode,
      bleepSourceAudio,
      censorCaptionText,
      avoidProfanityInMetadata: avoidMetadataProfanity,
      markedTransformativeCommentary: markedTransformative,
      localWorkerUrl: workerUrl.trim() || "http://localhost:8788",
    });
  }, [
    avoidMetadataProfanity,
    bleepSourceAudio,
    captionMode,
    censorCaptionText,
    markedTransformative,
    risk,
    script,
    selectedCandidate,
    selectedClip,
    workerUrl,
  ]);

  const renderJobJson = useMemo(
    () => (renderJob ? JSON.stringify(renderJob, null, 2) : "{}"),
    [renderJob],
  );

  const transformativeAssessment = useMemo(() => {
    if (!selectedClip || !script) return null;
    return scoreTransformativeRisk(selectedClip, script);
  }, [script, selectedClip]);

  const warnings = useMemo(() => {
    if (!selectedCandidate || !selectedClip || !script || !risk) return [];
    return getRiskWarnings({ candidate: selectedCandidate, selectedClip, script, risk });
  }, [risk, script, selectedCandidate, selectedClip]);

  const setCandidateStatus = (candidateId, status) => {
    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === candidateId ? { ...candidate, status } : candidate,
      ),
    );
  };

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidateId(candidate.id);
    setCandidateStatus(
      candidate.id,
      candidate.status === "new" ? "shortlisted" : candidate.status,
    );
    setActiveTab("script");
  };

  const handleClipFieldChange = (field, value) => {
    setSelectedClip((current) => ({
      ...current,
      [field]: Number(value),
      source: current?.source ?? "manual",
    }));
  };

  const handleSuggestedClipSelect = (clip) => {
    setSelectedClip({ ...clip });
  };

  const handleGenerateDraft = () => {
    if (!selectedCandidate || !selectedClip || !script) return;
    setScript(
      createDefaultTorchScript(selectedCandidate, selectedClip, script.tone),
    );
    setCandidateStatus(selectedCandidate.id, "scripted");
  };

  const updateRiskField = (field, value) => {
    setRisk((current) => ({ ...current, [field]: value }));
  };

  const handleCopyRenderJob = async () => {
    try {
      await navigator.clipboard.writeText(renderJobJson);
      setCopyState("Copied");
    } catch (error) {
      setCopyState("Copy failed");
    } finally {
      window.setTimeout(() => setCopyState(""), 1800);
    }
  };

  const handleSendToWorker = async () => {
    if (!renderJob) return;

    const endpoint = `${(workerUrl.trim() || "http://localhost:8788").replace(/\/$/, "")}/render-short`;
    setRenderState({
      status: "sending",
      message: `Sending render job to ${endpoint}`,
      response: null,
    });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: renderJobJson,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || `Worker returned ${response.status}`);
      }

      setRenderState({
        status: "success",
        message: "Local render worker accepted the job.",
        response: payload,
      });
    } catch (error) {
      setRenderState({
        status: "error",
        message:
          "Local worker is not reachable. Nothing was uploaded; keep using the JSON payload below for local handoff.",
        response: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  };

  if (!selectedCandidate || !selectedClip || !script || !risk) {
    return <EmptyState>No Shorts candidates are available.</EmptyState>;
  }

  const selectedClipLength = selectedClip.endSeconds - selectedClip.startSeconds;
  const ageBucket = classifyAgeBucket(selectedCandidate.ageHours);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="border-red-200 bg-red-50 text-red-700" variant="outline">
              <Flame className="mr-1 h-3.5 w-3.5" />
              Torch Shorts
            </Badge>
            <Badge className="border-cyan-200 bg-cyan-50 text-cyan-700" variant="outline">
              Local render mode
            </Badge>
          </div>
          <h2 className="text-2xl font-semibold text-slate-950">
            Shorts Operator Console
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Review n8n-discovered YouTube candidates, shape Torch commentary,
            check monetization risk, and hand a local render job to the desktop worker.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[520px]">
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-500">Candidates</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {candidates.length}
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-500">Top Score</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {Math.max(...candidates.map((candidate) => candidate.overallScore))}
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-500">Clip</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {selectedClipLength}s
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-500">Risk</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {riskLabels[risk.overallRisk]}
            </div>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-slate-100 p-1 md:grid-cols-4">
          <TabsTrigger value="queue" className="gap-2 py-2">
            <Radio className="h-4 w-4" />
            Queue
          </TabsTrigger>
          <TabsTrigger value="script" className="gap-2 py-2">
            <FileText className="h-4 w-4" />
            Script
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-2 py-2">
            <ShieldAlert className="h-4 w-4" />
            Risk
          </TabsTrigger>
          <TabsTrigger value="render" className="gap-2 py-2">
            <Send className="h-4 w-4" />
            Render
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-5">
          <section className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Candidate Queue
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Sorted for freshness, velocity, comment heat, Torch fit, and safety.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:w-[640px]">
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All topics</SelectItem>
                    {topicOptions.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topicLabels[topic]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overallScore">Overall score</SelectItem>
                    <SelectItem value="freshnessScore">Freshness</SelectItem>
                    <SelectItem value="activityScore">Activity</SelectItem>
                    <SelectItem value="viewsPerHour">Views / hour</SelectItem>
                    <SelectItem value="risk">Lowest risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="space-y-3">
              {visibleCandidates.map((candidate) => {
                const isSelected = selectedCandidate.id === candidate.id;
                const candidateAgeBucket = classifyAgeBucket(candidate.ageHours);
                const primaryClip = candidate.suggestedClips[0];

                return (
                  <article
                    key={candidate.id}
                    className={cn(
                      "rounded-md border bg-white p-4 transition",
                      isSelected
                        ? "border-cyan-300 shadow-sm"
                        : "border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <div className="grid gap-4 lg:grid-cols-[136px_minmax(0,1fr)_180px]">
                      <div className="flex h-28 items-center justify-center rounded-md border border-slate-200 bg-gradient-to-br from-slate-900 via-cyan-900 to-amber-800 text-center text-sm font-semibold text-white">
                        {topicLabels[candidate.topicBucket]}
                      </div>

                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={getStatusBadgeClass(candidate.status)}
                            variant="outline"
                          >
                            {statusLabels[candidate.status]}
                          </Badge>
                          <Badge
                            className={getRiskBadgeClass(candidate.risk.overallRisk)}
                            variant="outline"
                          >
                            {riskLabels[candidate.risk.overallRisk]} risk
                          </Badge>
                          <Badge
                            className={getAgeBadgeClass(candidateAgeBucket)}
                            variant="outline"
                          >
                            {candidate.ageHours}h old
                          </Badge>
                        </div>

                        <div>
                          <h4 className="text-base font-semibold leading-6 text-slate-950">
                            {candidate.title}
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            {candidate.channel} · {topicLabels[candidate.topicBucket]}
                          </p>
                        </div>

                        <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                          <MetricPill icon={Eye} label="Views" value={formatCompact(candidate.views)} />
                          <MetricPill icon={MessageSquare} label="Comments" value={formatCompact(candidate.comments)} />
                          <MetricPill icon={Gauge} label="Views/hour" value={formatNumber(candidate.viewsPerHour)} />
                          <MetricPill
                            icon={Flame}
                            label="Comments/1k"
                            value={candidate.commentsPer1000Views}
                          />
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                          <ScoreBar label="Fresh" value={candidate.freshnessScore} />
                          <ScoreBar label="Activity" value={candidate.activityScore} />
                          <ScoreBar label="Overall" value={candidate.overallScore} />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                          <div className="mb-1 flex items-center gap-2 font-medium text-slate-800">
                            <Scissors className="h-4 w-4" />
                            Clip range
                          </div>
                          {primaryClip
                            ? `${formatSeconds(primaryClip.startSeconds)}-${formatSeconds(primaryClip.endSeconds)}`
                            : "No clip"}
                          <div className="mt-1 text-xs text-slate-500">
                            {primaryClip?.confidence
                              ? `${Math.round(primaryClip.confidence * 100)}% confidence`
                              : "Manual needed"}
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleSelectCandidate(candidate)}
                          className="w-full"
                        >
                          Select
                        </Button>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <Select
                            value={candidate.status}
                            onValueChange={(value) => setCandidateStatus(candidate.id, value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {statusLabels[status]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => setCandidateStatus(candidate.id, "rejected")}
                            aria-label="Reject candidate"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {visibleCandidates.length === 0 ? (
                <EmptyState>No candidates match the current filters.</EmptyState>
              ) : null}
            </section>

            <aside className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-900">
                  Selected Candidate
                </h3>
                <Badge className={getRiskBadgeClass(risk.overallRisk)} variant="outline">
                  {riskLabels[risk.overallRisk]}
                </Badge>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-sm font-semibold leading-6 text-slate-950">
                    {selectedCandidate.title}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {selectedCandidate.channel}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label="Overall" value={selectedCandidate.overallScore} />
                  <MiniStat label="Torch fit" value={selectedCandidate.torchFitScore} />
                  <MiniStat label="Clipability" value={selectedCandidate.clipabilityScore} />
                  <MiniStat label="Safety" value={selectedCandidate.monetizationSafetyScore} />
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                  {selectedCandidate.notes}
                </div>
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="script" className="space-y-5">
          <section className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Script Builder
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Shape the selected source beat into a Torch reaction with critique and context.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={script.tone}
                  onValueChange={(value) =>
                    setScript((current) => ({ ...current, tone: value }))
                  }
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                    <SelectItem value="sarcastic">Sarcastic</SelectItem>
                    <SelectItem value="explanatory">Explanatory</SelectItem>
                    <SelectItem value="comedic">Comedic</SelectItem>
                    <SelectItem value="restrained">Restrained</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={handleGenerateDraft}>
                  <Sparkles className="h-4 w-4" />
                  Generate Draft
                </Button>
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
            <section className="space-y-4 rounded-md border border-slate-200 bg-white p-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Clip Controls
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  n8n timestamp clusters are editable before render.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="clip-start">Start seconds</Label>
                  <Input
                    id="clip-start"
                    type="number"
                    min="0"
                    value={selectedClip.startSeconds}
                    onChange={(event) =>
                      handleClipFieldChange("startSeconds", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clip-end">End seconds</Label>
                  <Input
                    id="clip-end"
                    type="number"
                    min="1"
                    value={selectedClip.endSeconds}
                    onChange={(event) =>
                      handleClipFieldChange("endSeconds", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Scissors className="h-4 w-4" />
                  Suggested Clips
                </div>
                <div className="space-y-2">
                  {selectedCandidate.suggestedClips.map((clip) => (
                    <button
                      type="button"
                      key={clip.id}
                      onClick={() => handleSuggestedClipSelect(clip)}
                      className={cn(
                        "w-full rounded-md border px-3 py-2 text-left text-sm transition",
                        selectedClip.id === clip.id
                          ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                      )}
                    >
                      <div className="font-medium">
                        {formatSeconds(clip.startSeconds)}-{formatSeconds(clip.endSeconds)}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">
                        {clip.reason}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <MessageSquare className="h-4 w-4" />
                  Comment Hotspots
                </div>
                <div className="space-y-2">
                  {selectedCandidate.commentHotspots.map((hotspot) => (
                    <div
                      key={`${hotspot.timestampSeconds}-${hotspot.count}`}
                      className="rounded-md border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-900">
                          {formatSeconds(hotspot.timestampSeconds)}
                        </span>
                        <span className="text-slate-500">
                          {hotspot.count} comments · {hotspot.score} score
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-xs leading-5 text-slate-500">
                        {hotspot.exampleComments.map((comment) => (
                          <p key={comment}>{comment}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-2">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="script-hook">Hook</Label>
                <Textarea
                  id="script-hook"
                  value={script.hook}
                  onChange={(event) =>
                    setScript((current) => ({ ...current, hook: event.target.value }))
                  }
                  className="min-h-20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reaction-lines">Live reaction lines</Label>
                <Textarea
                  id="reaction-lines"
                  value={script.liveReactionLines.join("\n")}
                  onChange={(event) =>
                    setScript((current) => ({
                      ...current,
                      liveReactionLines: updateLines(event.target.value),
                    }))
                  }
                  className="min-h-44"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-commentary">Post-commentary</Label>
                <Textarea
                  id="post-commentary"
                  value={script.postCommentary}
                  onChange={(event) =>
                    setScript((current) => ({
                      ...current,
                      postCommentary: event.target.value,
                    }))
                  }
                  className="min-h-44"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title-ideas">Title ideas</Label>
                <Textarea
                  id="title-ideas"
                  value={script.titleIdeas.join("\n")}
                  onChange={(event) =>
                    setScript((current) => ({
                      ...current,
                      titleIdeas: updateLines(event.target.value),
                    }))
                  }
                  className="min-h-32"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hashtags">Hashtags</Label>
                <Textarea
                  id="hashtags"
                  value={script.hashtags.join(" ")}
                  onChange={(event) =>
                    setScript((current) => ({
                      ...current,
                      hashtags: updateLines(event.target.value.replace(/\s+/g, "\n")),
                    }))
                  }
                  className="min-h-32"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="description-draft">Description draft</Label>
                <Textarea
                  id="description-draft"
                  value={script.descriptionDraft}
                  onChange={(event) =>
                    setScript((current) => ({
                      ...current,
                      descriptionDraft: event.target.value,
                    }))
                  }
                  className="min-h-28"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pinned-comment">Pinned comment</Label>
                <Textarea
                  id="pinned-comment"
                  value={script.pinnedComment ?? ""}
                  onChange={(event) =>
                    setScript((current) => ({
                      ...current,
                      pinnedComment: event.target.value,
                    }))
                  }
                  className="min-h-24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience-notes">Target audience notes</Label>
                <Textarea
                  id="audience-notes"
                  value={script.targetAudienceNotes}
                  onChange={(event) =>
                    setScript((current) => ({
                      ...current,
                      targetAudienceNotes: event.target.value,
                    }))
                  }
                  className="min-h-24"
                />
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-5">
          <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
            <AssessmentStat
              icon={Scissors}
              label="Source clip seconds"
              value={transformativeAssessment?.sourceClipSeconds ?? 0}
            />
            <AssessmentStat
              icon={Clock}
              label="Torch commentary seconds"
              value={transformativeAssessment?.torchCommentarySecondsEstimate ?? 0}
            />
            <AssessmentStat
              icon={Gauge}
              label="Commentary / clip ratio"
              value={`${transformativeAssessment?.commentaryToClipRatio ?? 0}x`}
            />
            <AssessmentStat
              icon={CheckCircle2}
              label="Transformative score"
              value={transformativeAssessment?.transformativeScore ?? 0}
            />
          </section>

          {warnings.length ? (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Review before render</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Risk review is clear</AlertTitle>
              <AlertDescription>
                No high-priority warnings are currently triggered for this draft.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <section className="rounded-md border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-slate-500" />
                <h3 className="text-base font-semibold text-slate-900">
                  Risk Fields
                </h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {riskFields.map(([field, label]) => (
                  <div
                    key={field}
                    className="rounded-md border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="mb-2 text-sm font-medium text-slate-800">
                      {label}
                    </div>
                    <RiskSelect
                      value={risk[field]}
                      onValueChange={(value) => updateRiskField(field, value)}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="risk-notes">Copyright and safety notes</Label>
                <Textarea
                  id="risk-notes"
                  value={risk.riskNotes.join("\n")}
                  onChange={(event) =>
                    setRisk((current) => ({
                      ...current,
                      riskNotes: updateLines(event.target.value),
                    }))
                  }
                  className="min-h-32"
                />
              </div>
            </section>

            <aside className="space-y-4">
              <section className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                  <h3 className="text-base font-semibold text-slate-900">
                    Safety Toggles
                  </h3>
                </div>
                <CheckboxRow
                  checked={bleepSourceAudio}
                  onCheckedChange={setBleepSourceAudio}
                  label="Bleep source audio"
                  description="Flag the local worker to mute or bleep risky source moments."
                />
                <CheckboxRow
                  checked={censorCaptionText}
                  onCheckedChange={setCensorCaptionText}
                  label="Censor risky caption words"
                  description="Flag generated captions for clean on-screen text."
                />
                <CheckboxRow
                  checked={avoidMetadataProfanity}
                  onCheckedChange={setAvoidMetadataProfanity}
                  label="Avoid profanity in metadata"
                  description="Keep title, thumbnail, and first-frame caption clean."
                />
                <CheckboxRow
                  checked={markedTransformative}
                  onCheckedChange={setMarkedTransformative}
                  label="Mark as transformative commentary"
                  description="Torch is visible and provides direct critique or context."
                />
              </section>

              <section className="rounded-md border border-slate-200 bg-white p-4">
                <h3 className="text-base font-semibold text-slate-900">
                  Transformative Notes
                </h3>
                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {transformativeAssessment?.notes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                  {!markedTransformative ? (
                    <p className="font-medium text-amber-700">
                      Manual transformative flag is off.
                    </p>
                  ) : null}
                </div>
                <Badge
                  className={cn(
                    "mt-4",
                    getRiskBadgeClass(
                      transformativeAssessment?.reusedContentRisk ?? "medium",
                    ),
                  )}
                  variant="outline"
                >
                  Reused-content risk:{" "}
                  {riskLabels[transformativeAssessment?.reusedContentRisk ?? "medium"]}
                </Badge>
              </section>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="render" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
            <section className="space-y-4 rounded-md border border-slate-200 bg-white p-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Render Job
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Local desktop worker endpoint: POST /render-short.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="worker-url">Local worker URL</Label>
                <Input
                  id="worker-url"
                  value={workerUrl}
                  onChange={(event) => setWorkerUrl(event.target.value)}
                  placeholder="http://localhost:8788"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption-mode">Caption mode</Label>
                <Select value={captionMode} onValueChange={setCaptionMode}>
                  <SelectTrigger id="caption-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="burned-in-clean">Burned-in clean</SelectItem>
                    <SelectItem value="burned-in-verbatim">
                      Burned-in verbatim
                    </SelectItem>
                    <SelectItem value="none">No captions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Layout" value="Split" />
                <MiniStat label="Format" value="1080x1920" />
                <MiniStat label="Torch" value="Top" />
                <MiniStat label="Source" value="Bottom" />
              </div>

              <Alert
                className={cn(
                  renderState.status === "error"
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : renderState.status === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-slate-50 text-slate-700",
                )}
              >
                {renderState.status === "error" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : renderState.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Radio className="h-4 w-4" />
                )}
                <AlertTitle>
                  {renderState.status === "success"
                    ? "Worker response"
                    : renderState.status === "error"
                      ? "Local-only fallback"
                      : "Ready"}
                </AlertTitle>
                <AlertDescription>{renderState.message}</AlertDescription>
              </Alert>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={handleSendToWorker}
                  disabled={renderState.status === "sending"}
                  className="flex-1"
                >
                  {renderState.status === "sending" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send to Local Render Worker
                </Button>
                <Button type="button" variant="outline" onClick={handleCopyRenderJob}>
                  <Copy className="h-4 w-4" />
                  {copyState || "Copy JSON"}
                </Button>
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-slate-950 p-4 text-slate-100">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold">Render Job JSON</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Payload includes clip, script, risk flags, caption settings, and worker URL.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setRenderState((current) => ({ ...current }))}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
              <pre className="max-h-[660px] overflow-auto rounded-md bg-black/40 p-4 text-xs leading-5 text-slate-200">
                {renderJobJson}
              </pre>
              {renderState.response ? (
                <div className="mt-4 rounded-md border border-slate-700 bg-black/30 p-3">
                  <div className="mb-2 text-sm font-semibold text-slate-200">
                    Worker detail
                  </div>
                  <pre className="overflow-auto text-xs leading-5 text-slate-300">
                    {JSON.stringify(renderState.response, null, 2)}
                  </pre>
                </div>
              ) : null}
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricPill({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
      <Icon className="h-4 w-4 text-slate-500" />
      <span className="text-slate-500">{label}</span>
      <span className="ml-auto font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function AssessmentStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-slate-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="mt-1 text-lg font-semibold text-slate-950">{value}</div>
      </div>
    </div>
  );
}
