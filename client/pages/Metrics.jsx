import React from 'react';

export default function Metrics(){
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Metrics</h2>
      <p className="text-sm text-slate-500 mb-6">Key performance indicators.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">Metric card</div>
        <div className="bg-white p-6 rounded-lg shadow">Metric card</div>
      </div>
    </div>
  );
}
