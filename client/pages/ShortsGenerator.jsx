import React, { useState } from "react";

export default function ShortsGenerator() {
  const [idea, setIdea] = useState("");
  const [script, setScript] = useState("");
  const [message, setMessage] = useState(null);

  const generateMock = () => {
    if (!idea.trim()) {
      setMessage({ type: 'error', text: 'Enter a video idea first.' });
      return;
    }
    setMessage(null);
    setScript(`Hook: ${idea}...\nMain: Explain the idea clearly and concisely.\nCTA: Like and subscribe!`);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Shorts Generator</h2>
      <p className="text-sm text-slate-500 mb-4">Generate short scripts and metadata (mocked).</p>

      {message && <div className={`p-3 mb-4 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message.text}</div>}

      <div className="space-y-3">
        <input value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Enter video idea" className="w-full p-2 border rounded" />
        <div className="flex gap-2">
          <button onClick={generateMock} className="px-4 py-2 bg-blue-600 text-white rounded">Generate</button>
        </div>

        {script && (
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Generated Script</h3>
            <pre className="whitespace-pre-wrap">{script}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
