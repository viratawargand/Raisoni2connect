import React, { useEffect, useState } from "react";
import axios from "axios";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [newText, setNewText] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);

  const getAuthToken = () => localStorage.getItem("token");

  const authenticatedAxios = axios.create({
    baseURL: "http://localhost:5000",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  // Load posts
  const load = async () => {
    try {
      setLoading(true);
      const { data } = await authenticatedAxios.get("/api/posts");
      setPosts(data || []);
      setError("");
    } catch (err) {
      console.error("Failed to load posts:", err);
      setError("Could not load posts. Please login again.");
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle file selection and preview
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    } else {
      setFilePreview(null);
    }
  };

  // Create a new post
  const submitPost = async (e) => {
    e.preventDefault();
    if (!newText.trim() && !file) {
      alert("Please enter some content or select a file");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("content", newText);
      if (file) formData.append("file", file);

      const { data } = await authenticatedAxios.post("/api/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Reset form
      setNewText("");
      setFile(null);
      setFilePreview(null);
      document.getElementById("fileInput").value = "";

      // Add new post to the beginning of the list
      setPosts((prev) => [data, ...prev]);
      setError("");
    } catch (err) {
      console.error("Post Creation Error:", err);
      setError("Failed to create post. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Like a post
  const likePost = async (id) => {
    try {
      const { data } = await authenticatedAxios.post(`/api/posts/${id}/like`);
      
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === id) {
            // Toggle like - if already liked, remove like, otherwise add
            const isLiked = p.likes?.includes(localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : "");
            const newLikesCount = isLiked ? (p.likes?.length || 1) - 1 : (p.likes?.length || 0) + 1;
            return { ...p, likes: { length: newLikesCount } };
          }
          return p;
        })
      );
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  // Comment on a post
  const commentPost = async (id, text) => {
    try {
      const { data } = await authenticatedAxios.post(`/api/posts/${id}/comment`, { text });
      
      setPosts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, comments: data.comments } : p))
      );
    } catch (err) {
      console.error("Failed to comment on post:", err);
    }
  };

  // Get file type for proper display
  const getFileType = (fileUrl) => {
    if (!fileUrl) return null;
    
    const extension = fileUrl.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    } else if (['mp4', 'webm', 'ogg'].includes(extension)) {
      return 'video';
    } else if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) {
      return 'document';
    }
    
    return 'unknown';
  };

  // Render file based on type
  const renderFile = (post) => {
    if (!post.fileUrl) return null;
    
    const fileType = getFileType(post.fileUrl);
    const fullUrl = `http://localhost:5000${post.fileUrl}`;
    
    switch (fileType) {
      case 'image':
        return (
          <img
            src={fullUrl}
            alt="Post attachment"
            className="mt-3 rounded-lg max-w-full max-h-96 object-cover shadow-sm"
            onError={(e) => {
              e.target.style.display = 'none';
              console.error('Failed to load image:', fullUrl);
            }}
          />
        );
        
      case 'video':
        return (
          <video 
            controls 
            className="mt-3 rounded-lg max-w-full max-h-96 shadow-sm"
            onError={(e) => {
              e.target.style.display = 'none';
              console.error('Failed to load video:', fullUrl);
            }}
          >
            <source src={fullUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        );
        
      case 'document':
        return (
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            📄 View Document ({post.fileUrl.split('.').pop().toUpperCase()})
          </a>
        );
        
      default:
        return (
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-3 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            📎 Download File
          </a>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Create Post */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={submitPost}>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="What's on your mind?"
            rows="3"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            disabled={loading}
          />
          
          {/* File Preview */}
          {filePreview && (
            <div className="mt-3 relative">
              <img 
                src={filePreview} 
                alt="Preview" 
                className="max-h-40 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setFilePreview(null);
                  document.getElementById("fileInput").value = "";
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-4">
            <input
              id="fileInput"
              type="file"
              onChange={handleFileChange}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              disabled={loading}
            />
            
            <button
              type="submit"
              disabled={loading || (!newText.trim() && !file)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && posts.length === 0 && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading posts...</p>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-6">
        {posts.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <p className="text-gray-500">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-xl shadow-md p-6">
              {/* Post Header */}
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {post.userId?.name?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="ml-3">
                  <div className="font-semibold text-gray-900">
                    {post.userId?.name || "Unknown User"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {post.userId?.regNo && `${post.userId.regNo} • `}
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleString()
                      : ""}
                  </div>
                </div>
              </div>

              {/* Post Content */}
              {post.content && (
                <div className="mb-4 text-gray-800 whitespace-pre-wrap">
                  {post.content}
                </div>
              )}

              {/* File Attachment */}
              {renderFile(post)}

              {/* Post Actions */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => likePost(post._id)}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  Like ({post.likes?.length || 0})
                </button>
                
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                  </svg>
                  Comment ({post.comments?.length || 0})
                </button>
              </div>

              {/* Comments Section */}
              <div className="mt-4 space-y-3">
                {post.comments?.map((comment, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm">
                        {comment.userId?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <div className="font-semibold text-sm text-gray-900">
                          {comment.userId?.name || "Unknown User"}
                        </div>
                        <div className="text-gray-800">{comment.text}</div>
                      </div>
                      {comment.createdAt && (
                        <div className="text-xs text-gray-500 mt-1 ml-3">
                          {new Date(comment.createdAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Add Comment */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">You</span>
                  </div>
                  <input
                    className="flex-1 border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}