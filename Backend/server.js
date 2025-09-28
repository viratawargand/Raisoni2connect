// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

dotenv.config();

const app = express();
app.use(express.json());

// ---------- CORS CONFIGURATION ----------
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      // ✅ Allow localhost (dev) and any Vercel subdomain
      if (
        origin.includes("localhost:3000") ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      // ❌ Block other origins
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

// Handle preflight requests
app.options("*", cors());



// ---------- MONGODB CONNECTION ----------
mongoose .connect( "mongodb+srv://viratawargand95:RaisoniConnect@cluster0.e3o9mfy.mongodb.net/studentDB?retryWrites=true&w=majority&appName=Cluster0", { useNewUrlParser: true, useUnifiedTopology: true } ) .then(() => console.log("✅ MongoDB connected to Atlas")) .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ---------- FILE STORAGE ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));

// ---------- SCHEMAS ----------
const userSchema = new mongoose.Schema({
  name: String,
  regNo: String,
  email: String,
  mobile: String,
  password: String,
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // accepted connections
  requests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],   // incoming requests
});
const User = mongoose.model("User", userSchema);

const studentSchema = new mongoose.Schema(
  { Name: String, "Registration Number": String },
  { strict: false }
);
const CS2125 = mongoose.model("CSstudents21-25", studentSchema, "CSstudents21-25");
const CS2226 = mongoose.model("CSstudents22-26", studentSchema, "CSstudents22-26");
const DS2125 = mongoose.model("DSstudents21-25", studentSchema, "DSstudents21-25");
const DS2226 = mongoose.model("DSstudents22-26", studentSchema, "DSstudents22-26");
const studentCollections = [CS2125, CS2226, DS2125, DS2226];


 
// ---------- MESSAGE SCHEMA ----------
const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    reactions: [
      {
        emoji: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

// ---------- POST SCHEMA ----------
const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String },
    fileUrl: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

// Custom validation to ensure at least one of content or fileUrl is present
postSchema.pre('validate', function(next) {
  if (!this.content && !this.fileUrl) {
    next(new Error("Either content or file is required"));
  } else {
    next();
  }
});

const Post = mongoose.model("Post", postSchema);


//  EVENT SCHEMA 
const eventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String, required: true }
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

