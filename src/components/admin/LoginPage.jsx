import React, { useState } from "react";

function LoginPage({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

 const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const neumorphicCard =
    "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-3xl p-8 border border-white/50";

  const neumorphicInset =
    "bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-xl px-4 py-3 border border-white/20 outline-none text-slate-700 font-medium text-xs w-full";

  // ================================
  // INPUT CHANGE
  // ================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // ================================
  // DETECT USER ROLE
  // ================================
  const getUserRole = (user) => {
    if (!user) {
      return "";
    }

    const role =
      user.role ||
      user.userRole ||
      user.type ||
      user.accountType ||
      "";

    return String(role).trim().toUpperCase();
  };

  // ================================
  // LOGIN
  // ================================
  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // --------------------------------
      // Clear old session first
      // --------------------------------
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("teacherToken");
      localStorage.removeItem("teacherUser");

      console.log("Sending login request...");

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      console.log("Login HTTP status:", response.status);

      let data;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      console.log("LOGIN RESPONSE:", data);

      // --------------------------------
      // Backend error
      // --------------------------------
      if (!response.ok) {
        setError(
          data?.message ||
            data?.error ||
            `Login failed (${response.status})`,
        );

        return;
      }

      // --------------------------------
      // Backend success check
      // --------------------------------
      if (!data?.success) {
        setError(
          data?.message ||
            "Login failed. Please check your email and password.",
        );

        return;
      }

      // --------------------------------
      // Get token
      // --------------------------------
      const token =
        data?.data?.token ||
        data?.data?.accessToken ||
        data?.token ||
        data?.accessToken;

      if (!token) {
        console.error("Token missing from backend response:", data);

        setError(
          "Login successful, but authentication token was not received from server.",
        );

        return;
      }

      // --------------------------------
      // Get user
      // --------------------------------
      const user =
        data?.data?.user ||
        data?.user ||
        null;

      console.log("Logged in user:", user);

      // --------------------------------
      // Detect role
      // --------------------------------
      const role = getUserRole(user);

      console.log("Detected role:", role);

      // --------------------------------
      // ADMIN
      // --------------------------------
      if (
        role === "ADMIN" ||
        role === "ADMINISTRATOR" ||
        role === "SUPER_ADMIN"
      ) {
        localStorage.setItem("adminToken", token);

        if (user) {
          localStorage.setItem(
            "adminUser",
            JSON.stringify(user),
          );
        }

        console.log("Admin session created.");

        if (typeof onLoginSuccess === "function") {
          onLoginSuccess(user);
        }

        return;
      }

      // --------------------------------
      // TEACHER
      // --------------------------------
      if (
        role === "TEACHER" ||
        role === "STAFF"
      ) {
        localStorage.setItem("teacherToken", token);

        if (user) {
          localStorage.setItem(
            "teacherUser",
            JSON.stringify(user),
          );
        }

        console.log("Teacher session created.");

        if (typeof onLoginSuccess === "function") {
          onLoginSuccess(user);
        }

        return;
      }

      // --------------------------------
      // ROLE NOT FOUND
      // --------------------------------
      console.error(
        "Unknown user role. Backend user object:",
        user,
      );

      setError(
        "Login successful, but your account role could not be detected. Please check the user role in the database.",
      );
    } catch (err) {
      console.error("Backend connection error:", err);

      setError(
        "",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#e0e5ec] p-6 font-sans">
      <div className={`w-full max-w-md ${neumorphicCard}`}>

        {/* HEADER */}
        <div className="text-center mb-8">

          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#e0e5ec] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.8)] flex items-center justify-center text-2xl">
            🔐
          </div>

          <h2 className="text-lg font-black text-slate-800 tracking-wide">
            LocalPro1 Institute
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Management System
          </p>

        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 p-3 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center">
            ⚠️ {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* EMAIL */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className={neumorphicInset}
              placeholder="Enter your email"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className={neumorphicInset}
              placeholder="Enter your password"
            />
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default LoginPage;