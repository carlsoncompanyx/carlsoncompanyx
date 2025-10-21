import React from "react";

export default function FinancialChart({ title = "Chart" }: { title?: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>

      <div className="w-full overflow-hidden">
        <svg className="w-full h-64" viewBox="0 0 548 300" preserveAspectRatio="none">
          <defs>
            <clipPath id="grid-clip">
              <rect x="65" y="5" width="478" height="236" />
            </clipPath>
          </defs>

          {/* grid horizontal lines */}
          <g stroke="#e6edf3" strokeDasharray="3 3">
            <line x1="65" y1="241" x2="543" y2="241" />
            <line x1="65" y1="182" x2="543" y2="182" />
            <line x1="65" y1="123" x2="543" y2="123" />
            <line x1="65" y1="64" x2="543" y2="64" />
            <line x1="65" y1="5" x2="543" y2="5" />
          </g>

          {/* grid vertical lines */}
          <g stroke="#e6edf3" strokeDasharray="3 3">
            <line x1="65" y1="5" x2="65" y2="241" />
            <line x1="160.6" y1="5" x2="160.6" y2="241" />
            <line x1="256.2" y1="5" x2="256.2" y2="241" />
            <line x1="351.8" y1="5" x2="351.8" y2="241" />
            <line x1="447.4" y1="5" x2="447.4" y2="241" />
            <line x1="543" y1="5" x2="543" y2="241" />
          </g>

          {/* sample lines: revenue (green), expenses (red), profit (blue) */}
          <g clipPath="url(#grid-clip)">
            <path d="M65,241 C96.867,200 128.733,180 160.6,160 C192.467,140 224.333,130 256.2,120 C288.067,110 319.933,100 351.8,90 C383.667,80 415.533,70 447.4,60 C479.267,50 511.133,40 543,30" stroke="#10b981" strokeWidth="3" fill="none" />
            <path d="M65,241 C96.867,230 128.733,220 160.6,210 C192.467,200 224.333,195 256.2,190 C288.067,185 319.933,180 351.8,175 C383.667,170 415.533,165 447.4,160 C479.267,155 511.133,150 543,145" stroke="#ef4444" strokeWidth="3" fill="none" />
            <path d="M65,241 C96.867,220 128.733,205 160.6,195 C192.467,185 224.333,178 256.2,170 C288.067,163 319.933,158 351.8,152 C383.667,148 415.533,144 447.4,140 C479.267,136 511.133,132 543,128" stroke="#3b82f6" strokeWidth="3" fill="none" />

            {/* dots */}
            {[65,160.6,256.2,351.8,447.4,543].map((cx) => (
              <circle key={cx + "g"} cx={cx as number} cy={241} r={4} fill="#10b981" stroke="#10b981" />
            ))}
          </g>
        </svg>

        <div className="mt-3 text-sm text-center text-slate-600">
          <span className="inline-flex items-center gap-2 mr-4"><span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block" /> revenue</span>
          <span className="inline-flex items-center gap-2 mr-4"><span className="w-3 h-3 bg-red-500 rounded-sm inline-block" /> expenses</span>
          <span className="inline-flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" /> profit</span>
        </div>
      </div>
    </div>
  );
}
