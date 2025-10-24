import React, { useState } from "react";

const MOCK_PRODUCTS = [
  { id: 1, name: 'Minimalist Floral Print' },
  { id: 2, name: 'Abstract Geometric Canvas' },
  { id: 3, name: 'Vintage Space Poster' },
];

export default function ProductCreator(){
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Product Creator</h2>
      <p className="text-sm text-slate-500 mb-6">Create and preview product listings (mocked).</p>

      <div className="flex gap-4">
        <div className="w-1/3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="w-full p-2 border rounded mb-3" />
          <div className="space-y-2">
            {filtered.map(p => (
              <div key={p.id} className="p-3 bg-white rounded shadow cursor-pointer" onClick={() => setSelected(p)}>
                {p.name}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {selected ? (
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-semibold text-lg">{selected.name}</h3>
              <p className="text-sm text-slate-500">Example description for {selected.name}.</p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded shadow">Select a product to preview</div>
          )}
        </div>
      </div>
    </div>
  );
}
