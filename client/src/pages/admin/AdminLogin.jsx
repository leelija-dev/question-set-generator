import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`http://localhost:5000/api/admin/login`, { email, password });
      localStorage.setItem("adminToken", data.token);
      navigate("/admin-dashboard");
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || "Login failed"));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-indigo-100">
      <div className="w-full max-w-md p-10 bg-white rounded-2xl shadow-xl border border-gray-200">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">Admin Login</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Only authorized admins can access this panel.
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;
