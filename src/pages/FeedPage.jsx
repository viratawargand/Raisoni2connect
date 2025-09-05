import React, { useEffect, useState } from "react";
import api from "../api";
import axios from "axios";

export default function FeedPage({ user }) {
  const [posts, setPosts] = useState([]);
  const [newText, setNewText] = useState("");
  const [file, setFile] = useState(null);

  const load = async () => {
    const { data } = await api.get("/api/posts");
    setPosts(data);
  };

  useEffect(() => {
    load();
  }, []);

const submitPost = async (e) => {
  e.preventDefault();

  try {
    const response = await axios.post("http://localhost:5000/api/register", {
      firstName,
      lastName,
      regNo,
      email,
      mobile,
      password,
      confirmPassword,
    });

    console.log("✅ Registration Success:", response.data);
  } catch (err) {
    console.error("❌ Registration Error:", err.response?.data || err.message);
  }
};


  const likePost = async (id) => {
    const { data } = await api.post(`/api/posts/${id}/like`, {
      user: `${user.firstName} ${user.lastName || ""}`,
    });
    setPosts((p) => p.map((post) => (post._id === id ? data : post)));
  };

  const commentPost = async (id, text) => {
    const { data } = await api.post(`/api/posts/${id}/comment`, {
      user: `${user.firstName} ${user.lastName || ""}`,
      text,
    });
    setPosts((p) => p.map((post) => (post._id === id ? data : post)));
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Create Post */}
      <div className="bg-white rounded-xl shadow p-4">
        <textarea
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Share something..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button
          onClick={submitPost}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Post
        </button>
      </div>

      {/* Feed */}
      <div className="mt-6 space-y-4">
        {posts.map((post) => (
          <div key={post._id} className="bg-white rounded-xl shadow p-4">
            <div className="font-semibold">{post.user}</div>
            <div className="text-xs text-gray-500">
              {new Date(post.createdAt).toLocaleString()}
            </div>
            <div className="mt-2">{post.content}</div>

            {/* Media Preview */}
            {post.fileUrl && (
              <>
                {post.type === "photo" && (
                  <img
                    src={`http://localhost:5000${post.fileUrl}`}
                    alt=""
                    className="mt-2 rounded-lg"
                  />
                )}
                {post.type === "video" && (
                  <video controls className="mt-2 rounded-lg">
                    <source
                      src={`http://localhost:5000${post.fileUrl}`}
                      type="video/mp4"
                    />
                  </video>
                )}
                {post.type === "doc" && (
                  <a
                    href={`http://localhost:5000${post.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline mt-2 inline-block"
                  >
                    📄 View Document
                  </a>
                )}
              </>
            )}

            {/* Actions */}
            <div className="flex gap-4 mt-3 text-sm text-gray-600">
              <button onClick={() => likePost(post._id)}>
                👍 Like ({post.likes.length})
              </button>
              <button>💬 Comment</button>
              <button>↗ Share</button>
            </div>

            {/* Comments */}
            <div className="mt-2 space-y-1">
              {post.comments.map((c, i) => (
                <div key={i} className="text-sm">
                  <span className="font-semibold">{c.user}</span>: {c.text}
                </div>
              ))}
              <input
                className="w-full border px-2 py-1 mt-2 text-sm rounded"
                placeholder="Write a comment..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    commentPost(post._id, e.target.value);
                    e.target.value = "";
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
