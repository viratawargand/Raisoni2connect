// src/pages/EventsPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: "", date: "", description: "" });
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Load events
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/events"); // Remove hardcoded URL, use relative path
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

  // Add or update event
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      
      if (editingEvent) {
        // Update existing event
        const { data } = await api.put(`/events/${editingEvent._id}`, form);
        setEvents((prev) =>
          prev.map((ev) => (ev._id === editingEvent._id ? data.event : ev))
        );
        setSuccess("Event updated successfully!");
        setEditingEvent(null);
      } else {
        // Create new event
        const { data } = await api.post("/events", form);
        setEvents((prev) => [data, ...prev]);
        setSuccess("Event created successfully!");
      }
      
      setForm({ title: "", date: "", description: "" });
    } catch (err) {
      console.error("Failed to save event:", err);
      setError(err.response?.data?.error || "Could not save event. Please try again.");
    }
  };

  // Edit event
  const editEvent = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      date: event.date.split('T')[0], // Format date for input
      description: event.description,
    });
    setError("");
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingEvent(null);
    setForm({ title: "", date: "", description: "" });
    setError("");
  };

  // Delete event
  const deleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    
    try {
      await api.delete(`/events/${eventId}`);
      setEvents((prev) => prev.filter((ev) => ev._id !== eventId));
      setSuccess("Event deleted successfully!");
    } catch (err) {
      console.error("Failed to delete event:", err);
      setError(err.response?.data?.error || "Could not delete event. Please try again.");
    }
  };

  // Check if current user is the event creator
  const isEventCreator = (event) => {
    return event.userId._id === currentUser.id || event.userId === currentUser.id;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isPast = date < now;
    
    return {
      formatted: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      isToday,
      isPast
    };
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Form */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {editingEvent ? "Edit Event" : "Add New Event"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event Title"
              value={form.title}
              required
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              type="date"
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.date}
              required
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <textarea
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Event Description"
            value={form.description}
            required
            rows="3"
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingEvent ? "Update Event" : "Create Event"}
            </button>
            {editingEvent && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-300">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg border border-red-300">
          {error}
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Upcoming Events</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No events found.</p>
            <p className="text-gray-400">Create your first event above!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => {
              const dateInfo = formatDate(event.date);
              return (
                <div
                  key={event._id}
                  className={`bg-white rounded-xl shadow p-4 transition-all hover:shadow-md ${
                    dateInfo.isPast ? 'opacity-75' : ''
                  }`}
                >
                  {/* Event Header */}
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-semibold text-gray-900 flex-1">
                      {event.title}
                    </h4>
                    {isEventCreator(event) && (
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => editEvent(event)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit event"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteEvent(event._id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete event"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div className={`text-sm font-medium mb-2 ${
                    dateInfo.isToday 
                      ? 'text-green-600' 
                      : dateInfo.isPast 
                        ? 'text-gray-500' 
                        : 'text-blue-600'
                  }`}>
                    {dateInfo.isToday && '📅 Today • '}
                    {dateInfo.isPast && !dateInfo.isToday && '📅 Past • '}
                    {!dateInfo.isPast && !dateInfo.isToday && '📅 '}
                    {dateInfo.formatted}
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                    {event.description}
                  </p>

                  {/* Creator Info */}
                  <div className="text-xs text-gray-500 border-t pt-2">
                    Created by: {event.userId?.name || 'Unknown'} ({event.userId?.regNo || 'N/A'})
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}