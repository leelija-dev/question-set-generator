import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Import routes
import adminRoutes from "./routes/adminAuth.js";
import customerRoutes from "./routes/customerAuth.js";
import boardsRoutes from "./routes/boards.js";
import classesRoutes from "./routes/classes.js";
import subjectsRoutes from "./routes/subjects.js";
import requestsRoutes from "./routes/requests.js";
import questionsRoutes from "./routes/questions.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log(err));

// ===== Seed Default Admin (optional) =====
import bcrypt from "bcryptjs";
import Admin from "./models/Admin.js";

async function createDefaultAdmin() {
  const adminExists = await Admin.findOne({ email: process.env.DEFAULT_ADMIN_EMAIL });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD, 10);
    const newAdmin = new Admin({ name: "Default Admin", email: process.env.DEFAULT_ADMIN_EMAIL, password: hashedPassword });
    await newAdmin.save();
    console.log("✅ Default admin created");
  }
}
mongoose.connection.once("open", createDefaultAdmin);

// ===== Use Routes =====
app.use("/api/admin", adminRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/boards", boardsRoutes);
app.use("/api/classes", classesRoutes);
app.use("/api/subjects", subjectsRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/questions", questionsRoutes);

// Test route
app.get("/", (req, res) => res.send("Server is running"));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
