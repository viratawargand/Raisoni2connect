// src/components/ChatWindow.jsx
import React, { useEffect, useRef, useState } from "react";
import api from "../api";

const EMOJIS = ["👍","❤️","😂","😮","😢","👏","🔥","🎉","🙏","😁","😊","😎","😡"];

export default function ChatWindow({ conversation, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const bottomRef = useRef(null);

  const me = JSON.parse(localStorage.getItem("user") || "{}");

  const loadMessages = async () => {
    const { data } = await api.get(`/messages/${conversation._id}`);
    setMessages(data);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  useEffect(() => {
    loadMessages();
    // (Optional) poll every 5s; replace with socket.io later
    const id = setInterval(loadMessages, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation._id]);

  const send = async () => {
    if (!text.trim()) return;
    await api.post(`/messages/${conversation._id}`, { content: text });
    setText("");
    loadMessages();
  };

  const toggleReaction = async (messageId, emoji) => {
    await api.post(`/messages/${messageId}/reaction`, { emoji });
    loadMessages();
  };

  const deleteMessage = async (messageId, isMine) => {
    await api.delete(`/messages/${messageId}`);
    loadMessages();
  };

  const headerName = conversation.isGroup
    ? (conversation.name || "Group")
    : (conversation.members || [])
        .filter((m) => m.regNo !== me.regNo)
        .map((m) => m.name || m.regNo)
        .join(", ");

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <button className="md:hidden p-1 rounded hover:bg-gray-100" onClick={onBack}>
            <span className="material-icons">arrow_back</span>
          </button>
          <div className="font-semibold">{headerName}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {messages.map((m) => {
          const isMine = m.sender?.regNo === me.regNo || m.sender?._id === me.id;
          return (
            <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-2xl px-3 py-2 shadow ${isMine ? "bg-blue-600 text-white" : "bg-white"}`}>
                <div className="text-sm whitespace-pre-wrap">{m.content}</div>

                {/* Reactions */}
                {m.reactions?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {m.reactions.map((r, idx) => (
                      <span key={idx} className="text-sm bg-black/5 rounded-full px-2 py-0.5">
                        {r.emoji}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-1 text-xs opacity-70">
                  <div className="flex gap-1">
                    {EMOJIS.slice(0,5).map((e) => (
                      <button key={e} onClick={() => toggleReaction(m._id, e)} title="React">
                        {e}
                      </button>
                    ))}
                  </div>
                  <span>· {new Date(m.createdAt).toLocaleTimeString()}</span>
                  <button onClick={() => deleteMessage(m._id, isMine)} className="ml-2 underline">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded hover:bg-gray-100"
            onClick={() => setShowPicker((v) => !v)}
            title="Emoji"
          >
            <span className="material-icons">insert_emoticon</span>
          </button>
          <input
            className="flex-1 border rounded-xl px-3 py-2"
            placeholder="Write a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl" onClick={send}>
            Send
          </button>
        </div>

        {showPicker && (
          <div className="mt-2 p-2 bg-white border rounded-xl shadow flex flex-wrap gap-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                className="text-xl"
                onClick={() => { setText((t) => t + e); setShowPicker(false); }}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