// ---------- MIDDLEWARE ----------
const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    req.user = decoded; // { id, regNo }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ---------- AUTH ROUTES ----------
// Register
app.post("/api/register", async (req, res) => {
  try {
    const { firstName, lastName, regNo, email, password, confirmPassword, mobile } = req.body;
    if (!firstName || !lastName || !regNo || !email || !password || !confirmPassword)
      return res.status(400).json({ error: "All fields are required" });
    if (password !== confirmPassword) return res.status(400).json({ error: "Passwords do not match" });

    const name = `${firstName} ${lastName}`;

    // whitelist check
    let isWhitelisted = null;
    for (let model of studentCollections) {
      const student = await model.findOne({ "Registration Number": regNo });
      if (student) {
        isWhitelisted = student;
        break;
      }
    }
    if (!isWhitelisted) return res.status(403).json({ message: "Not authorized" });

    const existingUser = await User.findOne({ regNo });
    if (existingUser) return res.status(400).json({ error: "User already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, regNo, email, mobile, password: hashedPassword });
    await newUser.save();

    res.json({ message: "✅ Registration successful" });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { regNo, password } = req.body;
    const user = await User.findOne({ regNo });
    if (!user) return res.status(401).json({ error: "Invalid Registration Number or Password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid Registration Number or Password" });

    const token = jwt.sign({ id: user._id, regNo: user.regNo }, process.env.JWT_SECRET || "secret123", {
      expiresIn: "7d",
    });

    res.json({
      message: "✅ Login successful",
      token,
      user: { id: user._id, name: user.name, regNo: user.regNo, email: user.email, mobile: user.mobile },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------- USERS ----------
// Search users
app.get("/api/users", authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    const q = req.query.q?.trim();
    const filter = q
      ? {
          $and: [
            { _id: { $ne: me._id } },
            { $or: [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }, { regNo: new RegExp(q, "i") }] },
          ],
        }
      : { _id: { $ne: me._id } };

    const users = await User.find(filter).select("name email regNo mobile");
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Connections (all users except me)
app.get("/api/connections", authMiddleware, async (req, res) => {
  try {
    console.log("👉 Authenticated user:", req.user);
    const myId = req.user.id;

    const users = await User.find({ _id: { $ne: myId } }).select("_id name regNo email mobile");

    console.log("👉 Users found:", users.length);

    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching connections:", err);
    res.status(500).json({ error: "Failed to fetch connections" });
  }
});

// Get user by regNo
app.get("/api/users/:regNo", authMiddleware, async (req, res) => {
  try {
    const { regNo } = req.params;
    const user = await User.findOne({ regNo });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- MESSAGES ----------

// Get messages between logged-in user and another user
app.get("/api/messages/:userId", authMiddleware, async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: otherId },
        { sender: otherId, receiver: myId },
      ],
    }).sort({ createdAt: 1 });

    // mark which ones are mine
    const formatted = messages.map((m) => ({
      ...m._doc,
      isMine: m.sender.toString() === myId,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send a message
app.post("/api/messages/:userId", authMiddleware, async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = req.params.userId;
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: "Message text is required" });

    const newMsg = new Message({
      sender: myId,
      receiver: otherId,
      text,
    });

    await newMsg.save();

    res.json({ ...newMsg._doc, isMine: true });
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Delete a message (only if I'm the sender)
app.delete("/api/messages/:userId/:msgId", authMiddleware, async (req, res) => {
  try {
    const myId = req.user.id;
    const { msgId } = req.params;

    const msg = await Message.findById(msgId);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    if (msg.sender.toString() !== myId) {
      return res.status(403).json({ error: "Not authorized to delete this message" });
    }

    await msg.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting message:", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// React to a message
app.post("/api/messages/:userId/:msgId/react", authMiddleware, async (req, res) => {
  try {
    const { msgId } = req.params;
    const { emoji } = req.body;

    const msg = await Message.findById(msgId);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    msg.reactions = msg.reactions || [];
    msg.reactions.push({ emoji, user: req.user.id });

    await msg.save();
    res.json(msg);
  } catch (err) {
    console.error("❌ Error reacting to message:", err);
    res.status(500).json({ error: "Failed to react to message" });
  }
});

// ---------- POSTS ROUTES ----------

// Create Post
app.post("/api/posts", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content && !req.file) return res.status(400).json({ error: "Content or file required" });

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    console.log("📁 File uploaded:", req.file ? req.file.filename : "No file");

    const newPost = new Post({ userId: req.user.id, content: content || "", fileUrl });
    await newPost.save();

    // Populate the user info for response
    await newPost.populate("userId", "name regNo email");

    res.json({ 
      message: "✅ Post created successfully", 
      _id: newPost._id,
      userId: newPost.userId,
      content: newPost.content,
      fileUrl: newPost.fileUrl,
      likes: newPost.likes,
      comments: newPost.comments,
      createdAt: newPost.createdAt
    });
  } catch (error) {
    console.error("❌ Error creating post:", error);
    res.status(500).json({ error: "Failed to create post", details: error.message });
  }
});

// Get Posts
app.get("/api/posts", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("userId", "name regNo email")
      .populate("comments.userId", "name regNo")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error("❌ Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts", details: error.message });
  }
});

// Like Post
app.post("/api/posts/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userId = req.user.id;
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json({ message: "✅ Like updated", likes: post.likes.length });
  } catch (error) {
    console.error("❌ Error liking post:", error);
    res.status(500).json({ error: "Failed to like post", details: error.message });
  }
});

// Comment Post
app.post("/api/posts/:id/comment", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Comment text required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({ userId: req.user.id, text });
    await post.save();

    // Populate the comment user info
    await post.populate("comments.userId", "name regNo");

    res.json({ message: "✅ Comment added", comments: post.comments });
  } catch (error) {
    console.error("❌ Error commenting on post:", error);
    res.status(500).json({ error: "Failed to comment", details: error.message });
  }
});


// Create Event
app.post("/api/events", authMiddleware, async (req, res) => {
  try {
    const { title, date, description } = req.body;
    
    if (!title || !date || !description) {
      return res.status(400).json({ error: "Title, date, and description are required" });
    }

    const newEvent = new Event({
      userId: req.user.id,
      title,
      date: new Date(date),
      description
    });

    await newEvent.save();

    // Populate user info for response
    await newEvent.populate("userId", "name regNo email");

    res.json({
      message: "✅ Event created successfully",
      _id: newEvent._id,
      userId: newEvent.userId,
      title: newEvent.title,
      date: newEvent.date,
      description: newEvent.description,
      createdAt: newEvent.createdAt
    });
  } catch (error) {
    console.error("❌ Error creating event:", error);
    res.status(500).json({ error: "Failed to create event", details: error.message });
  }
});

// Delete Post (only by creator)
app.delete("/api/posts/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }

    await post.deleteOne();
    res.json({ message: "✅ Post deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post", details: error.message });
  }
});


// Get Events
app.get("/api/events", authMiddleware, async (req, res) => {
  try {
    const events = await Event.find()
      .populate("userId", "name regNo email")
      .sort({ date: 1 }); // Sort by date (upcoming events first)
    
    res.json(events);
  } catch (error) {
    console.error("❌ Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events", details: error.message });
  }
});

