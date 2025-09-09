// src/pages/NetworkPage.jsx
import React, { useState } from "react";

const demo = [
  { name: "Aarav Kulkarni", branch: "CSE", grad: "2026" },
  { name: "Sneha Sharma", branch: "IT", grad: "2025" },
  { name: "Rohit Patil", branch: "ENTC", grad: "2024" },
];

export default function NetworkPage() {
  const [connections, setConnections] = useState([]);

  const handleConnect = (name) => {
    if (!connections.includes(name)) {
      setConnections([...connections, name]);
      alert(`✅ You are now connected with ${name}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 grid md:grid-cols-3 gap-4">
      {demo.map((p, idx) => (
        <div
          key={p.name + idx}
          className="bg-white rounded-xl shadow p-4 hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <img
              src={`https://i.pravatar.cc/60?u=${p.name}`}
              alt={p.name}
              className="h-12 w-12 rounded-full object-cover"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/60";
              }}
            />
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-gray-600">
                {p.branch} • Batch {p.grad}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleConnect(p.name)}
            disabled={connections.includes(p.name)}
            className={`mt-3 px-3 py-1.5 rounded-lg ${
              connections.includes(p.name)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {connections.includes(p.name) ? "Connected" : "Connect"}
          </button>
        </div>
      ))}
    </div>
  );
}
