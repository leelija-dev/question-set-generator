import { Routes, Route, Navigate } from "react-router-dom";
import "./css/style.css";
import "./charts/ChartjsConfig";

// Pages
import Login from "./pages/customer/Login";
import AdminLogin from "./pages/admin/AdminLogin";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";

// Protected Routes
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

// Layout
import GlobalLayout from "./layouts/GlobalLayouts";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

// Admin Sidebar + generator
import { generateRoutes } from "./utils/generateRoutes";
import { adminSidebarData } from "./data/adminSidebarData";


function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Customer Protected Routes */}
      <Route element={<ProtectedRoute><GlobalLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route path="/admin" element={<AdminProtectedRoute><GlobalLayout /></AdminProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" />} /> {/* Redirect /admin to /admin/dashboard */}
        {generateRoutes(adminSidebarData)}
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;