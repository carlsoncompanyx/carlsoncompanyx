import React from 'react';

export default function Metrics(){
  const youtube = { views: 123456, subscribers: 2345, likes: 890 };
  const etsy = { views: 54321, orders: 120, favorites: 34 };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Metrics</h2>
      <p className="text-sm text-slate-500 mb-6">Key performance indicators (mocked).</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded shadow">
          <div className="text-sm text-slate-600">YouTube Views</div>
          <div className="text-2xl font-bold">{youtube.views.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <div className="text-sm text-slate-600">Subscribers</div>
          <div className="text-2xl font-bold">{youtube.subscribers.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <div className="text-sm text-slate-600">Orders</div>
          <div className="text-2xl font-bold">{etsy.orders}</div>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <div className="text-sm text-slate-600">Favorites</div>
          <div className="text-2xl font-bold">{etsy.favorites}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded shadow">YouTube chart placeholder</div>
        <div className="bg-white p-6 rounded shadow">Etsy chart placeholder</div>
      </div>
    </div>
  );
}
