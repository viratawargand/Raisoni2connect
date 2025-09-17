// src/pages/AchievementsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
  });

  // Get token
  const getAuthToken = () => localStorage.getItem("token");

  // Axios instance
  const api = axios.create({
    baseURL: "https://raisoni2connect.onrender.com",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  // Load achievements
  const load = async () => {
    try {
      const { data } = await api.get("/api/achievements");
      setAchievements(data);
    } catch (err) {
      console.error("❌ Failed to load achievements:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        alert("Session expired. Please log in again.");
        window.location.href = "/login";
      }
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add achievement
  const addAchievement = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/api/achievements", form);
      setAchievements((prev) => [data, ...prev]); // live update
      setForm({ title: "", description: "", date: "" }); // reset form
    } catch (err) {
      console.error("❌ Failed to add achievement:", err.response?.data || err.message);
      alert("Could not save achievement.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Add Achievement Form */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Add Achievement</h2>
        <form onSubmit={addAchievement} className="grid md:grid-cols-3 gap-3">
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            type="date"
            className="border rounded-lg px-3 py-2"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2 md:col-span-1 col-span-3"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Save
          </button>
        </form>
      </div>

      {/* Achievements List */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {achievements.map((a) => (
          <div key={a._id} className="bg-white rounded-xl shadow p-4">
            <div className="text-lg font-semibold">{a.title}</div>
            <div className="text-sm text-gray-500">{a.date}</div>
            <p className="mt-2 text-gray-700">{a.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
