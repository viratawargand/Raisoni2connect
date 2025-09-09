// src/pages/EventsPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: "", date: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load events
  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/events");
      setEvents(data || []);
    } catch (err) {
      console.error("Failed to load events:", err);
      setError("Could not load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Add new event
  const addEvent = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/api/events", form);
      setEvents((prev) => [data, ...prev]);
      setForm({ title: "", date: "", description: "" });
    } catch (err) {
      console.error("Failed to add event:", err);
      setError("Could not add event. Please try again.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Form */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Add Event</h2>
        <form onSubmit={addEvent} className="grid md:grid-cols-3 gap-3">
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Title"
            value={form.title}
            required
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            type="date"
            className="border rounded-lg px-3 py-2"
            value={form.date}
            required
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2 md:col-span-3"
            placeholder="Description"
            value={form.description}
            required
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Events List */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <p>No events found. Add one above!</p>
        ) : (
          events.map((ev, i) => (
            <div key={ev._id || i} className="bg-white rounded-xl shadow p-4">
              <div className="text-lg font-semibold">{ev.title}</div>
              <div className="text-sm text-gray-500">
                {new Date(ev.date).toLocaleDateString()}
              </div>
              <p className="mt-2 text-gray-700">{ev.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
