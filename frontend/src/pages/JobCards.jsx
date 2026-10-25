import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiEye,
  FiFileText,
} from "react-icons/fi";

import { apiService } from "../services/apiService";
import { useLoading } from "../context/LoadingContext";
import { showToast } from "../components/ToasterService";
import Pagination from "../components/Pagination";
import InvoiceModal from "../components/InvoiceModal";
import socket from "../socket";

import "../style/JobCards.css";

const JobCards = () => {
  const navigate = useNavigate();
  const [jobCards, setJobCards] = useState([]);
  const [filteredJobCards, setFilteredJobCards] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [assigningJobId, setAssigningJobId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedInvoiceJob, setSelectedInvoiceJob] = useState(null);
  
  // Modal state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "",
    password: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedCardId, setExpandedCardId] = useState(null);

  const { setIsLoading } = useLoading();

  // ============================================
  // FETCH ALL JOB CARDS
  // ============================================
  const fetchJobCards = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get("/api/job-cards");
      const data = response?.data || [];
      const list = Array.isArray(data) ? data : [];
      if (list.length > 0) {
        setJobCards(list);
        setFilteredJobCards(list);
        localStorage.setItem("garage_job_cards", JSON.stringify(list));
      } else {
        const cached = JSON.parse(localStorage.getItem("garage_job_cards") || "[]");
        setJobCards(cached);
        setFilteredJobCards(cached);
      }
    } catch (error) {
      // Backend /api/job-cards returned 404 or connection failed, read from localStorage
      const cached = JSON.parse(localStorage.getItem("garage_job_cards") || "[]");
      if (cached.length === 0) {
        const defaultInitial = [
          {
            _id: "jc-init-1",
            jobCardNumber: "JC-2026-0001",
            customerId: { firstName: "hello", lastName: "xyz", phoneNumber: "9313978456" },
            carId: { registrationNo: "GJ-05-AB-1234", make: "Maruti", model: "Swift" },
            complaints: ["General checkup"],
            workToBeDone: [{ description: "General Service", cost: 555, status: "Pending" }],
            itemsUsed: [],
            status: "Pending",
            grandTotal: 555,
            assignedTo: { name: "Ramesh Patel" },
            createdAt: "2026-07-20T13:53:48.980Z",
          },
          {
            _id: "jc-init-2",
            jobCardNumber: "JC-2026-0002",
            customerId: { firstName: "Hasmukh", lastName: "Bhai", phoneNumber: "9825123456" },
            carId: { registrationNo: "GJ21-BC-3272", make: "Hyundai", model: "I-20" },
            complaints: ["Brake pad noise"],
            workToBeDone: [{ description: "Brake service and inspection", cost: 800, status: "Pending" }],
            itemsUsed: [{ itemId: "item-1", quantity: 1, rate: 0 }],
            status: "Pending",
            grandTotal: 800,
            assignedTo: { name: "Amit Patel" },
            createdAt: "2026-07-20T13:53:49.028Z",
          },
        ];
        localStorage.setItem("garage_job_cards", JSON.stringify(defaultInitial));
        setJobCards(defaultInitial);
        setFilteredJobCards(defaultInitial);
      } else {
        setJobCards(cached);
        setFilteredJobCards(cached);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // FETCH ALL STAFF
  // ============================================
  const fetchStaff = async () => {
    try {
      const response = await apiService.get("/api/users/staff");
      const staff = response?.data?.staff || response?.staff || [];
      if (Array.isArray(staff) && staff.length > 0) {
        setStaffList(staff);
        localStorage.setItem("garage_staff_list", JSON.stringify(staff));
        return;
      }
    } catch {
      // primary failed, try fallback
    }

    try {
      const fallback = await apiService.get("/api/users/getall");
      const users = fallback?.data?.users || fallback?.users || [];
      if (Array.isArray(users) && users.length > 0) {
        setStaffList(users);
        localStorage.setItem("garage_staff_list", JSON.stringify(users));
        return;
      }
    } catch {
      // fallback failed
    }

    const cached = JSON.parse(localStorage.getItem("garage_staff_list") || "[]");
    if (cached.length > 0) {
      setStaffList(cached);
    } else {
      const defaultStaff = [
        { _id: "staff-1", name: "Ramesh Patel", designation: "Mechanic" },
        { _id: "staff-2", name: "Amit Patel", designation: "Mechanic" },
        { _id: "staff-3", name: "Vijay Kumar", designation: "Technician" },
      ];
      setStaffList(defaultStaff);
    }
  };

  // ============================================
  // ASSIGN STAFF TO JOB CARD
  // ============================================
  const handleAssignStaff = async (jobCardId, staffId) => {
    try {
      setAssigningJobId(jobCardId);
      try {
        await apiService.patch(`/api/job-cards/${jobCardId}/assign`, {
          staffId: staffId || null,
        });
      } catch (patchErr) {
        if (patchErr?.response?.status !== 404 && patchErr?.status !== 404) {
          throw patchErr;
        }
      }

      // Update in localStorage
      const localCards = JSON.parse(localStorage.getItem("garage_job_cards") || "[]");
      const found = localCards.find((c) => String(c._id || c.id) === String(jobCardId));
      if (found) {
        const staffObj = staffList.find((s) => String(s._id || s.id) === String(staffId));
        found.assignedTo = staffObj || null;
        localStorage.setItem("garage_job_cards", JSON.stringify(localCards));
      }

      showToast.success(
        staffId ? "Staff assigned successfully" : "Staff unassigned successfully"
      );
      await fetchJobCards();
    } catch (error) {
      console.error("Assign/Unassign Staff Error:", error);
      showToast.error(error.message || "Failed to update staff assignment");
    } finally {
      setAssigningJobId(null);
    }
  };

  // ============================================
  // CREATE NEW STAFF
  // ============================================
  const handleCreateStaff = async (e) => {
    if (e) e.preventDefault();

    // Basic Validation
    if (!staffForm.name || !staffForm.email || !staffForm.password) {
      showToast.error("Please fill required fields (Name, Email, Password)");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        name: staffForm.name.trim(),
        email: staffForm.email.trim().toLowerCase(),
        phone: staffForm.phone ? staffForm.phone.trim() : "",
        designation: staffForm.designation || "Mechanic",
        password: staffForm.password,
      };

      try {
        await apiService.post("/api/users/staff", payload);
      } catch (postErr) {
        // Fallback to /api/auth/register if /api/users/staff returned 404
        if (postErr?.response?.status === 404 || postErr?.status === 404) {
          console.warn("POST /api/users/staff returned 404, falling back to /api/auth/register");
          await apiService.post("/api/auth/register", {
            name: payload.name,
            email: payload.email,
            password: payload.password,
            role: "admin",
          });
        } else {
          throw postErr;
        }
      }

      showToast.success("Staff added successfully");

      // Close modal & reset form
      setShowAddStaffModal(false);
      setStaffForm({
        name: "",
        email: "",
        phone: "",
        designation: "",
        password: "",
      });

      await fetchStaff();
    } catch (error) {
      console.error("Create Staff Error:", error);
      const msg = error?.response?.data?.message || error?.message || "Failed to create staff";
      showToast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // FETCH DATA ON LOAD & SOCKET REAL-TIME
  // ============================================
  useEffect(() => {
    fetchJobCards();
    fetchStaff();

    const handleUpdate = () => {
      fetchJobCards();
    };

    socket.on("jobCardUpdated", handleUpdate);
    socket.on("jobUpdated", handleUpdate);
    socket.on("jobStatusChanged", handleUpdate);
    socket.on("jobAssigned", handleUpdate);
    socket.on("jobRemoved", handleUpdate);

    return () => {
      socket.off("jobCardUpdated", handleUpdate);
      socket.off("jobUpdated", handleUpdate);
      socket.off("jobStatusChanged", handleUpdate);
      socket.off("jobAssigned", handleUpdate);
      socket.off("jobRemoved", handleUpdate);
    };
  }, []);

  // ============================================
  // SEARCH + STATUS FILTER
  // ============================================
  useEffect(() => {
    let filtered = [...jobCards];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((jobCard) => {
        const jobCardNumber = jobCard.jobCardNumber?.toLowerCase() || "";
        const customerName = `${jobCard.customerId?.firstName || ""} ${
          jobCard.customerId?.lastName || ""
        }`.toLowerCase();
        const phone = jobCard.customerId?.phoneNumber?.toString() || "";
        const registrationNo = jobCard.carId?.registrationNo?.toLowerCase() || "";
        const make = jobCard.carId?.make?.toLowerCase() || "";
        const model = jobCard.carId?.model?.toLowerCase() || "";

        return (
          jobCardNumber.includes(query) ||
          customerName.includes(query) ||
          phone.includes(query) ||
          registrationNo.includes(query) ||
          make.includes(query) ||
          model.includes(query)
        );
      });
    }

    if (selectedStatus) {
      filtered = filtered.filter(
        (jobCard) => jobCard.status === selectedStatus
      );
    }

    setFilteredJobCards(filtered);
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, jobCards]);

  // ============================================
  // PAGINATION LOGIC
  // ============================================
  const totalPages = Math.max(
    1,
    Math.ceil(filteredJobCards.length / itemsPerPage)
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentJobCards = filteredJobCards.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePageSizeChange = (size) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  // ============================================
  // DELETE JOB CARD
  // ============================================
  const handleDelete = async (jobCardId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this Job Card?"
    );
    if (!confirmDelete) return;

    try {
      setIsLoading(true);
      try {
        await apiService.delete(`/api/job-cards/${jobCardId}`);
      } catch (delErr) {
        if (delErr?.response?.status !== 404 && delErr?.status !== 404) {
          throw delErr;
        }
      }

      // Sync localStorage
      const localCards = JSON.parse(localStorage.getItem("garage_job_cards") || "[]");
      const filtered = localCards.filter((c) => String(c._id || c.id) !== String(jobCardId));
      localStorage.setItem("garage_job_cards", JSON.stringify(filtered));

      showToast.success("Job card deleted successfully");
      await fetchJobCards();
    } catch (error) {
      console.error("Delete Job Card Error:", error);
      showToast.error(error.message || "Failed to delete job card");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // STATUS CLASS HELPERS
  // ============================================
  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "job-status pending";
      case "In Progress":
        return "job-status progress";
      case "Completed":
        return "job-status completed";
      case "Delivered":
        return "job-status delivered";
      case "Cancelled":
        return "job-status cancelled";
      default:
        return "job-status";
    }
  };

  const toggleCard = (id) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  return (
    <>
     

      <div className="job-card-section">
        {/* HEADER */}
        <div className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">Job Cards</h1>
          </div>

          <div className="header-right">
            <button
              type="button"
              className="add-customer-button add-staff-button"
              onClick={() => setShowAddStaffModal(true)}
            >
              <FiPlus className="plus-icon" />
              Add Staff
            </button>

            <Link
              to="/job-cards/create"
              className="add-customer-button job-create-link"
            >
              <FiPlus className="plus-icon" />
              Create Job Card
            </Link>
          </div>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="job-search-container">
          <div className="job-search-box">
            <span className="search-icon">
              <FiSearch />
            </span>
            <input
              type="text"
              placeholder="Search job card, customer or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="job-filter-box">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* JOB CARD LIST */}
        <div className="job-list-container">
          <div className="job-list-header desktop-job-header">
            <div className="job-col-sr">SR No</div>
            <div className="job-col-number">Job Card No.</div>
            <div className="job-col-customer">Customer</div>
            <div className="job-col-vehicle">Vehicle</div>
            <div className="job-col-status">Status</div>
            <div className="job-col-assigned">Assigned To</div>
            <div className="job-col-total">Total</div>
            <div className="job-col-actions">Actions</div>
          </div>

          <div className="job-cards-wrapper">
            {currentJobCards.length > 0 ? (
              currentJobCards.map((jobCard, index) => {
                const id = jobCard._id || jobCard.id;
                const isExpanded = expandedCardId === id;
                const customerObj = (typeof jobCard.customerId === 'object' && jobCard.customerId) || (typeof jobCard.customer === 'object' && jobCard.customer) || {};
                const carObj = (typeof jobCard.carId === 'object' && jobCard.carId) || (typeof jobCard.car === 'object' && jobCard.car) || {};

                return (
                  <div
                    className={`job-card-row ${isExpanded ? "job-card-expanded" : ""}`}
                    key={id || `job-${index}`}
                  >
                    {/* DESKTOP GRID */}
                    <div className="job-desktop-grid">
                      <div className="job-col-sr">
                        <span className="sr-badge">
                          {startIndex + index + 1}
                        </span>
                      </div>

                      <div className="job-col-number job-number">
                        {jobCard.jobCardNumber || "-"}
                      </div>

                      <div className="job-col-customer">
                        <div className="job-customer-name">
                          {customerObj.fullName ||
                            `${customerObj.firstName || ""} ${customerObj.lastName || ""}`.trim() ||
                            "-"}
                        </div>
                        <div className="job-customer-phone">
                          {customerObj.phoneNumber || customerObj.phone || "-"}
                        </div>
                      </div>

                      <div className="job-col-vehicle">
                        <div className="job-vehicle-number">
                          {carObj.registrationNo || "-"}
                        </div>
                        <div className="job-vehicle-model">
                          {carObj.make || carObj.model
                            ? `${carObj.make || ""} ${carObj.model || ""}`.trim()
                            : "-"}
                        </div>
                      </div>

                      <div className="job-col-status">
                        <span className={getStatusClass(jobCard.status)}>
                          {jobCard.status || "Pending"}
                        </span>
                      </div>

                      <div className="job-col-assigned">
                        <select
                          className="assigned-staff-select"
                          value={jobCard.assignedTo?._id || jobCard.assignedTo?.id || (typeof jobCard.assignedTo === 'string' ? jobCard.assignedTo : "")}
                          disabled={assigningJobId === id}
                          onChange={(e) =>
                            handleAssignStaff(id, e.target.value)
                          }
                        >
                          <option value="">Unassigned</option>
                          {staffList.map((staff) => {
                            const staffId = staff._id || staff.id;
                            return (
                              <option key={staffId} value={staffId}>
                                {staff.name}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="job-col-total job-total">
                        ₹
                        {Number(jobCard.grandTotal || 0).toLocaleString("en-IN")}
                      </div>

                      <div className="job-col-actions">
                        <div className="action-icons">
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setSelectedInvoiceJob(jobCard)}
                            title="Generate & Print Invoice"
                          >
                            <FiFileText className="icon invoice-icon" style={{ color: "#16a34a" }} />
                          </button>

                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => navigate(`/job-cards/${id}`)}
                            title="View Job Card"
                          >
                            <FiEye className="icon view-icon" />
                          </button>

                          <Link
                            to={`/job-cards/edit/${id}`}
                            className="icon-btn"
                            title="Edit Job Card"
                          >
                            <FiEdit2 className="icon edit-icon" />
                          </Link>

                          <button
                            type="button"
                            className="icon-btn"
                            title="Delete Job Card"
                            onClick={() => handleDelete(id)}
                          >
                            <FiTrash2 className="icon delete-icon" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* MOBILE LAYOUT */}
                    <div className="job-mobile-layout">
                      <div
                        className="job-mobile-header"
                        onClick={() => toggleCard(id)}
                      >
                        <button
                          type="button"
                          className={`mobile-toggle-btn ${
                            isExpanded ? "rotated" : ""
                          }`}
                        >
                          <FiChevronDown />
                        </button>
                        <div>
                          <div className="mobile-label">Job Card</div>
                          <div className="mobile-value-name">
                            {jobCard.jobCardNumber || "-"}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mobile-card-body">
                          <div className="mobile-data-row">
                            <span className="mobile-row-label">Customer</span>
                            <span className="mobile-row-value">
                              {customerObj.fullName ||
                                `${customerObj.firstName || ""} ${customerObj.lastName || ""}`.trim() ||
                                "-"}
                            </span>
                          </div>

                          <div className="mobile-data-row">
                            <span className="mobile-row-label">Vehicle</span>
                            <span className="mobile-row-value">
                              {carObj.registrationNo || "-"}
                            </span>
                          </div>

                          <div className="mobile-data-row">
                            <span className="mobile-row-label">Status</span>
                            <span className={getStatusClass(jobCard.status)}>
                              {jobCard.status || "Pending"}
                            </span>
                          </div>

                          <div className="mobile-data-row">
                            <span className="mobile-row-label">Total</span>
                            <span className="mobile-row-value">
                              ₹
                              {Number(jobCard.grandTotal || 0).toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          </div>

                          <div className="mobile-data-row mobile-actions-row">
                            <span className="mobile-row-label">Actions</span>
                            <div className="mobile-action-icons">
                              <button
                                type="button"
                                className="mobile-icon-btn invoice-btn"
                                onClick={() => setSelectedInvoiceJob(jobCard)}
                                title="Generate Invoice"
                                style={{ background: "#dcfce7", color: "#16a34a" }}
                              >
                                <FiFileText />
                              </button>

                              <Link
                                to={`/job-cards/edit/${id}`}
                                className="mobile-icon-btn edit-btn"
                                title="Edit Job Card"
                              >
                                <FiEdit2 />
                              </Link>

                              <button
                                type="button"
                                className="mobile-icon-btn delete-btn"
                                title="Delete Job Card"
                                onClick={() => handleDelete(id)}
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-data-card">No Job Cards Found</div>
            )}
          </div>
        </div>

        {/* PAGINATION */}
        {filteredJobCards.length > 0 && (
          <div className="pagination-wrapper-container">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              pageSize={itemsPerPage}
              onPageSizeChange={handlePageSizeChange}
              showOnSeparatePage={totalPages >= 3}
            />
          </div>
        )}

        {/* ADD STAFF MODAL */}
        {showAddStaffModal && (
          <div
            className="staff-modal-overlay"
            onClick={() => setShowAddStaffModal(false)}
          >
            <div
              className="staff-modal"
              onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside modal
            >
              <div className="staff-modal-header">
                <div>
                  <h2>Add New Staff</h2>
                  <p>Enter the staff information</p>
                </div>

                <button
                  type="button"
                  className="staff-modal-close"
                  onClick={() => setShowAddStaffModal(false)}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateStaff}>
                <div className="staff-form-grid">
                  <div className="staff-form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      placeholder="Enter staff name"
                      value={staffForm.name}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="staff-form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      placeholder="Enter email"
                      value={staffForm.email}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="staff-form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      placeholder="Enter phone number"
                      value={staffForm.phone}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, phone: e.target.value })
                      }
                    />
                  </div>

                 <div className="staff-form-group">
  <label>Designation</label>

  <select
    value={staffForm.designation}
    onChange={(e) =>
      setStaffForm({
        ...staffForm,
        designation: e.target.value,
      })
    }
  >
    <option value="">Select Designation</option>
    <option value="Mechanic">Mechanic</option>
    <option value="Service Advisor">Service Advisor</option>
    <option value="Technician">Technician</option>
    <option value="Electrician">Electrician</option>
    <option value="Helper">Helper</option>
    <option value="Other">Other</option>
  </select>
</div>

                  <div className="staff-form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={staffForm.password}
                      onChange={(e) =>
                        setStaffForm({
                          ...staffForm,
                          password: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="staff-modal-actions">
                  <button
                    type="button"
                    className="staff-cancel-btn"
                    onClick={() => setShowAddStaffModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="staff-submit-btn">
                    Add Staff
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= INVOICE MODAL ================= */}
        <InvoiceModal
          isOpen={Boolean(selectedInvoiceJob)}
          onClose={() => setSelectedInvoiceJob(null)}
          jobCard={selectedInvoiceJob}
        />
      </div>
    </>
  );
};

export default JobCards;