import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Sparkles, Loader2, Save, Search, Wand2, Play } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CHANNELS = [
  { id: "torch-em", name: "Torch Em" },
  { id: "channel-2", name: "Channel 2" },
];

const SEARCH_TOPICS = [
  "Latest Trends",
  "How-To Guides",
  "Product Reviews",
  "Behind The Scenes",
  "Tips & Tricks",
  "Comparison Videos"
];

export default function ShortsGenerator() {
  const queryClient = useQueryClient();

  // State
  const [selectedChannel, setSelectedChannel] = useState(CHANNELS[0].id);
  const [videoIdea, setVideoIdea] = useState("");
  const [keywords, setKeywords] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("energetic");
  const [duration, setDuration] = useState("30");

  // Generated content
  const [generatedScript, setGeneratedScript] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [generatedTags, setGeneratedTags] = useState([]);
  const [thumbnailOptions, setThumbnailOptions] = useState([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState(0);

  // Search functionality
  const [videoSearchQuery, setVideoSearchQuery] = useState("");
  const [videoSearchResults, setVideoSearchResults] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Loading states
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [isSearchingVideos, setIsSearchingVideos] = useState(false);

  const [message, setMessage] = useState(null);

  const saveProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.ContentProject.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_projects'] });
      setMessage({ type: "success", text: "Short saved successfully!" });
    },
  });

  const searchVideos = async () => {
    if (!videoSearchQuery.trim()) return;

    setIsSearchingVideos(true);
    try {
      // Simulate video search results
      const mockResults = [
        { id: "v1", title: `${videoSearchQuery} - Tutorial Part 1`, channel: selectedChannel, views: "125K", thumbnail: "https://placehold.co/320x180/ff0000/ffffff?text=Video+1" },
        { id: "v2", title: `Best ${videoSearchQuery} Tips 2025`, channel: selectedChannel, views: "89K", thumbnail: "https://placehold.co/320x180/00ff00/ffffff?text=Video+2" },
        { id: "v3", title: `${videoSearchQuery} Complete Guide`, channel: selectedChannel, views: "210K", thumbnail: "https://placehold.co/320x180/0000ff/ffffff?text=Video+3" },
      ];
      setVideoSearchResults(mockResults);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to search videos." });
    }
    setIsSearchingVideos(false);
  };

  const generateScript = async () => {
    if (!videoIdea.trim()) {
      setMessage({ type: "error", text: "Please enter a video idea!" });
      return;
    }

    setIsGeneratingScript(true);
    setMessage(null);

    try {
      const prompt = `Generate a compelling YouTube Shorts script for: "${videoIdea}"
      
      Requirements:
      - Target Audience: ${targetAudience || 'General'}
      - Tone: ${tone}
      - Duration: ${duration} seconds
      - Keywords to include: ${keywords}
      - Channel: ${CHANNELS.find(c => c.id === selectedChannel)?.name}
      
      Create a script with:
      1. Hook (first 3 seconds - must grab attention immediately)
      2. Main Content (educational/entertaining value)
      3. Call-to-Action (engagement prompt)
      
      Format as a single cohesive script with clear timing notes.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      setGeneratedScript(response);
      setMessage({ type: "success", text: "Script generated successfully!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to generate script. Please try again." });
    }

    setIsGeneratingScript(false);
  };

  const modifyScript = async () => {
    if (!generatedScript) {
      setMessage({ type: "error", text: "Generate a script first!" });
      return;
    }

    setIsGeneratingScript(true);
    try {
      const prompt = `Modify and improve this YouTube Shorts script while keeping the core message:

      Current Script:
      ${generatedScript}
      
      Make it more engaging, add better hooks, and ensure it fits within ${duration} seconds.
      Tone should be: ${tone}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      setGeneratedScript(response);
      setMessage({ type: "success", text: "Script modified successfully!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to modify script." });
    }
    setIsGeneratingScript(false);
  };

  const generateMetadata = async () => {
    if (!generatedScript) {
      setMessage({ type: "error", text: "Generate a script first!" });
      return;
    }

    setIsGeneratingMetadata(true);

    try {
      const prompt = `Based on this YouTube Short script, generate optimized metadata:
      
      Script: ${generatedScript}
      Video Idea: ${videoIdea}
      Keywords: ${keywords}
      
      Generate JSON with:
      - title (max 60 characters, attention-grabbing)
      - description (SEO-optimized, 150-200 characters)
      - tags (array of 10-15 relevant tags)`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            tags: { type: "array", items: { type: "string" } }
          }
        }
      });

      setGeneratedTitle(response.title);
      setGeneratedDescription(response.description);
      setGeneratedTags(response.tags);
      setMessage({ type: "success", text: "Metadata generated successfully!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to generate metadata." });
    }

    setIsGeneratingMetadata(false);
  };

  const generateThumbnails = async () => {
    setIsGeneratingThumbnails(true);

    try {
      // Generate 3 thumbnail concepts
      const mockThumbnails = [
        { url: "https://placehold.co/1280x720/ff6b6b/ffffff?text=Thumbnail+Option+1", concept: "Bold text with vibrant background" },
        { url: "https://placehold.co/1280x720/4ecdc4/ffffff?text=Thumbnail+Option+2", concept: "Eye-catching visual with emoji" },
        { url: "https://placehold.co/1280x720/ffe66d/000000?text=Thumbnail+Option+3", concept: "Minimalist design with key point" }
      ];

      setThumbnailOptions(mockThumbnails);
      setSelectedThumbnail(0);
      setMessage({ type: "success", text: "Thumbnails generated!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to generate thumbnails." });
    }

    setIsGeneratingThumbnails(false);
  };

  const handleSave = () => {
    if (!generatedScript) {
      setMessage({ type: "error", text: "Please generate a script first!" });
      return;
    }

    const selectedThumb = thumbnailOptions[selectedThumbnail];

    saveProjectMutation.mutate({
      title: generatedTitle || videoIdea,
      type: "youtube_short",
      status: "idea",
      description: videoIdea,
      content: JSON.stringify({
        script: generatedScript,
        title: generatedTitle,
        description: generatedDescription,
        tags: generatedTags,
        thumbnail: selectedThumb,
        channel: selectedChannel,
        keywords,
        targetAudience,
        tone,
        duration
      }),
      metadata: {
        channel: selectedChannel,
        tags: generatedTags
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
          Shorts Generator
        </h1>
        <p className="text-slate-600">Create optimized short-form video content with AI assistance.</p>
      </div>

      {message && (
        <Alert className={`${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Inputs */}
        <div className="space-y-6">
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Video className="w-5 h-5" />
                Video Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="channel">Channel</Label>
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(channel => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea">Video Idea / Topic</Label>
                <Textarea
                  id="idea"
                  value={videoIdea}
                  onChange={(e) => setVideoIdea(e.target.value)}
                  placeholder="e.g., 5 productivity hacks for creators..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="productivity, hacks, creators"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="energetic">Energetic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                      <SelectItem value="inspiring">Inspiring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (sec)</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="60">60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience (Optional)</Label>
                <Input
                  id="audience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., content creators, entrepreneurs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={generateScript}
                  disabled={isGeneratingScript || !videoIdea.trim()}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {isGeneratingScript ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>

                <Button
                  onClick={modifyScript}
                  disabled={isGeneratingScript || !generatedScript}
                  variant="outline"
                  className="w-full"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Modify
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Topics */}
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-sm">Quick Topics</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-2">
                {SEARCH_TOPICS.map((topic) => (
                  <Button
                    key={topic}
                    variant="outline"
                    size="sm"
                    onClick={() => setVideoIdea(topic)}
                    className="text-xs"
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Video Search */}
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Search className="w-4 h-4" />
                Search Channel Videos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={videoSearchQuery}
                  onChange={(e) => setVideoSearchQuery(e.target.value)}
                  placeholder="Search videos..."
                  className="flex-1"
                />
                <Button
                  onClick={searchVideos}
                  disabled={isSearchingVideos}
                  size="icon"
                >
                  {isSearchingVideos ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {videoSearchResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {videoSearchResults.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => setSelectedVideo(video)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${selectedVideo?.id === video.id
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                      <p className="text-sm font-medium text-slate-900 line-clamp-2">{video.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{video.views} views</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center - Script */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Generated Script</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {!generatedScript ? (
                <div className="text-center py-12 text-slate-500">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Generate a script to see it here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Textarea
                    value={generatedScript}
                    onChange={(e) => setGeneratedScript(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {generatedScript && (
            <>
              {/* Metadata Section */}
              <Card className="shadow-xl border-0">
                <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                  <CardTitle>Metadata</CardTitle>
                  <Button
                    onClick={generateMetadata}
                    disabled={isGeneratingMetadata}
                    size="sm"
                  >
                    {isGeneratingMetadata ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={generatedTitle}
                      onChange={(e) => setGeneratedTitle(e.target.value)}
                      placeholder="Video title..."
                    />
                    {generatedTitle && (
                      <p className="text-xs text-slate-500">{generatedTitle.length}/60 characters</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={generatedDescription}
                      onChange={(e) => setGeneratedDescription(e.target.value)}
                      placeholder="Video description..."
                      rows={4}
                    />
                  </div>

                  {generatedTags.length > 0 && (
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {generatedTags.map((tag, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Thumbnails */}
              <Card className="shadow-xl border-0">
                <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                  <CardTitle>Thumbnails</CardTitle>
                  <Button
                    onClick={generateThumbnails}
                    disabled={isGeneratingThumbnails}
                    size="sm"
                  >
                    {isGeneratingThumbnails ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  {thumbnailOptions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <p>Click Generate to create thumbnail options</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {thumbnailOptions.map((thumb, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedThumbnail(idx)}
                          className={`cursor-pointer rounded-lg overflow-hidden transition-all ${selectedThumbnail === idx
                              ? 'ring-4 ring-blue-500 scale-105'
                              : 'ring-1 ring-slate-200 hover:ring-2 hover:ring-slate-300'
                            }`}
                        >
                          <img src={thumb.url} alt={`Thumbnail ${idx + 1}`} className="w-full" />
                          <div className="p-2 bg-slate-50">
                            <p className="text-xs text-slate-600 line-clamp-2">{thumb.concept}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saveProjectMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {saveProjectMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Short
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Selected Video Player */}
          {selectedVideo && (
            <Card className="shadow-xl border-0">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  {selectedVideo.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
                  <p className="text-white">Video Player Placeholder</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
