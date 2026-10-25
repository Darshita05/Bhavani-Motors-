import React from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

// Layout
import Layout from "./Layout";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Services from "./pages/Services";
import Items from "./pages/Items";
import JobCards from "./pages/JobCards";
import CreateJobCard from "./pages/CreateJobCard";
import Login from "./pages/Login";
import CustomerDetails from "./pages/CustomerDetails";
import ServiceDetails from "./pages/ServiceDetails";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import JobCardDetails from "./pages/JobCardDetails";
import Staff from "./pages/Staff";
// Staff Job Cards Page (Direct Staff Portal)
import StaffJobCards from "./pages/StaffJobCards";

// Context
import { LoadingProvider } from "./context/LoadingContext";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

// Toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <LoadingProvider>
      <Router>

        <Routes>

          {/* =========================================
              PUBLIC ROUTES
          ========================================== */}

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/privacy-policy"
            element={<PrivacyPolicy />}
          />


          {/* =========================================
              ADMIN PANEL
              Uses Layout with Admin Navigation
          ========================================== */}

          <Route element={<Layout />}>

            {/* DASHBOARD */}

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />


            {/* CUSTOMERS */}

            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers/customer-detail/:id"
              element={
                <ProtectedRoute>
                  <CustomerDetails />
                </ProtectedRoute>
              }
            />


            {/* SERVICES */}

            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <Services />
                </ProtectedRoute>
              }
            />

            <Route
              path="/services/service-detail/:id"
              element={
                <ProtectedRoute>
                  <ServiceDetails />
                </ProtectedRoute>
              }
            />


            {/* ITEMS */}

            <Route
              path="/items"
              element={
                <ProtectedRoute>
                  <Items />
                </ProtectedRoute>
              }
            />


            {/* =========================================
                ADMIN JOB CARDS
            ========================================== */}

            {/* Job Cards List */}

            <Route
              path="/job-cards"
              element={
                <ProtectedRoute>
                  <JobCards />
                </ProtectedRoute>
              }
            />


            {/* Create Job Card */}

            <Route
              path="/job-cards/create"
              element={
                <ProtectedRoute>
                  <CreateJobCard />
                </ProtectedRoute>
              }
            />


            {/* Edit Job Card */}

            <Route
              path="/job-cards/edit/:id"
              element={
                <ProtectedRoute>
                  <CreateJobCard />
                </ProtectedRoute>
              }
            />


            {/* Job Card Details */}

            <Route
              path="/job-cards/:id"
              element={
                <ProtectedRoute>
                  <JobCardDetails />
                </ProtectedRoute>
              }
            />


            {/* STAFF MANAGEMENT */}

            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <Staff />
                </ProtectedRoute>
              }
            />

          </Route>


          {/* =========================================
              STAFF PANEL
              
              IMPORTANT:
              This is outside <Layout />
              so Admin Navigation will NOT appear
          ========================================== */}

          <Route
            path="/staff/job-cards"
            element={
              <ProtectedRoute>
                <StaffJobCards />
              </ProtectedRoute>
            }
          />

        </Routes>


        {/* =========================================
            GLOBAL TOAST
        ========================================== */}

        <ToastContainer
          position="top-right"
          autoClose={3000}
          theme="light"
        />

      </Router>
    </LoadingProvider>
  );
}

export default App;