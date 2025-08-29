import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token"); // normal customer token
  if (!token) return <Navigate to="/login" />;
  return children;
}

export default ProtectedRoute;
