import React, { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`http://localhost:5000/api/reset-password/${token}`, { password });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Reset Password</button>
      </form>
      <p>{message}</p>
    </div>
  );
};
export default ResetPassword;
