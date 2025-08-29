import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const router = express.Router();

// ADMIN LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Admin login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ADD NEW ADMIN (only logged-in admin can add)
router.post("/add", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ message: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ name, email, password: hashedPassword });
    await newAdmin.save();

    res.status(201).json({ message: "Admin added successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
