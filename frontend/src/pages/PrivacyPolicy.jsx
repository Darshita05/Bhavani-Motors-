import React from "react";
import logo_img from "../assets/images/logo.png";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div>
      <header>
        <div className="logo-container">
          <Link to="/">
            <img src={logo_img} className="logo_img" alt="Logo" />
          </Link>
          <div className="company-name">Bhavani Motors</div>
        </div>
      </header>
      <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px", fontFamily: "Arial, sans-serif", lineHeight: "1.7", color: "#333" }}>
        <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>Privacy Policy</h1>
        <p style={{ marginBottom: "16px" }}>Effective Date: June 14, 2025</p>

        <p style={{ marginBottom: "16px" }}>
          We at <strong>Bhavani Motors</strong> are committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, and safeguard your personal
          information.
        </p>

        <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "8px" }}>1. What Information We Collect</h2>
        <ul style={{ marginBottom: "16px", paddingLeft: "20px" }}>
          <li>Your name, phone number, and contact details</li>
          <li>Vehicle information (make, model, number, service history)</li>
          <li>Photographs of your vehicle for records or reference</li>
        </ul>

        <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "8px" }}>2. How We Use Your Information</h2>
        <ul style={{ marginBottom: "16px", paddingLeft: "20px" }}>
          <li>Maintain your car service records</li>
          <li>Notify you of upcoming service reminders via WhatsApp</li>
          <li>Send vehicle images if required</li>
        </ul>

        <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "8px" }}>3. Data Storage and Security</h2>
        <p style={{ marginBottom: "16px" }}>
          All data is stored securely and accessed only by authorized personnel.
          We do not sell or share your data with third parties.
        </p>

        <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "8px" }}>4. WhatsApp Notifications</h2>
        <p style={{ marginBottom: "16px" }}>
          We send automatic service reminders via WhatsApp on the 43rd and 44th day after
          your last service to help keep your vehicle running smoothly.
        </p>

        <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "8px" }}>5. Your Rights</h2>
        <ul style={{ marginBottom: "16px", paddingLeft: "20px" }}>
          <li>Access or correction to your information</li>
          <li>Deletion of your personal data</li>
        </ul>

        <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "8px" }}>6. Contact Us</h2>
        <p style={{ marginBottom: "16px" }}>
          Email: bhavanimotorsofficial1982@gmail.com <br />
          Phone: +91-9099513131, 91-9099385151
        </p>

        <p style={{ marginBottom: "16px" }}>Thank you for trusting Bhavani Motors Service with your vehicle!</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
