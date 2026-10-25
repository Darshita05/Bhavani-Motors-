import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  FiArrowLeft,
  FiEdit2,
  FiUser,
  FiCalendar,
  FiClock,
  FiActivity,
  FiUsers,
  FiTruck,
  FiAlertTriangle,
  FiTool,
  FiPackage,
  FiFileText,
  FiMessageSquare,
  FiPhone,
  FiMail,
  FiMapPin,
  FiHash,
  FiDroplet,
  FiNavigation,
  FiCheckCircle,
  FiDollarSign,
} from "react-icons/fi";

import apiService from "../services/apiService";
import { useLoading } from "../context/LoadingContext";
import { showToast } from "../components/ToasterService";
import InvoiceModal from "../components/InvoiceModal";

import "../style/JobCardDetails.css";

const JobCardDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setIsLoading } = useLoading();

  const [jobCard, setJobCard] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    fetchJobCard();
  }, [id]);

  const fetchJobCard = async () => {
    try {
      setIsLoading(true);

      let data = null;
      try {
        const response = await apiService.get(`/api/job-cards/${id}`);
        data =
          response?.data?.jobCard ||
          response?.data?.data?.jobCard ||
          response?.data?.data ||
          response?.data;
      } catch (err) {
        if (
          err?.response?.status !== 404 &&
          err?.status !== 404 &&
          !err?.message?.includes("404")
        ) {
          throw err;
        }
      }

      if (!data) {
        const localCards = JSON.parse(
          localStorage.getItem("garage_job_cards") || "[]"
        );
        data = localCards.find((c) => String(c._id || c.id) === String(id));
      }

      if (!data) {
        showToast.error("Job Card not found");
        navigate("/job-cards");
        return;
      }

      setJobCard(data);
    } catch (error) {
      console.error("Job Card Details Error:", error);
      showToast.error(error.message || "Failed to load Job Card");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMoney = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  if (!jobCard) {
    return null;
  }

  const customer =
    (typeof jobCard.customerId === "object" && jobCard.customerId !== null ? jobCard.customerId : null) ||
    (typeof jobCard.customer === "object" && jobCard.customer !== null ? jobCard.customer : null) ||
    {};

  const vehicle =
    (typeof jobCard.carId === "object" && jobCard.carId !== null ? jobCard.carId : null) ||
    (typeof jobCard.car === "object" && jobCard.car !== null ? jobCard.car : null) ||
    {};
const assignedStaff =
  typeof jobCard.assignedTo === "object" &&
  jobCard.assignedTo !== null
    ? jobCard.assignedTo
    : {};
  const complaints = jobCard.complaints || [];
  const work = jobCard.workToBeDone || [];
  const items = jobCard.itemsUsed || [];

  const partsTotal = items.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0) *
        Number(item.rate || 0),
    0
  );

  const labourTotal = work.reduce(
    (total, item) =>
      total + Number(item.cost || 0),
    0
  );

  const subtotal = partsTotal + labourTotal;

  const discount = Number(jobCard.discount || 0);
  const tax = Number(jobCard.tax || 0);

  const grandTotal =
    jobCard.grandTotal ??
    subtotal - discount + tax;

  return (
    <div className="job-details-page">

      {/* ================= HEADER ================= */}

      <div className="job-details-header">

        <div className="job-details-title">

          <button
            type="button"
            className="job-details-back"
            onClick={() => navigate("/job-cards")}
          >
            <FiArrowLeft />
          </button>

          <div className="job-title-content">

            <div className="job-title-row">

              <h1>
                Job Card #{jobCard.jobCardNumber || "-"}
              </h1>

              <span className="job-status-badge">
                {jobCard.status || "Pending"}
              </span>

            </div>

            <div className="job-breadcrumb">
              Job Cards
              <span>/</span>
              {jobCard.jobCardNumber || "-"}
            </div>

          </div>

        </div>


        <div className="job-details-actions">
          <button
            type="button"
            className="job-invoice-main-button"
            onClick={() => setShowInvoiceModal(true)}
            title="Generate and Print GST Invoice"
          >
            <FiFileText />
            Generate Invoice
          </button>

          <button
            type="button"
            className="job-edit-main-button"
            onClick={() =>
              navigate(`/job-cards/edit/${jobCard._id}`)
            }
          >
            <FiEdit2 />
            Edit Job Card
          </button>
        </div>

      </div>


      {/* ================= TOP INFORMATION ================= */}

      <div className="job-info-strip">


        {/* JOB CARD NUMBER */}

        <div className="job-info-box">

          <div className="job-info-icon blue-icon">
            <FiFileText />
          </div>

          <div className="job-info-content">

            <span>Job Card No.</span>

            <strong className="job-number">
              {jobCard.jobCardNumber || "-"}
            </strong>

          </div>

        </div>


        {/* DATE */}

        <div className="job-info-box">

          <div className="job-info-icon blue-icon">
            <FiCalendar />
          </div>

          <div className="job-info-content">

            <span>Date</span>

            <strong>
              {formatDate(jobCard.createdAt)}
            </strong>

          </div>

        </div>
{/* TIME IN */}

<div className="job-info-box">
  <div className="job-info-icon blue-icon">
    <FiClock />
  </div>

  <div className="job-info-content">
    <span>Time In</span>

    <strong>
      {jobCard.createdAt
        ? new Date(jobCard.createdAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-"}
    </strong>
  </div>
</div>

        {/* EXPECTED DELIVERY */}

        <div className="job-info-box">

          <div className="job-info-icon orange-icon">
            <FiClock />
          </div>

          <div className="job-info-content">

            <span>Expected Delivery</span>

            <strong>
              {formatDateTime(
                jobCard.expectedDelivery
              )}
            </strong>

          </div>

        </div>


        {/* STATUS */}

        <div className="job-info-box">

          <div className="job-info-icon purple-icon">
            <FiActivity />
          </div>

          <div className="job-info-content">

            <span>Status</span>

            <strong className="job-status-small">
              {jobCard.status || "Pending"}
            </strong>

          </div>

        </div>

      </div>


      {/* ================= MAIN GRID ================= */}

      <div className="job-details-grid">


        {/* ================= CUSTOMER DETAILS ================= */}

        <section className="job-detail-card customer-card">

          <div className="job-card-heading">

            <div className="job-heading-title">
              <FiUser />
              <h2>Customer Details</h2>
            </div>

          </div>


          <div className="detail-row">

            <span>Customer Name</span>

            <strong>
              {customer.firstName || ""}{" "}
              {customer.lastName || ""}
            </strong>

          </div>


          <div className="detail-row">

            <span>Phone Number</span>

            <strong className="detail-with-icon">
              <FiPhone />
              {customer.phoneNumber || "-"}
            </strong>

          </div>


          <div className="detail-row">

            <span>Email</span>

            <strong className="detail-with-icon">
              <FiMail />
              {customer.email || "-"}
            </strong>

          </div>


          <div className="detail-row">

            <span>Address</span>

            <strong className="detail-with-icon">
              <FiMapPin />
              {customer.address || "-"}
            </strong>

          </div>

        </section>


        {/* ================= VEHICLE DETAILS ================= */}

        <section className="job-detail-card vehicle-card">

          <div className="job-card-heading">

            <div className="job-heading-title">
              <FiTruck />
              <h2>Vehicle Details</h2>
            </div>

          </div>


          <div className="detail-row">

            <span>Vehicle Number</span>

            <strong className="detail-with-icon">
              <FiHash />
              {vehicle.registrationNo || "-"}
            </strong>

          </div>


          <div className="detail-row">

            <span>Brand & Model</span>

            <strong>
              {vehicle.make || "-"}{" "}
              {vehicle.model || ""}
            </strong>

          </div>


          <div className="detail-row">

            <span>Fuel Type</span>

            <strong className="detail-with-icon">
              <FiDroplet />
              {vehicle.fuelType || "-"}
            </strong>

          </div>


          <div className="detail-row">

            <span>Mileage</span>

            <strong className="detail-with-icon">
              <FiNavigation />
              {vehicle.mileage || 0} KM
            </strong>

          </div>

        </section>
{/* ================= ASSIGNED TO ================= */}

<section className="job-detail-card assigned-card">

  <div className="job-card-heading">
    <div className="job-heading-title">
      <FiUsers />
      <h2>Assigned To</h2>
    </div>
  </div>

  {assignedStaff._id ? (
    <>
      <div className="detail-row">
        <span>Staff Name</span>

        <strong>
          {assignedStaff.name || "-"}
        </strong>
      </div>

      <div className="detail-row">
        <span>Designation</span>

        <strong>
          {assignedStaff.designation || "Staff"}
        </strong>
      </div>

      <div className="detail-row">
        <span>Phone Number</span>

        <strong className="detail-with-icon">
          <FiPhone />
          {assignedStaff.phone || "-"}
        </strong>
      </div>

      <div className="detail-row">
        <span>Email</span>

        <strong className="detail-with-icon">
          <FiMail />
          {assignedStaff.email || "-"}
        </strong>
      </div>
    </>
  ) : (
    <div className="job-empty">
      No staff assigned
    </div>
  )}

</section>

        {/* ================= CUSTOMER COMPLAINTS ================= */}

        <section className="job-detail-card complaints-card">

          <div className="job-card-heading">

            <div className="job-heading-title complaint-heading">
              <FiAlertTriangle />
              <h2>Customer Complaints</h2>
            </div>

          </div>


          <ul className="job-detail-list">

            {complaints.length > 0 ? (

              complaints.map((complaint, index) => (

                <li key={index}>
                  {complaint}
                </li>

              ))

            ) : (

              <li>No complaints added</li>

            )}

          </ul>

        </section>


        {/* ================= WORK TO BE DONE ================= */}

        <section className="job-detail-card work-card">

          <div className="job-card-heading">

            <div className="job-heading-title work-heading">
              <FiTool />
              <h2>Work To Be Done</h2>
            </div>

          </div>


          <div className="job-mini-table">

            {work.length > 0 ? (

              work.map((item, index) => (

                <div
                  className="job-mini-row"
                  key={index}
                >

                  <div className="work-description">

                    <FiCheckCircle />

                    <span>
                      {item.description}
                    </span>

                  </div>

                  <strong>
                    {formatMoney(item.cost)}
                  </strong>

                </div>

              ))

            ) : (

              <div className="job-empty">
                No work added
              </div>

            )}

          </div>

        </section>


        {/* ================= PARTS / ITEMS USED ================= */}

        <section className="job-detail-card job-items-card">

          <div className="job-card-heading">

            <div className="job-heading-title parts-heading">
              <FiPackage />
              <h2>Parts / Items Used</h2>
            </div>

          </div>


          <div className="job-items-table">

            <div className="job-items-head">

  <span>Part Name</span>
  <span>Used By</span>
  <span>Qty</span>
  <span>Rate</span>
  <span>Amount</span>

</div>


            {items.length > 0 ? (

              items.map((item, index) => {

                const itemName =
                  item.itemId?.itemName ||
                  item.itemName ||
                  "Item";

                const amount =
                  Number(item.quantity || 0) *
                  Number(item.rate || 0);

                return (

                  <div
                    className="job-items-row"
                    key={index}
                  >

                   <span className="item-name-cell">

  <FiPackage />

  {itemName}

</span>

<span className="item-used-by">
  {item.usedBy?.name || "Not recorded"}
</span>

<span>
  {item.quantity}
</span>

                    <span>
                      {formatMoney(item.rate)}
                    </span>

                    <strong>
                      {formatMoney(amount)}
                    </strong>

                  </div>

                );

              })

            ) : (

              <div className="job-empty">
                No items used
              </div>

            )}

          </div>

        </section>
{/* ================= LABOUR CHARGES ================= */}

<section className="job-detail-card labour-card">
  <div className="job-card-heading">
    <div className="job-heading-title">
      <FiTool />
      <h2>Labour Charges</h2>
    </div>
  </div>

  <div className="labour-table">
    <div className="labour-table-head">
      <span>#</span>
      <span>Description</span>
      <span>Amount</span>
    </div>

    {work.length > 0 ? (
      work.map((item, index) => (
        <div className="labour-table-row" key={index}>
          <span>{index + 1}</span>

          <span>
            {item.description || "-"}
          </span>

          <strong>
            {formatMoney(item.cost)}
          </strong>
        </div>
      ))
    ) : (
      <div className="job-empty">
        No labour charges added
      </div>
    )}

    <div className="labour-total-row">
      <strong>Total Labour Amount</strong>
      <strong>{formatMoney(labourTotal)}</strong>
    </div>
  </div>
</section>

        {/* ================= SUMMARY ================= */}

        <section className="job-detail-card job-summary-card">

          <div className="job-card-heading">

            <div className="job-heading-title summary-heading">
              <FiDollarSign />
              <h2>Summary</h2>
            </div>

          </div>


          <div className="summary-table">

            <div className="summary-row">

              <span>Parts Total</span>

              <strong>
                {formatMoney(partsTotal)}
              </strong>

            </div>


            <div className="summary-row">

              <span>Labour Total</span>

              <strong>
                {formatMoney(labourTotal)}
              </strong>

            </div>


            <div className="summary-row">

              <span>Sub Total</span>

              <strong>
                {formatMoney(subtotal)}
              </strong>

            </div>


            <div className="summary-row discount-row">

              <span>Discount</span>

              <strong>
                - {formatMoney(discount)}
              </strong>

            </div>


            <div className="summary-row">

              <span>Tax</span>

              <strong>
                + {formatMoney(tax)}
              </strong>

            </div>

          </div>


          <div className="grand-total-row">

            <span>Grand Total</span>

            <strong>
              {formatMoney(grandTotal)}
            </strong>

          </div>

        </section>

      </div>

      {/* ================= REMARKS ================= */}

      <section className="job-remarks-card">

        <div className="job-card-heading">

          <div className="job-heading-title remarks-heading">

            <FiMessageSquare />

            <h2>Remarks</h2>

          </div>

        </div>

        <p>
          {jobCard.remarks ||
            "No remarks added."}
        </p>

      </section>

      {/* ================= INVOICE MODAL ================= */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        jobCard={jobCard}
      />

    </div>
  );
};

export default JobCardDetails;