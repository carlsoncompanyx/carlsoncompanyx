import React, { useMemo, useState } from "react";

const INITIAL_VIDEOS = [
  {
    id: "vid1",
    title: "Example Video Title 1",
    views: "1.2M",
    comments: "5k",
  },
  {
    id: "vid2",
    title: "Another Great Video",
    views: "850k",
    comments: "3.2k",
  },
];

export default function ShortsGenerator() {
  const [searchTopics, setSearchTopics] = useState(["", "", "", "", ""]);
  const [videos] = useState(INITIAL_VIDEOS);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [preCommentary, setPreCommentary] = useState("");
  const [postCommentary, setPostCommentary] = useState("");
  const [generatedVideoId, setGeneratedVideoId] = useState("");
  const [outputTitle, setOutputTitle] = useState("");
  const [outputDescription, setOutputDescription] = useState("");
  const [outputThumbnail, setOutputThumbnail] = useState("");
  const [notification, setNotification] = useState(null);

  const selectedVideo = useMemo(
    () => videos.find((video) => video.id === selectedVideoId) ?? null,
    [selectedVideoId, videos],
  );

  const handleTopicChange = (index, value) => {
    setSearchTopics((prev) => prev.map((topic, i) => (i === index ? value : topic)));
  };

  const handleFetchVideos = () => {
    setNotification({
      type: "info",
      text: "Fetching videos is not implemented in this mock interface.",
    });
    console.log("Fetching videos for topics:", searchTopics);
  };

  const handleGenerate = () => {
    if (!selectedVideo) {
      setNotification({ type: "error", text: "Please select a video first." });
      return;
    }

    setNotification({
      type: "success",
      text: "Generated mock short and metadata.",
    });

    setGeneratedVideoId("dQw4w9WgXcQ");
    setOutputTitle(`Short from ${selectedVideo.title}`);
    setOutputDescription(
      `A short clip from "${selectedVideo.title}" with added commentary.`,
    );
    setOutputThumbnail(`https://example.com/thumbnails/${selectedVideo.id}.jpg`);

    console.log("Generating video", {
      videoId: selectedVideo.id,
      startTime,
      endTime,
      preCommentary,
      postCommentary,
    });
  };

  const handlePublish = () => {
    if (!outputTitle.trim()) {
      setNotification({ type: "error", text: "Add a title before publishing." });
      return;
    }

    setNotification({ type: "success", text: "Video is being published!" });
    console.log("Publishing", {
      outputTitle,
      outputDescription,
      outputThumbnail,
    });
  };

  return (
    <div className="min-h-full bg-slate-100 py-10 px-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col rounded-xl bg-white px-6 py-8 shadow-lg lg:px-12">
        <h1 className="text-center text-3xl font-semibold text-slate-700">Shorts Generator</h1>

        {notification && (
          <div
            className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
              notification.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : notification.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            {notification.text}
          </div>
        )}

        <section className="mt-8 space-y-6">
          <div>
            <h2 className="border-b-2 border-slate-100 pb-3 text-xl font-semibold text-slate-600">
              1. Find and Select Video
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {searchTopics.map((topic, index) => (
              <input
                key={index}
                value={topic}
                onChange={(event) => handleTopicChange(index, event.target.value)}
                placeholder={`Search Topic ${index + 1}`}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleFetchVideos}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
            >
              Fetch Videos
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-inner">
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {videos.map((video) => {
                  const isSelected = selectedVideo?.id === video.id;

                  return (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => setSelectedVideoId(video.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-transparent bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <p className="font-semibold">{video.title}</p>
                      <p className="text-sm text-slate-500">
                        Views: {video.views} | Comments: {video.comments}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex h-full min-h-[280px] items-center justify-center rounded-lg bg-black">
              {selectedVideo ? (
                <iframe
                  key={selectedVideo.id}
                  title={selectedVideo.title}
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full rounded-lg"
                />
              ) : (
                <p className="px-6 text-center text-sm text-slate-200">
                  Select a video to preview it here.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <div>
            <h2 className="border-b-2 border-slate-100 pb-3 text-xl font-semibold text-slate-600">
              2. Edit and Add Commentary
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Start Time (seconds)</label>
              <input
                type="number"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                placeholder="e.g., 30"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">End Time (seconds)</label>
              <input
                type="number"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                placeholder="e.g., 60"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Pre-Video Commentary</label>
              <textarea
                value={preCommentary}
                onChange={(event) => setPreCommentary(event.target.value)}
                placeholder="Enter commentary before the video clip..."
                className="h-32 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Post-Video Commentary</label>
              <textarea
                value={postCommentary}
                onChange={(event) => setPostCommentary(event.target.value)}
                placeholder="Enter commentary after the video clip..."
                className="h-32 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
            >
              Generate and Modify
            </button>
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <div>
            <h2 className="border-b-2 border-slate-100 pb-3 text-xl font-semibold text-slate-600">
              3. Finalize and Publish
            </h2>
          </div>

          <div className="flex h-full min-h-[280px] items-center justify-center rounded-lg bg-black">
            {generatedVideoId ? (
              <iframe
                title="Generated video preview"
                src={`https://www.youtube.com/embed/${generatedVideoId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full rounded-lg"
              />
            ) : (
              <p className="px-6 text-center text-sm text-slate-200">
                Generated shorts will appear here after processing.
              </p>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Output Title</label>
              <input
                value={outputTitle}
                onChange={(event) => setOutputTitle(event.target.value)}
                placeholder="Generated Title"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Thumbnail URL</label>
              <input
                value={outputThumbnail}
                onChange={(event) => setOutputThumbnail(event.target.value)}
                placeholder="Generated thumbnail URL"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Output Description</label>
            <textarea
              value={outputDescription}
              onChange={(event) => setOutputDescription(event.target.value)}
              placeholder="Generated description..."
              className="h-32 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="flex flex-wrap gap-3 pb-2">
            <button
              type="button"
              onClick={handlePublish}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
            >
              Publish
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
