// src/components/NotificationsDrawer.jsx
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../utils/api";

export default function NotificationsDrawer({ open, onClose }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!open) return;

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data || []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed top-0 right-0 w-96 h-full bg-white shadow-xl border-l flex flex-col z-40">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <button onClick={onClose}>
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {notifications.length > 0 ? (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n._id} className="p-2 bg-gray-100 rounded-lg">
                {n.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No notifications found.</p>
        )}
      </div>
    </div>
  );
}
