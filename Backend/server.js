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
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

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
    console.log("👉 Authenticated user:", req.user); // 👈 add this
    const myId = req.user.id;

    const users = await User.find({ _id: { $ne: myId } }).select("_id name regNo email mobile");

    console.log("👉 Users found:", users.length); // 👈 add this

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


// ---------- START SERVER ----------
app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
