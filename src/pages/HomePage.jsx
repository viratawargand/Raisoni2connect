import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaCalendarAlt,
  FaTrophy,
  FaUniversity,
  FaBell,
  FaEnvelope,
  FaUser,
} from "react-icons/fa";
import MessagesDrawer from "../components/MessagesDrawer";
import NotificationsDrawer from "../components/NotificationsDrawer";

export default function HomePage() {
  const [drawer, setDrawer] = useState({ open: false, type: "" });

  const openDrawer = (type) => setDrawer({ open: true, type });
  const closeDrawer = () => setDrawer({ open: false, type: "" });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between px-6 py-3 bg-white shadow">
        <div className="flex items-center space-x-3">
          <img
            src="https://rgicdn.s3.ap-south-1.amazonaws.com/ghrcempune/images/new-theme/logo.png"
            alt="logo"
            className="h-10"
          />
          <span className="text-xl font-bold text-blue-800">RaisoniConnect</span>
        </div>

        <div className="flex space-x-6 items-center text-gray-600">
          <Link to="/Feed" className="flex items-center space-x-1 text-blue-600 font-semibold">
            <FaHome /> <span>Feed</span>
          </Link>

          <Link to="/Network" className="flex items-center space-x-1">
            <FaUsers /> <span>Network</span>
          </Link>

          <Link to="/Events" className="flex items-center space-x-1">
            <FaCalendarAlt /> <span>Events</span>
          </Link>

          <Link to="/Achievements" className="flex items-center space-x-1">
            <FaTrophy /> <span>Achievements</span>
          </Link>

          <Link to="/Campuses" className="flex items-center space-x-1">
            <FaUniversity /> <span>Campuses</span>
          </Link>

          {/* Messages */}
          <div className="relative">
            <button
              onClick={() => openDrawer("messages")}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <FaEnvelope className="text-xl" />
            </button>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => openDrawer("notifications")}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <FaBell className="text-xl" />
            </button>
          </div>

          <Link to="/profile">
            <FaUser className="text-xl" />
          </Link>
        </div>
      </nav>

      {/* Post Box */}
      <div className="max-w-2xl mx-auto my-6 bg-white p-4 rounded-xl shadow">
        <div className="flex items-center space-x-4">
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="User"
            className="w-14 h-14 rounded-full"
          />
          <input
            type="text"
            placeholder="Share your thoughts with the Raisoni community..."
            className="w-full border rounded-md p-2 focus:outline-none"
          />
        </div>
        <div className="flex justify-between items-center mt-3 text-gray-500">
          <span>📷 Photo</span>
          <span>🎥 Video</span>
          <span>📄 Document</span>
          <button className="bg-blue-500 text-white px-4 py-1 rounded-md">
            Post
          </button>
        </div>
      </div>

      {drawer.type === "messages" && (
        <MessagesDrawer open={drawer.open} onClose={closeDrawer} />
      )}

      {drawer.type === "notifications" && (
        <NotificationsDrawer open={drawer.open} onClose={closeDrawer} />
      )}
    </div>
  );
}
