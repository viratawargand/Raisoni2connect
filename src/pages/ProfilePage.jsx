// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import api from "../api";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const regNo = localStorage.getItem("regNo");   // ✅ get regNo safely
    if (!regNo) {
      console.error("⚠️ No regNo found in localStorage");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${regNo}`);
        setProfile(res.data);
        setForm(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, []);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await api.put(`/users/${profile._id}`, form);
      setProfile(res.data.user);
      setEditing(false);
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

if (!profile) {
  return <p className="text-center mt-10">Loading profile...</p>;
}

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-2xl">
      {/* Header */}
      <div className="flex items-center space-x-6">
        <img
          src="/default-avatar.png"
          alt="Profile"
          className="w-24 h-24 rounded-full border"
        />
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-gray-600">{profile.regNo}</p>
          <p className="text-gray-600">{profile.email}</p>
        </div>
      </div>

      {/* Profile Info */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Profile Information</h2>

        {editing ? (
          <div className="space-y-4">
            <input
              type="text"
              name="name"
              value={form.name || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              placeholder="Full Name"
            />
            <input
              type="text"
              name="mobile"
              value={form.mobile || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              placeholder="Mobile Number"
            />
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="ml-2 text-gray-600"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div>
            <p><strong>Mobile:</strong> {profile.mobile || "Not set"}</p>
            <button
              onClick={() => setEditing(true)}
              className="mt-3 bg-gray-200 px-4 py-2 rounded-lg"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Reset Password */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Security</h2>
        {showPasswordForm ? (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Old Password"
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              className="w-full border p-2 rounded"
            />
            <input
              type="password"
              placeholder="New Password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full border p-2 rounded"
            />
            <button
              onClick={handlePasswordChange}
              className="bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Change Password
            </button>
            <button
              onClick={() => setShowPasswordForm(false)}
              className="ml-2 text-gray-600"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Reset Password
          </button>
        )}
      </div>
    </div>
  );
}
