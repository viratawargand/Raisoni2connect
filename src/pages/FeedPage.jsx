import React, { useEffect, useState } from "react";
import axios from "axios";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [newText, setNewText] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const getAuthToken = () => localStorage.getItem("token");

  // Create axios instance with auth headers
  const authenticatedAxios = axios.create({
    baseURL: "http://localhost:5000",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  // Load posts
  const load = async () => {
    try {
      const { data } = await authenticatedAxios.get("/api/posts");
      setPosts(data || []);
    } catch (err) {
      console.error("Failed to load posts:", err);
      setError("Could not load posts. Please login again.");
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        // Optionally redirect to login
      }
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create a new post
  const submitPost = async (e) => {
    e.preventDefault();
    if (!newText.trim() && !file) {
      alert("Please enter some content or select a file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", newText);
      if (file) formData.append("file", file);

      const { data } = await authenticatedAxios.post("/api/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNewText("");
      setFile(null);
      setPosts((prev) => [data, ...prev]); // insert new post without reload
    } catch (err) {
      console.error("Post Creation Error:", err);
      setError("Failed to create post. Try again.");
    }
  };

  // Like a post
  const likePost = async (id) => {
    try {
      await authenticatedAxios.post(`/api/posts/${id}/like`);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === id ? { ...p, likes: [...(p.likes || []), "tempUser"] } : p
        )
      );
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  // Comment on a post
  const commentPost = async (id, text) => {
    try {
      const { data } = await authenticatedAxios.post(
        `/api/posts/${id}/comment`,
        { text }
      );
      setPosts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, comments: data.comments } : p))
      );
    } catch (err) {
      console.error("Failed to comment on post:", err);
    }
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
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="mt-2"
        />
        <button
          onClick={submitPost}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Post
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Feed */}
      <div className="mt-6 space-y-4">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">No posts yet.</p>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-xl shadow p-4">
              <div className="font-semibold">
                {post.userId?.name || "Unknown User"}
              </div>
              <div className="text-xs text-gray-500">
                {post.createdAt
                  ? new Date(post.createdAt).toLocaleString()
                  : ""}
              </div>
              <div className="mt-2">{post.content}</div>

              {/* Media Preview */}
              {post.fileUrl && (
                <div className="mt-2">
                  {/\.(jpg|jpeg|png|gif)$/i.test(post.fileUrl) && (
                    <img
                      src={`http://localhost:5000${post.fileUrl}`}
                      alt=""
                      className="mt-2 rounded-lg max-w-full"
                    />
                  )}
                  {/\.(mp4|webm|ogg)$/i.test(post.fileUrl) && (
                    <video controls className="mt-2 rounded-lg max-w-full">
                      <source
                        src={`http://localhost:5000${post.fileUrl}`}
                        type="video/mp4"
                      />
                    </video>
                  )}
                  {/\.(pdf|doc|docx|txt)$/i.test(post.fileUrl) && (
                    <a
                      href={`http://localhost:5000${post.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline mt-2 inline-block"
                    >
                      📄 View Document
                    </a>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 mt-3 text-sm text-gray-600">
                <button onClick={() => likePost(post._id)}>
                  👍 Like ({post.likes?.length || 0})
                </button>
                <button>💬 Comment ({post.comments?.length || 0})</button>
                <button>↗ Share</button>
              </div>

              {/* Comments */}
              <div className="mt-2 space-y-1">
                {post.comments?.map((c, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-semibold">
                      {c.userId?.name || "Unknown User"}
                    </span>
                    : {c.text}
                    <div className="text-xs text-gray-400">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString()
                        : ""}
                    </div>
                  </div>
                ))}
                <input
                  className="w-full border px-2 py-1 mt-2 text-sm rounded"
                  placeholder="Write a comment..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      commentPost(post._id, e.target.value);
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    
  );
}
