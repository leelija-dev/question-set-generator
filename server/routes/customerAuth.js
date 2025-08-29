import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

// REGISTER CUSTOMER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const customerExist = await Customer.findOne({ email });
    if (customerExist) return res.status(400).json({ message: "Customer already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newCustomer = new Customer({ name, email, password: hashedPassword });
    await newCustomer.save();

    res.status(201).json({ message: "Customer registered successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// LOGIN CUSTOMER
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const customer = await Customer.findOne({ email });
    if (!customer) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: customer._id, role: "customer" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Customer login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// you can reuse forgot-password & reset-password here with Customer
export default router;
