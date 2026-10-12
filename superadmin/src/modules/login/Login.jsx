import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Moon, Sun } from "lucide-react";
import "./Login.css";
import { loginUser } from "./login";
import { api } from "../../services/api"; // ✅ IMPORTANT
import RobotHero from "../../assets/Kiddo_HI.png";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light"); // Default to light theme

  const navigate = useNavigate();


  // Initialize theme from localStorage or default to light
  useEffect(() => {
    // 🧹 CLEAR AUTH STATE ON MOUNT
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("adminName");
    api.setToken(null);

    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // ✅ SAFE JWT DECODE (base64url-safe)
  const decodeToken = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier || !password) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      // 🔹 LOGIN API
      const data = await loginUser({
        username: identifier, // Map identifier to username
        password,
      });

      // 🔍 FLEXIBLE TOKEN EXTRACTION
      const token =
        data?.token ||
        data?.data?.token ||
        data?.accessToken;

      if (!token) {
        throw new Error("Invalid login response");
      }

      const payload = decodeToken(token);

      if (!payload?.role) {
        throw new Error("Invalid token payload");
      }

      const normalizedRole = payload.role.toLowerCase();

      // 🔐 STORE AUTH (single source of truth)
      api.setToken(token);
      localStorage.setItem("role", normalizedRole);
      localStorage.setItem("adminName", payload.name || "");

      // 🚀 ROLE-BASED REDIRECT
      if (
        normalizedRole === "super_admin" ||
        normalizedRole === "superadmin"
      ) {
        navigate("/superadmin/dashboard", { replace: true });
      } else if (
        normalizedRole === "school_admin" ||
        normalizedRole === "schooladmin"
      ) {
        navigate("/schooladmin/dashboard", { replace: true });
      } else {
        throw new Error("Unauthorized role");
      }
    } catch (err) {
      const message =
        err?.data?.message ||
        err?.message ||
        "Login failed";

      // 🛑 INACTIVE SCHOOL UX
      if (message.toLowerCase().includes("inactive")) {
        setError(
          "Your account is inactive. Please contact the Administrator."
        );
      } else if (err.status === 401 || message.includes("401")) {
        setError("Invalid credentials. Please check your username and password.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-split">
      {/* LEFT SECTION - FORM */}
      <div className="login-left-section">
        <div className="login-form-container">
          {/* BRANDING */}
          <div className="brand-header-minimal">
            <div className="brand-logo-icon">
              <div className="logo-shape"></div>
            </div>
            <h1 className="brand-text">KiddoShadow</h1>
          </div>

          <div className="welcome-text">
            <h2>Welcome Back</h2>
            <p>Welcome Back, Please enter Your details</p>
          </div>

          <form className="login-form-minimal" onSubmit={handleSubmit}>
            {/* EMAIL/USER */}
            <div className="input-group-minimal">
              <label>Username / Email</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon-min" />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                />
                {identifier && <div className="check-icon">✓</div>}
              </div>
            </div>

            {/* PASSWORD */}
            <div className="input-group-minimal">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon-min" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-pass-min"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* REMOVED REMEMBER ME & EXTRAS */}

            {/* ERROR */}
            {error && <div className="error-min">{error}</div>}

            {/* SUBMIT */}
            <button className="login-btn-minimal" type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Log In"}
            </button>

            {/* REMOVED SIGN UP BUTTON */}

          </form>

          <p className="copyright-text">Powered by AI - from Xtown</p>
        </div>
      </div>

      {/* RIGHT SECTION - HERO */}
      <div className="login-right-section">
        <div className="hero-content-glass">
          <div className="hero-Image-container">
            <img src={RobotHero} alt="AI Assistant" className="robot-hero-img" />
          </div>
        </div>

        {/* Floating Particles */}
        <div className="particle p1"></div>
        <div className="particle p2"></div>
        <div className="particle p3"></div>
      </div>

      {/* THEME TOGGLE (Absolute) */}
      <button
        type="button"
        className="theme-toggle-floating"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
      </button>
    </div>
  );
}
