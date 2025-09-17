// src/components/TopRightControls.jsx
import React from "react";
import { Bell, MessageSquare } from "lucide-react";

export default function TopRightControls({ onOpenMessages, onOpenNotifications }) {
  return (
    <div className="flex items-center gap-4">
      {/* Messages */}
      <button
        onClick={onOpenMessages}
        className="relative p-2 rounded-full hover:bg-gray-100"
        title="Messages"
      >
        <span className="material-icons">mail</span>
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setOpenNotif((v) => !v)}
          className="relative p-2 rounded-full hover:bg-gray-100"
          title="Notifications"
        >
          <span className="material-icons">notifications</span>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1">
              {unread}
            </span>
          )}
        </button>

        {openNotif && (
          <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-xl p-3 z-50">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Notifications</div>
              <button className="text-sm text-blue-600" onClick={markAll}>
                Mark all read
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y">
              {notifs.length === 0 && (
                <div className="text-sm text-gray-500 p-4">No notifications</div>
              )}
              {notifs.map((n) => (
                <div key={n._id} className="py-2">
                  <div className="text-sm font-medium">{n.title || n.type}</div>
                  <div className="text-sm text-gray-600">{n.body}</div>
                  <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
