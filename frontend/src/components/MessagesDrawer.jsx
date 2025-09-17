// src/components/MessagesDrawer.jsx
import React, { useState, useEffect } from "react";
import { X, Trash2, Smile } from "lucide-react";
import api from "../utils/api";
import Picker from "emoji-picker-react";

export default function MessagesDrawer({ open, onClose }) {
  const [connections, setConnections] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  // Fetch all registered users except me
  useEffect(() => {
    if (!open) return;

    const fetchConnections = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/api/connections", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConnections(res.data || []);
      } catch (err) {
        console.error("Error fetching connections:", err);
      }
    };

    fetchConnections();
  }, [open]);

  // Load messages for a selected connection
  const loadChat = async (userId) => {
    try {
      setSelectedChat(userId);
      const token = localStorage.getItem("token");

      // For simplicity, use a pseudo-conversation ID = userId
      const res = await api.get(`/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data || []);
    } catch (err) {
      console.error("Error loading chat:", err);
    }
  };

  // Send a message
  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedChat) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        `/api/messages/${selectedChat}`,
        { text: newMsg },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages([...messages, res.data]);
      setNewMsg("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Delete a message
  const deleteMessage = async (msgId) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/api/messages/${selectedChat}/${msgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(messages.filter((m) => m._id !== msgId));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  // React to a message
  const reactToMessage = async (msgId, emoji) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        `/api/messages/${selectedChat}/${msgId}/react`,
        { emoji },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(
        messages.map((m) => (m._id === msgId ? { ...m, reactions: res.data.reactions } : m))
      );
    } catch (err) {
      console.error("Error reacting to message:", err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed top-0 right-0 w-96 h-full bg-white shadow-xl border-l flex flex-col z-40">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Messages</h2>
        <button onClick={onClose}>
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Connections list */}
        {!selectedChat && (
          <ul className="space-y-2">
            {connections.length > 0 ? (
              connections.map((c) => (
                <li
                  key={c._id}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer"
                  onClick={() => loadChat(c._id)}
                >
                  {c.name} ({c.regNo})
                </li>
              ))
            ) : (
              <p className="text-gray-500">No connections found.</p>
            )}
          </ul>
        )}

        {/* Chat Window */}
        {selectedChat && (
          <div className="flex flex-col h-full">
            <button
              onClick={() => setSelectedChat(null)}
              className="text-blue-600 underline mb-2"
            >
              ← Back to connections
            </button>

            <div className="flex-1 overflow-y-auto space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`p-2 rounded-lg max-w-[70%] relative group ${
                    msg.isMine ? "bg-blue-500 text-white self-end ml-auto" : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {msg.text}

                  {/* Reactions */}
                  <div className="absolute -bottom-6 left-0 hidden group-hover:flex gap-1">
                    {["👍", "❤️", "😂", "🔥"].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => reactToMessage(msg._id, emoji)}
                        className="text-lg hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Show reactions */}
                  {msg.reactions?.map((r, idx) => (
                    <span key={idx} className="absolute -bottom-4 right-2 text-lg">
                      {r.emoji}
                    </span>
                  ))}

                  {/* Delete button */}
                  {msg.isMine && (
                    <button
                      onClick={() => deleteMessage(msg._id)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-center border-t p-2 relative">
              <button onClick={() => setShowEmoji(!showEmoji)} className="mr-2">
                <Smile className="w-6 h-6 text-gray-600" />
              </button>
              {showEmoji && (
                <div className="absolute bottom-12 left-2 z-50">
                  <Picker
                    onEmojiClick={(e, emojiObj) => setNewMsg((prev) => prev + emojiObj.emoji)}
                  />
                </div>
              )}
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border rounded-lg p-2"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-500 text-white px-4 py-1 rounded-md ml-2"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
