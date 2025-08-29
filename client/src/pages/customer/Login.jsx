import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      // Save JWT in localStorage
      localStorage.setItem("token", res.data.token);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Login to your account to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
            />
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200"
          >
            Login
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-4 text-gray-400 text-sm">OR</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* Register Redirect */}
        <p className="text-center text-gray-600 text-sm">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 font-medium hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
