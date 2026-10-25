import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { useLoading } from "./context/LoadingContext";
import Loading from "./components/Loading";
import logo_img from "./assets/images/logo.png";

import "./Layout.css";

const Layout = () => {
  const location = useLocation();
  const { isLoading } = useLoading();

  const [userName, setUserName] = useState("JD");
  // 3-Lines (Hamburger) open/close control state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );

        const userData = JSON.parse(jsonPayload);
        let initials = "";

        if (userData.name) {
          const nameParts = userData.name.split(" ");
          initials = nameParts
            .map((part) => part.charAt(0))
            .join("")
            .toUpperCase();
        } else if (userData.email) {
          const emailParts = userData.email.split("@")[0].split(".");
          initials = emailParts
            .map((part) => part.charAt(0))
            .join("")
            .toUpperCase();
        }

        if (!initials) {
          initials = "JD";
        }

        setUserName(initials);
      } catch (err) {
        console.error("Error parsing token:", err);
        setUserName("JD");
      }
    }
  }, []);

  // Menu links click hone par dropdown band karne ke liye hook function
  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="app">
      {isLoading && <Loading />}

      {/* Header */}
      <header className="header" id="custom-main-header">
        <div className="top-bar" id="navbar-container">
          
          {/* Left Block */}
          <div className="logo-section" id="nav-left-logo">
            <Link to="/" className="logo" onClick={handleLinkClick}>
              <img
                src={logo_img}
                alt="Bhavani Motors"
                className="logo_img"
              />
            </Link>
            <h2 className="site-title-text">Bhavani Motors</h2>
          </div>

          {/* ⚠️ NEW: Hamburger 3 Lines Toggle Button */}
          <button 
            className={`hamburger-apps ${isMenuOpen ? "open" : ""}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Center Block - Ab dynamic isMenuOpen toggle class control ke sath chalega */}
          <div className={`top-nav-menu ${isMenuOpen ? "mobile-show" : ""}`} id="nav-center-menu">
            <Link
              to="/dashboard"
              className={location.pathname === "/dashboard" ? "menu-active" : ""}
              onClick={handleLinkClick}
            >
              Dashboard
            </Link>
            <Link
              to="/customers"
              className={location.pathname.startsWith("/customers") ? "menu-active" : ""}
              onClick={handleLinkClick}
            >
              Customers
            </Link>
            <Link
              to="/services"
              className={location.pathname.startsWith("/services") ? "menu-active" : ""}
              onClick={handleLinkClick}
            >
              Services
            </Link>
            <Link
              to="/items"
              className={location.pathname.startsWith("/items") ? "menu-active" : ""}
              onClick={handleLinkClick}
            >
              Items
            </Link>
            <Link
    to="/job-cards"
    className={location.pathname.startsWith("/job-cards") ? "menu-active" : ""}
    onClick={handleLinkClick}
  >
    Job Cards
  </Link>
  <Link
  to="/staff"
  className={location.pathname.startsWith("/staff") ? "menu-active" : ""}
  onClick={handleLinkClick}
>
  Staff
</Link>
          </div>

          {/* Right Block */}
          <div className="right-icons" id="nav-right-profile">
            <span className="username">
              {localStorage.getItem("userName") || "Admin"}
            </span>
            <div className="profilebg">{userName}</div>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <div className="main-wrapper">
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;