import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { apiService } from "../services/apiService";
import { showToast } from "../components/ToasterService";
import logo from "../assets/images/logo.png";
import {
  FiClipboard,
  FiTool,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiPhone,
  FiBox,
  FiFileText,
  FiUser,
  FiLogOut,
  FiRefreshCw,
  FiPlus,
  FiMapPin,
  FiCalendar,
  FiAlertCircle,
  FiCheck,
  FiCheckSquare,
} from "react-icons/fi";

import InvoiceModal from "../components/InvoiceModal";

import "../style/StaffJobCards.css";

const StaffJobCards = () => {
  const navigate = useNavigate();

  const [jobCards, setJobCards] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [workEdits, setWorkEdits] = useState({});
  const [savingWorkId, setSavingWorkId] = useState(null);
  const [updatingOverallStatus, setUpdatingOverallStatus] = useState(false);
  const [showStaffInvoice, setShowStaffInvoice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const jobsPerPage = 6;
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [addingItem, setAddingItem] = useState(false);

  const userName = localStorage.getItem("userName") || "Staff Member";
  const userRole = localStorage.getItem("userRole") || "Staff";
  const userDesignation = localStorage.getItem("userDesignation") || "Technician";

  const staffInitials =
    userName
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "ST";

  // ==========================================
  // FETCH MY ASSIGNED JOBS
  // ==========================================
  const fetchMyJobs = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError("");

      const response = await apiService.get("/api/job-cards/my-jobs");
      const jobs = Array.isArray(response)
        ? response
        : response?.data || response?.jobCards || [];

      setJobCards(jobs);

      // Keep current selected job if still present, else pick first
      if (jobs.length > 0) {
        setSelectedJob((prev) => {
          if (!prev) return jobs[0];
          const matched = jobs.find((j) => j._id === prev._id);
          return matched || jobs[0];
        });
      } else {
        setSelectedJob(null);
      }
    } catch (err) {
      console.error("FETCH MY JOBS FAILED:", err);
      setError(err?.message || "Failed to load your assigned jobs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // FETCH INVENTORY ITEMS
  // ==========================================
  const fetchAvailableItems = async () => {
    try {
      const response = await apiService.get("/api/items/getall?limit=200");
      const items =
        response?.data?.items ||
        response?.items ||
        (Array.isArray(response?.data) ? response.data : []) ||
        [];

      setAvailableItems(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Failed to fetch available items:", err);
      setAvailableItems([]);
    }
  };

  // ==========================================
  // SOCKET & MOUNT LIFECYCLE
  // ==========================================
  useEffect(() => {
    const userId = localStorage.getItem("userId");

    fetchMyJobs();
    fetchAvailableItems();

    if (socket.connected && userId) {
      socket.emit("joinRoom", userId);
    }

    const handleConnect = () => {
      if (userId) {
        socket.emit("joinRoom", userId);
      }
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, []);

  useEffect(() => {
    const handleJobAssigned = (data) => {
      showToast.info("A new job card has been assigned to you!");
      fetchMyJobs(true);
    };

    const handleJobRemoved = (data) => {
      showToast.warn("A job assignment was updated or removed.");
      fetchMyJobs(true);
    };

    const handleJobUpdated = (data) => {
      fetchMyJobs(true);
    };

    const handleJobStatusChanged = (data) => {
      fetchMyJobs(true);
    };

    socket.on("jobAssigned", handleJobAssigned);
    socket.on("jobRemoved", handleJobRemoved);
    socket.on("jobUpdated", handleJobUpdated);
    socket.on("jobCardUpdated", handleJobUpdated);
    socket.on("jobStatusChanged", handleJobStatusChanged);

    return () => {
      socket.off("jobAssigned", handleJobAssigned);
      socket.off("jobRemoved", handleJobRemoved);
      socket.off("jobUpdated", handleJobUpdated);
      socket.off("jobCardUpdated", handleJobUpdated);
      socket.off("jobStatusChanged", handleJobStatusChanged);
    };
  }, []);

  // ==========================================
  // ADD ITEM / PART
  // ==========================================
  const handleAddItem = async () => {
    if (!selectedJob) {
      showToast.warn("Please select a job card first");
      return;
    }

    if (!selectedItemId) {
      showToast.warn("Please select an item from the list");
      return;
    }

    if (!itemQuantity || Number(itemQuantity) <= 0) {
      showToast.warn("Quantity must be greater than 0");
      return;
    }

    try {
      setAddingItem(true);

      await apiService.post(
        `/api/job-cards/${selectedJob._id}/items`,
        {
          itemId: selectedItemId,
          quantity: Number(itemQuantity),
        }
      );

      showToast.success("Item added successfully");
      setSelectedItemId("");
      setItemQuantity(1);

      await fetchMyJobs(true);
    } catch (error) {
      console.error("ADD ITEM ERROR:", error);
      showToast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to add item to job card"
      );
    } finally {
      setAddingItem(false);
    }
  };

  // ==========================================
  // WORK STATUS CHANGE & SAVE
  // ==========================================
  const handleWorkChange = (work, field, value) => {
    setWorkEdits((prev) => ({
      ...prev,
      [work._id]: {
        status: prev[work._id]?.status ?? work.status ?? "Pending",
        workUpdate: prev[work._id]?.workUpdate ?? work.workUpdate ?? "",
        [field]: value,
      },
    }));
  };

  const handleSaveWorkProgress = async (work) => {
    if (!selectedJob || !work?._id) return;

    const editedWork = workEdits[work._id] || {};
    const payload = {
      status: editedWork.status ?? work.status ?? "Pending",
      workUpdate: editedWork.workUpdate ?? work.workUpdate ?? "",
    };

    try {
      setSavingWorkId(work._id);

      const response = await apiService.patch(
        `/api/job-cards/${selectedJob._id}/work/${work._id}`,
        payload
      );

      const updatedJobCard =
        response?.data?.jobCard ||
        response?.data?.data?.jobCard ||
        response?.jobCard ||
        response?.data;

      if (updatedJobCard && updatedJobCard._id) {
        setSelectedJob(updatedJobCard);
        setJobCards((prev) =>
          prev.map((job) =>
            job._id === updatedJobCard._id ? updatedJobCard : job
          )
        );
      }

      setWorkEdits((prev) => {
        const updated = { ...prev };
        delete updated[work._id];
        return updated;
      });

      await fetchMyJobs(true);
      showToast.success(`Work task updated to "${payload.status}"!`);
    } catch (error) {
      console.error("WORK UPDATE ERROR:", error);
      showToast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update work progress"
      );
    } finally {
      setSavingWorkId(null);
    }
  };

  // ==========================================
  // UPDATE OVERALL JOB STATUS DIRECTLY
  // ==========================================
  const handleUpdateOverallStatus = async (newStatus) => {
    if (!selectedJob) return;

    try {
      setUpdatingOverallStatus(true);
      const res = await apiService.patch(
        `/api/job-cards/${selectedJob._id}/status`,
        { status: newStatus }
      );

      const updatedJobCard = res?.data || res;
      if (updatedJobCard && updatedJobCard._id) {
        setSelectedJob(updatedJobCard);
      }

      await fetchMyJobs(true);
      showToast.success(`Job card status marked as "${newStatus}"!`);
    } catch (err) {
      console.error("Update Overall Status Error:", err);
      showToast.error(err?.message || "Failed to update job card status");
    } finally {
      setUpdatingOverallStatus(false);
    }
  };

  // ==========================================
  // COMPLETE ALL TASKS (1-CLICK FINISH)
  // ==========================================
  const handleCompleteAllTasks = async () => {
    if (!selectedJob) return;

    try {
      setUpdatingOverallStatus(true);

      // Update status of the entire job card to "Completed"
      const res = await apiService.patch(
        `/api/job-cards/${selectedJob._id}/status`,
        { status: "Completed" }
      );

      const updated = res?.data || res;
      if (updated && updated._id) {
        setSelectedJob(updated);
      }

      setWorkEdits({});
      await fetchMyJobs(true);
      showToast.success("All tasks and Job Card marked as Completed!");
    } catch (err) {
      console.error("Complete All Tasks Error:", err);
      showToast.error(err?.message || "Failed to complete all tasks");
    } finally {
      setUpdatingOverallStatus(false);
    }
  };

  // ==========================================
  // FORMAT HELPERS
  // ==========================================
  const formatMoney = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCustomerName = (job) => {
    const firstName = job?.customerId?.firstName || "";
    const lastName = job?.customerId?.lastName || "";
    return `${firstName} ${lastName}`.trim() || "Customer";
  };

  const getVehicleName = (job) => {
    const make = job?.carId?.make || "";
    const model = job?.carId?.model || "";
    return `${make} ${model}`.trim() || "Vehicle";
  };

  // ==========================================
  // STATS
  // ==========================================
  const stats = useMemo(() => {
    return {
      assigned: jobCards.length,
      inProgress: jobCards.filter((job) => job.status === "In Progress").length,
      completed: jobCards.filter((job) => job.status === "Completed").length,
      pending: jobCards.filter((job) => job.status === "Pending").length,
    };
  }, [jobCards]);

  // ==========================================
  // FILTER JOBS
  // ==========================================
  const filteredJobs = useMemo(() => {
    return jobCards.filter((job) => {
      const matchesFilter =
        activeFilter === "All" || job.status === activeFilter;

      const searchText = search.toLowerCase().trim();
      const searchableData = [
        job.jobCardNumber,
        getCustomerName(job),
        getVehicleName(job),
        job.carId?.registrationNo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && searchableData.includes(searchText);
    });
  }, [jobCards, activeFilter, search]);

  // ==========================================
  // PAGINATION
  // ==========================================
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / jobsPerPage));
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = filteredJobs.slice(
    startIndex,
    startIndex + jobsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, search]);

  // ==========================================
  // LOGOUT
  // ==========================================
  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("userDesignation");
    localStorage.removeItem("userPhone");

    showToast.info("Logged out successfully");
    navigate("/login", { replace: true });
  };

  // Find currently selected item for rate auto-calculation
  const selectedItemObj = availableItems.find(
    (it) => it._id === selectedItemId
  );
  const selectedItemRate =
    selectedItemObj?.sellingPrice ||
    selectedItemObj?.price ||
    selectedItemObj?.rate ||
    0;

  // Check if all tasks in selected job are completed
  const areAllTasksDone =
    selectedJob?.workToBeDone &&
    selectedJob.workToBeDone.length > 0 &&
    selectedJob.workToBeDone.every((t) => t.status === "Completed");

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="staff-job-page">
      {/* TOP EXECUTIVE APP BAR */}
      <header className="staff-top-nav">
        <div className="staff-nav-left">
          <div className="staff-nav-brand">
            <img src={logo} alt="Bhavani Motors" className="staff-brand-logo" />
            <div className="staff-brand-text">
              <h2>Bhavani Motors</h2>
              <span className="staff-portal-tag">STAFF WORKSPACE</span>
            </div>
          </div>
        </div>

        <div className="staff-nav-right">
          <div className="staff-user-badge">
            <div className="staff-nav-avatar">{staffInitials}</div>
            <div className="staff-user-info">
              <span className="staff-user-name">{userName}</span>
              <span className="staff-user-role">
                {userDesignation || userRole}
              </span>
            </div>
          </div>

          <button
            type="button"
            className={`staff-nav-btn refresh-btn ${
              refreshing ? "spinning" : ""
            }`}
            onClick={() => fetchMyJobs(true)}
            title="Refresh assigned jobs"
            disabled={refreshing}
          >
            <FiRefreshCw />
            <span className="btn-label">Refresh</span>
          </button>

          <button
            type="button"
            className="staff-nav-btn logout-btn"
            onClick={handleLogout}
            title="Logout of Staff Portal"
          >
            <FiLogOut />
            <span className="btn-label">Logout</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="staff-main-content">
        {/* STATS OVERVIEW CARDS */}
        <div className="staff-stats-grid">
          <div
            className={`staff-stat-card blue ${
              activeFilter === "All" ? "active-stat" : ""
            }`}
            onClick={() => setActiveFilter("All")}
            role="button"
          >
            <div className="staff-stat-icon blue">
              <FiClipboard />
            </div>
            <div className="staff-stat-body">
              <h2>{stats.assigned}</h2>
              <strong>Total Assigned</strong>
              <p>All active work orders</p>
            </div>
          </div>

          <div
            className={`staff-stat-card orange ${
              activeFilter === "In Progress" ? "active-stat" : ""
            }`}
            onClick={() => setActiveFilter("In Progress")}
            role="button"
          >
            <div className="staff-stat-icon orange">
              <FiTool />
            </div>
            <div className="staff-stat-body">
              <h2>{stats.inProgress}</h2>
              <strong>In Progress</strong>
              <p>Under active repair</p>
            </div>
          </div>

          <div
            className={`staff-stat-card purple ${
              activeFilter === "Pending" ? "active-stat" : ""
            }`}
            onClick={() => setActiveFilter("Pending")}
            role="button"
          >
            <div className="staff-stat-icon purple">
              <FiClock />
            </div>
            <div className="staff-stat-body">
              <h2>{stats.pending}</h2>
              <strong>Pending</strong>
              <p>Yet to commence</p>
            </div>
          </div>

          <div
            className={`staff-stat-card green ${
              activeFilter === "Completed" ? "active-stat" : ""
            }`}
            onClick={() => setActiveFilter("Completed")}
            role="button"
          >
            <div className="staff-stat-icon green">
              <FiCheckCircle />
            </div>
            <div className="staff-stat-body">
              <h2>{stats.completed}</h2>
              <strong>Completed</strong>
              <p>Work finished</p>
            </div>
          </div>
        </div>

        {/* WORKSPACE: SIDEBAR LIST & DETAIL VIEW */}
        <div className="staff-job-workspace">
          {/* LEFT SIDEBAR: FILTERS + SEARCH + JOB LIST */}
          <aside className="staff-job-sidebar">
            {/* FILTER TABS */}
            <div className="staff-filter-tabs">
              <button
                className={activeFilter === "All" ? "active" : ""}
                onClick={() => setActiveFilter("All")}
              >
                All ({stats.assigned})
              </button>
              <button
                className={activeFilter === "In Progress" ? "active" : ""}
                onClick={() => setActiveFilter("In Progress")}
              >
                In Progress ({stats.inProgress})
              </button>
              <button
                className={activeFilter === "Pending" ? "active" : ""}
                onClick={() => setActiveFilter("Pending")}
              >
                Pending ({stats.pending})
              </button>
              <button
                className={activeFilter === "Completed" ? "active" : ""}
                onClick={() => setActiveFilter("Completed")}
              >
                Done ({stats.completed})
              </button>
            </div>

            {/* SEARCH BOX */}
            <div className="staff-search-wrapper">
              <div className="staff-search-box">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search Job #, Plate No, Customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearch("")}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* JOB LIST */}
            <div className="staff-job-list">
              {loading ? (
                <div className="staff-loading-state">
                  <div className="spinner"></div>
                  <p>Loading assigned jobs...</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="no-filter-results">
                  <FiAlertCircle />
                  <p>No job cards match your criteria.</p>
                </div>
              ) : (
                paginatedJobs.map((job) => {
                  const isSelected = selectedJob?._id === job._id;
                  const statusClass = (job.status || "Pending")
                    .toLowerCase()
                    .replaceAll(" ", "-");

                  return (
                    <div
                      key={job._id}
                      className={`staff-job-list-card ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => setSelectedJob(job)}
                    >
                      <div className="staff-job-card-top">
                        <span className="job-card-num">
                          {job.jobCardNumber || "JC-N/A"}
                        </span>
                        <span className={`staff-status-badge ${statusClass}`}>
                          {job.status || "Pending"}
                        </span>
                      </div>

                      <div className="staff-job-list-info">
                        <div className="card-row-car">
                          <span className="car-plate-chip">
                            {job.carId?.registrationNo || "No Plate"}
                          </span>
                          <span className="car-model-text">
                            {getVehicleName(job)}
                          </span>
                        </div>

                        <div className="card-row-sub">
                          <p>
                            <FiUser /> {getCustomerName(job)}
                          </p>
                          <p>
                            <FiCalendar /> {formatDate(job.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="staff-job-pagination">
              <div className="staff-showing-count">
                Showing {filteredJobs.length === 0 ? 0 : startIndex + 1}–
                {Math.min(startIndex + jobsPerPage, filteredJobs.length)} of{" "}
                {filteredJobs.length} jobs
              </div>

              {totalPages > 1 && (
                <div className="staff-pagination-controls">
                  <button
                    type="button"
                    className="pagination-nav-btn"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                  >
                    Prev
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((page) => (
                    <button
                      type="button"
                      key={page}
                      className={`pagination-page-btn ${
                        currentPage === page ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="pagination-nav-btn"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT DETAIL SECTION */}
          {selectedJob ? (
            <section className="staff-job-details">
              {/* DETAIL HEADER */}
              <div className="staff-detail-header">
                <div className="staff-job-title">
                  <div className="title-left">
                    <h2>Job Card #{selectedJob.jobCardNumber}</h2>
                    <span className="job-created-date">
                      <FiCalendar /> Assigned:{" "}
                      {formatDate(selectedJob.createdAt)}
                    </span>
                  </div>

                  <div className="header-status-changer">
                    <button
                      type="button"
                      className="staff-inv-preview-btn"
                      onClick={() => setShowStaffInvoice(true)}
                      title="View & Print Job Invoice"
                    >
                      <FiFileText /> Invoice
                    </button>

                    <label className="status-changer-label">
                      Overall Status:
                    </label>
                    <select
                      className={`status-select main-status-dropdown ${
                        (selectedJob.status || "Pending")
                          .toLowerCase()
                          .replaceAll(" ", "-")
                      }`}
                      value={selectedJob.status || "Pending"}
                      onChange={(e) =>
                        handleUpdateOverallStatus(e.target.value)
                      }
                      disabled={updatingOverallStatus}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* OVERVIEW INFO CARDS */}
              <div className="staff-info-cards-grid">
                {/* CUSTOMER CARD */}
                <div className="staff-info-card">
                  <div className="info-card-header">
                    <FiUser className="info-icon customer" />
                    <span>Customer Details</span>
                  </div>
                  <div className="info-card-body">
                    <strong>{getCustomerName(selectedJob)}</strong>
                    {selectedJob.customerId?.phoneNumber && (
                      <p className="phone-line">
                        <FiPhone />
                        <a
                          href={`tel:${selectedJob.customerId.phoneNumber}`}
                          className="tel-link"
                        >
                          {selectedJob.customerId.phoneNumber}
                        </a>
                      </p>
                    )}
                    {selectedJob.customerId?.address && (
                      <p className="sub-line">
                        <FiMapPin /> {selectedJob.customerId.address}
                      </p>
                    )}
                  </div>
                </div>

                {/* VEHICLE CARD */}
                <div className="staff-info-card">
                  <div className="info-card-header">
                    <FiTool className="info-icon vehicle" />
                    <span>Vehicle Info</span>
                  </div>
                  <div className="info-card-body">
                    <span className="plate-badge-large">
                      {selectedJob.carId?.registrationNo || "NO REGISTRATION"}
                    </span>
                    <strong className="vehicle-title">
                      {getVehicleName(selectedJob)}
                    </strong>
                    <div className="vehicle-tags">
                      {selectedJob.carId?.fuelType && (
                        <span className="meta-tag">
                          Fuel: {selectedJob.carId.fuelType}
                        </span>
                      )}
                      {selectedJob.carId?.mileage && (
                        <span className="meta-tag">
                          {selectedJob.carId.mileage} km
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* DELIVERY & TIMELINE CARD */}
                <div className="staff-info-card delivery-card">
                  <div className="info-card-header">
                    <FiClock className="info-icon delivery" />
                    <span>Expected Delivery</span>
                  </div>
                  <div className="info-card-body">
                    <div className="delivery-highlight">
                      {formatDate(selectedJob.expectedDelivery)}
                    </div>
                    <p className="sub-line">
                      Current Status:{" "}
                      <strong
                        className={`status-highlight-text ${(
                          selectedJob.status || "Pending"
                        )
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                      >
                        {selectedJob.status || "Pending"}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* CUSTOMER COMPLAINTS SECTION */}
              <div className="staff-complaint-section">
                <div className="staff-section-title">
                  <FiFileText />
                  <strong>Customer Complaints / Reported Issues</strong>
                </div>

                {selectedJob.complaints && selectedJob.complaints.length > 0 ? (
                  <ul className="complaints-list">
                    {selectedJob.complaints.map((complaint, index) => (
                      <li key={index}>
                        <span className="complaint-dot">•</span>
                        <span>
                          {typeof complaint === "string"
                            ? complaint
                            : complaint?.description ||
                              complaint?.text ||
                              "Issue noted by customer"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="staff-empty-text">
                    No customer complaints recorded for this job.
                  </p>
                )}
              </div>

              {/* WORK TO BE DONE TABLE */}
              <div className="staff-table-section">
                <div className="staff-table-title">
                  <div className="title-left">
                    <FiTool />
                    <strong>Work To Be Done</strong>
                    <span className="badge-counter">
                      ({selectedJob.workToBeDone?.length || 0} Tasks)
                    </span>
                  </div>

                  <div className="title-right-actions">
                    {!areAllTasksDone && (
                      <button
                        type="button"
                        className="complete-all-btn"
                        onClick={handleCompleteAllTasks}
                        disabled={updatingOverallStatus}
                        title="Mark all tasks and job card as Completed"
                      >
                        <FiCheckSquare /> Complete All Tasks
                      </button>
                    )}
                    <span className="table-subtitle-hint">
                      Select status and click Save (✔)
                    </span>
                  </div>
                </div>

                <div className="staff-table-scroll">
                  <table className="staff-work-table">
                    <thead>
                      <tr>
                        <th style={{ width: "30%" }}>Task / Work Description</th>
                        <th style={{ width: "14%" }}>Labour (₹)</th>
                        <th style={{ width: "20%" }}>Status</th>
                        <th style={{ width: "26%" }}>Work Update / Progress</th>
                        <th style={{ width: "10%", textAlign: "center" }}>
                          Save
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedJob.workToBeDone &&
                      selectedJob.workToBeDone.length > 0 ? (
                        selectedJob.workToBeDone.map((work) => {
                          const edited = workEdits[work._id] || {};
                          const currentStatus =
                            edited.status ?? work.status ?? "Pending";
                          const currentUpdate =
                            edited.workUpdate ?? work.workUpdate ?? "";
                          const isSaving = savingWorkId === work._id;
                          const hasUnsavedChanges =
                            edited.status !== undefined ||
                            edited.workUpdate !== undefined;

                          return (
                            <tr
                              key={work._id}
                              className={
                                currentStatus === "Completed"
                                  ? "row-completed"
                                  : hasUnsavedChanges
                                  ? "has-edits"
                                  : ""
                              }
                            >
                              <td>
                                <span className="task-desc">
                                  {work.description || "Task"}
                                </span>
                              </td>

                              <td>
                                <span className="cost-tag">
                                  {formatMoney(work.cost || 0)}
                                </span>
                              </td>

                              <td>
                                <select
                                  className={`status-select ${currentStatus
                                    .toLowerCase()
                                    .replaceAll(" ", "-")}`}
                                  value={currentStatus}
                                  onChange={(e) =>
                                    handleWorkChange(
                                      work,
                                      "status",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Progress">
                                    In Progress
                                  </option>
                                  <option value="Completed">Completed</option>
                                </select>
                              </td>

                              <td>
                                <input
                                  type="text"
                                  className="work-update-input"
                                  value={currentUpdate}
                                  placeholder="e.g., Work completed, tested..."
                                  onChange={(e) =>
                                    handleWorkChange(
                                      work,
                                      "workUpdate",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>

                              <td style={{ textAlign: "center" }}>
                                <button
                                  type="button"
                                  className={`staff-save-btn ${
                                    hasUnsavedChanges
                                      ? "highlight-save"
                                      : currentStatus === "Completed"
                                      ? "saved-completed"
                                      : ""
                                  }`}
                                  onClick={() => handleSaveWorkProgress(work)}
                                  disabled={isSaving}
                                  title="Save this task update"
                                >
                                  {isSaving ? (
                                    <div className="mini-spinner" />
                                  ) : (
                                    <FiCheck />
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="staff-table-empty">
                            No specific tasks assigned by admin yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ITEMS USED (PARTS & CONSUMABLES) */}
              <div className="staff-table-section staff-items-section">
                <div className="staff-table-title">
                  <div className="title-left">
                    <FiBox />
                    <strong>Items & Parts Used</strong>
                    <span className="badge-counter">
                      ({selectedJob.itemsUsed?.length || 0} Added)
                    </span>
                  </div>
                  <span className="table-subtitle-hint">
                    Select inventory part and add to this vehicle
                  </span>
                </div>

                <div className="staff-table-scroll">
                  <table className="staff-items-table">
                    <thead>
                      <tr>
                        <th style={{ width: "35%" }}>Item / Part Name</th>
                        <th style={{ width: "22%" }}>Quantity</th>
                        <th style={{ width: "18%" }}>Rate (₹)</th>
                        <th style={{ width: "15%" }}>Amount (₹)</th>
                        <th style={{ width: "10%", textAlign: "center" }}>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* ALREADY SAVED ITEMS */}
                      {selectedJob.itemsUsed &&
                        selectedJob.itemsUsed.map((item) => {
                          const rate =
                            item.rate ||
                            item.itemId?.sellingPrice ||
                            item.itemId?.price ||
                            0;
                          const amount =
                            item.amount || rate * Number(item.quantity || 0);

                          return (
                            <tr key={item._id} className="saved-item-row">
                              <td>
                                <strong className="item-name-text">
                                  {item.itemId?.itemName ||
                                    item.itemName ||
                                    "Spare Part"}
                                </strong>
                              </td>
                              <td>
                                <span className="item-qty-badge">
                                  {item.quantity} Qty
                                </span>
                              </td>
                              <td>{formatMoney(rate)}</td>
                              <td>
                                <strong className="item-amount-highlight">
                                  {formatMoney(amount)}
                                </strong>
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <span className="item-saved-tag">Saved</span>
                              </td>
                            </tr>
                          );
                        })}

                      {/* ADD NEW PART ROW */}
                      <tr className="staff-new-item-row">
                        <td>
                          <select
                            className="item-select-input"
                            value={selectedItemId}
                            onChange={(e) => setSelectedItemId(e.target.value)}
                          >
                            <option value="">-- Choose Spare Part --</option>
                            {availableItems.map((item) => (
                              <option key={item._id} value={item._id}>
                                {item.itemName}{" "}
                                {item.sellingPrice
                                  ? `(₹${item.sellingPrice})`
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <div className="staff-quantity-control">
                            <button
                              type="button"
                              onClick={() =>
                                setItemQuantity((prev) =>
                                  Math.max(1, Number(prev) - 1)
                                )
                              }
                            >
                              −
                            </button>
                            <span className="qty-number">{itemQuantity}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setItemQuantity((prev) =>
                                  Math.max(1, Number(prev) + 1)
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td>
                          <span className="rate-preview">
                            {formatMoney(selectedItemRate)}
                          </span>
                        </td>

                        <td>
                          <strong className="amount-preview">
                            {formatMoney(
                              selectedItemRate * Number(itemQuantity || 1)
                            )}
                          </strong>
                        </td>

                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="staff-add-item-btn"
                            onClick={handleAddItem}
                            disabled={addingItem || !selectedItemId}
                            title="Add item to job card"
                          >
                            {addingItem ? (
                              <div className="mini-spinner" />
                            ) : (
                              <>
                                <FiPlus /> Add
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ) : (
            <div className="staff-no-selected-job">
              <FiClipboard className="empty-icon" />
              <h3>No Job Card Selected</h3>
              <p>Select a job card from the left sidebar to view details.</p>
            </div>
          )}
        </div>
      </main>

      {/* ================= INVOICE MODAL ================= */}
      <InvoiceModal
        isOpen={showStaffInvoice}
        onClose={() => setShowStaffInvoice(false)}
        jobCard={selectedJob}
      />
    </div>
  );
};

export default StaffJobCards;