// Get Event by ID
app.get("/api/events/:id", authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("userId", "name regNo email");
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("❌ Error fetching event:", error);
    res.status(500).json({ error: "Failed to fetch event", details: error.message });
  }
});

// Update Event (only by creator)
app.put("/api/events/:id", authMiddleware, async (req, res) => {
  try {
    const { title, date, description } = req.body;
    
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if user is the creator
    if (event.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this event" });
    }

    // Update fields
    if (title) event.title = title;
    if (date) event.date = new Date(date);
    if (description) event.description = description;

    await event.save();
    await event.populate("userId", "name regNo email");

    res.json({
      message: "✅ Event updated successfully",
      event
    });
  } catch (error) {
    console.error("❌ Error updating event:", error);
    res.status(500).json({ error: "Failed to update event", details: error.message });
  }
});

// Delete Event (only by creator)
app.delete("/api/events/:id", authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if user is the creator
    if (event.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this event" });
    }

    await event.deleteOne();
    res.json({ message: "✅ Event deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting event:", error);
    res.status(500).json({ error: "Failed to delete event", details: error.message });
  }
});

// ---------- CONNECTION REQUESTS ----------
app.post("/api/connections/request/:userId", authMiddleware, async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const toUserId = req.params.userId;

    if (fromUserId === toUserId) {
      return res.status(400).json({ error: "Cannot send request to yourself" });
    }

    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);

    if (!fromUser || !toUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already connected or request sent
    if (fromUser.connections.includes(toUserId)) {
      return res.status(400).json({ error: "Already connected" });
    }

    if (toUser.requests.includes(fromUserId)) {
      return res.status(400).json({ error: "Request already sent" });
    }

    // Add request
    toUser.requests.push(fromUserId);
    await toUser.save();

    res.json({ message: "✅ Connection request sent" });
  } catch (err) {
    console.error("❌ Error sending connection request:", err);
    res.status(500).json({ error: "Failed to send request" });
  }
});

// Accept connection request
app.post("/api/connections/accept/:userId", authMiddleware, async (req, res) => {
  try {
    const myId = req.user.id;
    const requesterId = req.params.userId;

    const me = await User.findById(myId);
    const requester = await User.findById(requesterId);

    if (!me || !requester) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!me.requests.includes(requesterId)) {
      return res.status(400).json({ error: "No request from this user" });
    }

    // Add each other as connections
    me.connections.push(requesterId);
    requester.connections.push(myId);

    // Remove request
    me.requests = me.requests.filter(id => id.toString() !== requesterId);

    await me.save();
    await requester.save();

    res.json({ message: "✅ Connection accepted" });
  } catch (err) {
    console.error("❌ Error accepting connection:", err);
    res.status(500).json({ error: "Failed to accept connection" });
  }
});

// Reject connection request
app.post("/api/connections/reject/:userId", authMiddleware, async (req, res) => {
  try {
    const myId = req.user.id;
    const requesterId = req.params.userId;

    const me = await User.findById(myId);

    if (!me) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!me.requests.includes(requesterId)) {
      return res.status(400).json({ error: "No request from this user" });
    }

    // Remove request
    me.requests = me.requests.filter(id => id.toString() !== requesterId);
    await me.save();

    res.json({ message: "✅ Connection request rejected" });
  } catch (err) {
    console.error("❌ Error rejecting connection:", err);
    res.status(500).json({ error: "Failed to reject request" });
  }
});

// Get incoming connection requests
app.get("/api/connections/requests", authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).populate("requests", "name regNo email");

    res.json(me.requests);
  } catch (err) {
    console.error("❌ Error fetching requests:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// Get all connections
app.get("/api/connections/all", authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).populate("connections", "name regNo email");

    res.json(me.connections);
  } catch (err) {
    console.error("❌ Error fetching connections:", err);
    res.status(500).json({ error: "Failed to fetch connections" });
  }
});



// ---------- START SERVER ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
