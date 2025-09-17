import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUserPlus, FaCheck, FaTimes } from "react-icons/fa";

export default function NetworkPage() {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      const res = await axios.get("https://raisoni2connect.onrender.com/api/connections", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get("https://raisoni2connect.onrender.com/api/connections/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    }
  };

  const fetchConnections = async () => {
    try {
      const res = await axios.get("https://raisoni2connect.onrender.com/api/connections/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConnections(res.data);
    } catch (err) {
      console.error("Failed to fetch connections:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchRequests(), fetchConnections()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const sendRequest = async (userId) => {
    try {
      await axios.post(`https://raisoni2connect.onrender.com/api/connections/request/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Request sent!");
      fetchUsers();
    } catch (err) {
      console.error("Failed to send request:", err);
    }
  };

  const acceptRequest = async (userId) => {
    try {
      await axios.post(`https://raisoni2connect.onrender.com/api/connections/accept/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Request accepted!");
      fetchRequests();
      fetchConnections();
    } catch (err) {
      console.error("Failed to accept request:", err);
    }
  };

  const rejectRequest = async (userId) => {
    try {
      await axios.post(`https://raisoni2connect.onrender.com/api/connections/reject/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("❌ Request rejected!");
      fetchRequests();
    } catch (err) {
      console.error("Failed to reject request:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 text-gray-800">
        <div className="animate-pulse text-xl font-medium">Loading network...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <main className="max-w-6xl mx-auto p-6 space-y-12">
        
        {/* Connection Requests */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-300 pb-2">Connection Requests</h2>
          <div className="space-y-4">
            {requests.length > 0 ? requests.map((req) => (
              <div key={req._id} className="flex justify-between items-center bg-white p-5 rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <img src={`https://i.pravatar.cc/48?u=${req._id}`} alt={req.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h3 className="font-semibold">{req.name}</h3>
                    <p className="text-sm text-gray-500">{req.regNo}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => acceptRequest(req._id)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    <FaCheck /> Accept
                  </button>
                  <button onClick={() => rejectRequest(req._id)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                    <FaTimes /> Reject
                  </button>
                </div>
              </div>
            )) : (
              <p className="text-gray-500">No connection requests at the moment.</p>
            )}
          </div>
        </section>

        {/* All Users */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-300 pb-2">All Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.length > 0 ? users.map((user) => (
              <div key={user._id} className="flex justify-between items-center bg-white p-5 rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <img src={`https://i.pravatar.cc/48?u=${user._id}`} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.regNo}</p>
                  </div>
                </div>
                <button onClick={() => sendRequest(user._id)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <FaUserPlus /> Connect
                </button>
              </div>
            )) : (
              <p className="text-gray-500">No users available.</p>
            )}
          </div>
        </section>

        {/* My Connections */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-300 pb-2">My Connections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {connections.length > 0 ? connections.map((conn) => (
              <div key={conn._id} className="flex items-center gap-4 bg-white p-5 rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1">
                <img src={`https://i.pravatar.cc/48?u=${conn._id}`} alt={conn.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h3 className="font-semibold">{conn.name}</h3>
                  <p className="text-sm text-gray-500">{conn.regNo}</p>
                </div>
              </div>
            )) : (
              <p className="text-gray-500">You have no connections yet.</p>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
