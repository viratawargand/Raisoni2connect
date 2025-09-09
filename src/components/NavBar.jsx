// src/components/NavBar.jsx
import React, { useState } from "react";
import { Bell, MessageCircle } from "lucide-react";
import MessagesDrawer from "./MessagesDrawer";

export default function NavBar({ user, onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState(null);

  const toggleDrawer = (type) => {
    console.log("Icon clicked:", type); // ✅ Debug log
    setDrawerType(type);
    setDrawerOpen(true);
  };

  return (
    <nav className="w-full bg-white shadow-md p-4 flex justify-between items-center relative z-50">
      {/* Left side - logo or title */}
      <h1 className="text-xl font-bold text-blue-600">MyApp</h1>

      {/* Right side - icons + user */}
      <div className="flex items-center space-x-4">
        {/* Notifications Icon */}
        <button
          onClick={() => toggleDrawer("notifications")}
          className="relative p-2 hover:bg-gray-100 rounded-full z-50"
        >
          <Bell className="w-6 h-6 text-gray-700" />
        </button>

        {/* Messages Icon */}
        <button
          onClick={() => toggleDrawer("messages")}
          className="relative p-2 hover:bg-gray-100 rounded-full z-50"
        >
          <MessageCircle className="w-6 h-6 text-gray-700" />
        </button>

        {/* User Info */}
        <div className="flex items-center space-x-2">
          <span className="font-medium">{user?.name}</span>
          <button
            onClick={onLogout}
            className="px-3 py-1 bg-red-500 text-white rounded-md"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Drawer */}
      <MessagesDrawer
        open={drawerOpen}
        type={drawerType}
        onClose={() => setDrawerOpen(false)}
      />
    </nav>
  );
}
