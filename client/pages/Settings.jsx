import React from 'react';

export default function Settings(){
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>
      <p className="text-sm text-slate-500 mb-6">Application settings and preferences (mocked).</p>
      <div className="bg-white p-6 rounded shadow">
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3">
              <input type="checkbox" />
              <span>Enable email notifications</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3">
              <input type="checkbox" />
              <span>Use dark theme</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
