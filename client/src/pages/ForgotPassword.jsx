import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      alert("📩 Reset email sent (check inbox)");
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.message || "Something went wrong"));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-2xl">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Forgot Password
        </h2>
        <p className="text-sm text-center text-gray-500">
          Enter your email and we’ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 mt-1 text-gray-800 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            Send Reset Link
          </button>
        </form>

        {/* Back to login */}
        <p className="text-sm text-center text-gray-600">
          Remembered your password?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
