import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaHome,
  FaUsers,
  FaCalendarAlt,
  FaTrophy,
  FaUniversity,
  FaBell,
  FaEnvelope,
  FaUser,
  FaPaperclip,
  FaTrash,
} from "react-icons/fa";
import MessagesDrawer from "../components/MessagesDrawer";
import NotificationsDrawer from "../components/NotificationsDrawer";

const API_URL = "https://raisoni2connect-rc.onrender.com/api"; // ✅  base URL
const token = localStorage.getItem("token"); // Store token after login

export default function HomePage() {
  const [drawer, setDrawer] = useState({ open: false, type: "" });
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef();

  const openDrawer = (type) => setDrawer({ open: true, type });
  const closeDrawer = () => setDrawer({ open: false, type: "" });

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
    } catch (err) {
      console.error("Failed to fetch posts", err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handlePost = async () => {
    if (!text.trim() && files.length === 0) return;

    const formData = new FormData();
    formData.append("content", text);
    files.forEach((file) => {
      formData.append("file", file);
    });

    try {
      await axios.post(`${API_URL}/posts`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setText("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = null;
      fetchPosts(); // Refresh posts
    } catch (err) {
      console.error("Failed to post", err);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPosts();
    } catch (err) {
      console.error("Failed to delete post", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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

          <div className="relative">
            <button
              onClick={() => openDrawer("messages")}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <FaEnvelope className="text-xl" />
            </button>
          </div>

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
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="flex justify-between items-center mt-3 text-gray-500">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer flex items-center gap-1 hover:text-blue-600">
              <FaPaperclip />
              <span>Attach</span>
              <input
                type="file"
                multiple
                accept="image/*,video/*,application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </label>
          </div>
          <button
            onClick={handlePost}
            className="bg-blue-500 text-white px-4 py-1 rounded-md"
          >
            Post
          </button>
        </div>

        {/* File Previews */}
        {files.length > 0 && (
          <div className="mt-4 grid gap-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center space-x-2 border rounded p-2">
                {file.type.startsWith("image/") && (
                  <img src={URL.createObjectURL(file)} alt={file.name} className="h-12 w-12 object-cover rounded" />
                )}
                {file.type.startsWith("video/") && (
                  <video controls className="h-12 w-12 object-cover rounded">
                    <source src={URL.createObjectURL(file)} type={file.type} />
                  </video>
                )}
                {!file.type.startsWith("image/") && !file.type.startsWith("video/") && (
                  <div className="h-12 w-12 flex items-center justify-center bg-gray-200 rounded">
                    📄
                  </div>
                )}
                <span>{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Posts List */}
      <div className="max-w-2xl mx-auto space-y-4 mb-6">
        {posts.map((post) => (
          <div key={post._id} className="bg-white p-4 rounded-xl shadow relative">
            <div className="flex items-center space-x-4 mb-2">
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="User"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-semibold">{post.userId?.name || "Unknown"}</p>
                <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <p>{post.content}</p>
            {post.fileUrl && (
              <div className="mt-2">
                {post.fileUrl.endsWith(".mp4") || post.fileUrl.endsWith(".webm") ? (
                  <video src={`https://raisoni2connect-rc.onrender.com${post.fileUrl}`} controls className="w-full rounded" />
                ) : post.fileUrl.match(/\.(jpeg|jpg|gif|png)$/) ? (
                  <img src={`https://raisoni2connect-rc.onrender.com${post.fileUrl}`} alt="Attachment" className="w-full rounded" />
                ) : (
                  <a href={`https://raisoni2connect-rc.onrender.com${post.fileUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    📄 {post.fileUrl.split("/").pop()}
                  </a>
                )}
              </div>
            )}
            <button
              onClick={() => handleDelete(post._id)}
              className="absolute top-3 right-3 text-red-500 hover:text-red-700"
            >
              <FaTrash />
            </button>
          </div>
        ))}
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
