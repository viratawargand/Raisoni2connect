import React, { useEffect, useState } from "react";
import api from "../api";
import { FaEdit, FaSave, FaTimes, FaLock, FaCamera, FaHeart, FaComment, FaCalendarAlt, FaUserFriends } from "react-icons/fa";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const regNo = localStorage.getItem("regNo");

  useEffect(() => {
    if (!regNo) return;

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const profileRes = await api.get(`/users/${regNo}`);
        setProfile(profileRes.data);
        setForm(profileRes.data);

        // Fetch posts, events, connections
        const postsRes = await api.get("/posts");
        const eventsRes = await api.get("/events");
        const connectionsRes = await api.get("/connections/all");

        setPosts(postsRes.data.filter(p => p.userId._id === profileRes.data._id));
        setEvents(eventsRes.data.filter(e => e.userId._id === profileRes.data._id));
        setConnections(connectionsRes.data);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [regNo]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setForm({ ...form, avatar: file });
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      for (let key in form) {
        formData.append(key, form[key]);
      }
      const res = await api.put(`/users/${profile._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile(res.data.user);
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  const handlePasswordChange = async () => {
    try {
      await api.put(`/users/${profile._id}/reset-password`, passwordForm);
      alert("Password updated successfully!");
      setPasswordForm({ oldPassword: "", newPassword: "" });
      setShowPasswordForm(false);
    } catch (err) {
      alert("Error resetting password");
    }
  };

  if (loading) {
    return <p className="text-center mt-20 text-gray-500">Loading profile...</p>;
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white shadow-xl rounded-3xl">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative">
          <img
            src={avatarPreview || profile.avatar || "/default-avatar.png"}
            alt="Profile"
            className="w-28 h-28 md:w-32 md:h-32 rounded-full border object-cover"
          />
          {editing && (
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
              <FaCamera />
              <input type="file" className="hidden" onChange={handleAvatarChange} />
            </label>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          <p className="text-gray-600">{profile.regNo}</p>
          <p className="text-gray-600">{profile.email}</p>
          {profile.branch && <p className="text-gray-600">Branch: {profile.branch}</p>}
          {profile.gradYear && <p className="text-gray-600">Batch: {profile.gradYear}</p>}
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 border-b border-gray-300 pb-2">Profile Information</h2>
        {editing ? (
          <div className="space-y-4">
            <input type="text" name="name" value={form.name || ""} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Full Name"/>
            <input type="text" name="mobile" value={form.mobile || ""} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Mobile Number"/>
            <input type="text" name="branch" value={form.branch || ""} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Branch"/>
            <input type="text" name="gradYear" value={form.gradYear || ""} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Graduation Year"/>
            <div className="flex gap-3">
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"><FaSave /> Save</button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"><FaTimes /> Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p><strong>Mobile:</strong> {profile.mobile || "Not set"}</p>
            <p><strong>Branch:</strong> {profile.branch || "Not set"}</p>
            <p><strong>Graduation Year:</strong> {profile.gradYear || "Not set"}</p>
            <button onClick={() => setEditing(true)} className="mt-3 flex items-center gap-2 bg-gray-200 px-5 py-2 rounded-lg hover:bg-gray-300 transition"><FaEdit /> Edit Profile</button>
          </div>
        )}
      </div>

      {/* Security Section */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4 border-b border-gray-300 pb-2">Security</h2>
        {showPasswordForm ? (
          <div className="space-y-4">
            <input type="password" placeholder="Old Password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-red-500"/>
            <input type="password" placeholder="New Password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-red-500"/>
            <div className="flex gap-3">
              <button onClick={handlePasswordChange} className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"><FaLock /> Change Password</button>
              <button onClick={() => setShowPasswordForm(false)} className="flex items-center gap-2 px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"><FaTimes /> Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowPasswordForm(true)} className="flex items-center gap-2 px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"><FaLock /> Reset Password</button>
        )}
      </div>

      {/* Dashboard Sections */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        {/* Posts */}
        <div className="bg-white p-4 shadow-lg rounded-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaHeart /> My Posts</h3>
          {posts.length ? (
            posts.map(post => (
              <div key={post._id} className="mb-3 p-3 border rounded-lg hover:shadow-md transition">
                {post.content || "No content"}
                {post.fileUrl && <img src={post.fileUrl} alt="Post" className="mt-2 w-full rounded-md"/>}
                <div className="mt-1 text-gray-500 text-sm flex gap-3">
                  <span><FaHeart /> {post.likes.length}</span>
                  <span><FaComment /> {post.comments.length}</span>
                </div>
              </div>
            ))
          ) : <p className="text-gray-500">No posts yet.</p>}
        </div>

        {/* Events */}
        <div className="bg-white p-4 shadow-lg rounded-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaCalendarAlt /> My Events</h3>
          {events.length ? (
            events.map(event => (
              <div key={event._id} className="mb-3 p-3 border rounded-lg hover:shadow-md transition">
                <p className="font-semibold">{event.title}</p>
                <p className="text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                <p className="text-gray-600">{event.description}</p>
              </div>
            ))
          ) : <p className="text-gray-500">No events yet.</p>}
        </div>

        {/* Connections */}
        <div className="bg-white p-4 shadow-lg rounded-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaUserFriends /> Connections</h3>
          {connections.length ? (
            connections.map(conn => (
              <div key={conn._id} className="mb-2 p-2 border rounded-md hover:bg-gray-50 transition">
                {conn.name} ({conn.regNo})
              </div>
            ))
          ) : <p className="text-gray-500">No connections yet.</p>}
        </div>
      </div>
    </div>
  );
}
