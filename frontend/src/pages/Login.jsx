import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../style/Login.css";

import logo from "../assets/images/logo.png";
import tool from "../assets/images/tool.jpg";
import tools from "../assets/images/tools.jpg";
import service3 from "../assets/images/service3.jpg";

import { apiService } from "../services/apiService";

import {
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

import { showToast } from "../components/ToasterService";

const Login = () => {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ==============================
  // LOGIN FUNCTION
  // ==============================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Login API call
      const response = await apiService.post("/api/auth/login", {
        identifier: identifier.trim(),
        email: identifier.trim(),
        password,
      });

      // Get token and user
      const { token, user } = response.data || response;

      if (!token || !user) {
        throw new Error("Invalid response from server");
      }

      // Save login information
      localStorage.setItem("jwtToken", token);
      localStorage.setItem("userName", user.name || "User");
      localStorage.setItem("userRole", user.role || "staff");
      localStorage.setItem("userEmail", user.email || "");
      localStorage.setItem("userId", user.userId || user._id || user.id || "");
      if (user.designation) {
        localStorage.setItem("userDesignation", user.designation);
      }
      if (user.phone || user.phoneNumber) {
        localStorage.setItem("userPhone", user.phone || user.phoneNumber);
      }

      showToast.success(`Welcome, ${user.name || "User"}!`);

      // ==============================
      // ROLE BASED REDIRECT
      // ==============================
      if (user.role === "staff") {
        // Staff goes directly to Staff Job Cards
        navigate("/staff/job-cards", { replace: true });
      } else {
        // Admin goes to Dashboard
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Login Error:", error);
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Invalid email or password. Please try again.";
      showToast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">

      <div className="login-card">

        {/* LEFT LOGIN FORM */}

        <div className="login-form-section">

          <div className="login-form">

            <div className="welcome-logo">

              <img
                src={logo}
                alt="Bhavani Motors Logo"
                className="logo"
              />

            </div>

            <h2 className="login-title">
              Welcome Back
            </h2>

            <p className="login-subtitle">
              Professional Vehicle Service &
              Repair Management
            </p>

            <form onSubmit={handleSubmit}>

              <label>
                Email Address
              </label>

              <input
                type="email"
                value={identifier}
                onChange={(e) =>
                  setIdentifier(
                    e.target.value
                  )
                }
                placeholder="example@gmail.com"
                required
              />

              <label>
                Password
              </label>

              <div className="password-wrapper">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter Password"
                  required
                />

                <span
                  className="toggle-password"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword ? (
                    <FiEyeOff />
                  ) : (
                    <FiEye />
                  )}
                </span>

              </div>

              <div className="options">

                <a
                  href="/"
                  className="forgot"
                >
                  Forgot Password?
                </a>

              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading
                  ? "Please Wait..."
                  : "Login"}
              </button>

            </form>

          </div>

        </div>

        {/* RIGHT GALLERY */}

        <div className="login-gallery">

          <div className="gallery-card">

            <img
              src={tool}
              alt="Engine Repair"
            />

            <div className="gallery-content">
            </div>

          </div>

          <div className="gallery-card">

            <img
              src={tools}
              alt="Workshop Tools"
            />

            <div className="gallery-content">
            </div>

          </div>

          <div className="gallery-card">

            <img
              src={service3}
              alt="Vehicle Service"
            />

            <div className="gallery-content">
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;