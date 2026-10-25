import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";

import apiService from "../services/apiService";
import { useLoading } from "../context/LoadingContext";
import { showToast } from "../components/ToasterService";

import "../style/CreateJobCard.css";

const CreateJobCard = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { setIsLoading } = useLoading();

  // Agar URL me ID hai to page Edit Mode me hai
  const isEditMode = Boolean(id);
const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [cars, setCars] = useState([]);
  const [items, setItems] = useState([]);
const [jobStatus, setJobStatus] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [carId, setCarId] = useState("");

  const [complaints, setComplaints] = useState([""]);

  const [workToBeDone, setWorkToBeDone] = useState([
    {
      description: "",
      cost: "",
    },
  ]);

  const [itemsUsed, setItemsUsed] = useState([
    {
      itemId: "",
      quantity: 1,
      rate: "",
    },
  ]);

  const [expectedDelivery, setExpectedDelivery] =
    useState("");

  const [remarks, setRemarks] = useState("");

  const [discount, setDiscount] = useState(0);

  const [tax, setTax] = useState(0);


  // ============================================
  // LOAD INITIAL DATA
  // ============================================
useEffect(() => {
  const loadPageData = async () => {
    await fetchInitialData();

    if (isEditMode) {
      await fetchJobCardById();
    }
  };

  loadPageData();
}, [id]);


  const fetchInitialData = async () => {
    try {
      setIsLoading(true);

      const [
        customerResponse,
        carResponse,
        itemResponse,
      ] = await Promise.all([
        apiService.get("/api/customers/getall"),

        apiService.get("/api/cars/getall"),

        apiService.get(
          "/api/items/getall?page=1&limit=1000"
        ),
      ]);


      // ========================================
      // CUSTOMERS
      // ========================================

      const customerList =
        customerResponse?.data?.customers ||
        customerResponse?.data?.data?.customers ||
        customerResponse?.data?.data ||
        [];


      // ========================================
      // CARS
      // ========================================

      const carList =
        carResponse?.data?.cars ||
        carResponse?.data?.data?.cars ||
        carResponse?.data?.data ||
        [];


      // ========================================
      // ITEMS
      // ========================================

      const itemList =
        itemResponse?.data?.items ||
        itemResponse?.data?.data?.items ||
        itemResponse?.data?.data ||
        [];


      setCustomers(
        Array.isArray(customerList)
          ? customerList
          : []
      );

      setCars(
        Array.isArray(carList)
          ? carList
          : []
      );

      setItems(
        Array.isArray(itemList)
          ? itemList
          : []
      );

    } catch (error) {
      console.error(
        "Create Job Card Initial Data Error:",
        error
      );

      showToast.error(
        error.message ||
          "Failed to load Job Card data"
      );

    } finally {
      setIsLoading(false);
    }
  };


  // ============================================
  // FETCH JOB CARD BY ID FOR EDIT
  // ============================================

  const fetchJobCardById = async () => {
    try {
      setIsLoading(true);

      let jobCard = null;
      try {
        const response = await apiService.get(`/api/job-cards/${id}`);
        jobCard =
          response?.data?.jobCard ||
          response?.data?.data?.jobCard ||
          response?.data?.data ||
          response?.data;
      } catch (fetchErr) {
        if (
          fetchErr?.response?.status === 404 ||
          fetchErr?.status === 404 ||
          fetchErr?.message?.includes("404")
        ) {
          const localCards = JSON.parse(
            localStorage.getItem("garage_job_cards") || "[]"
          );
          jobCard = localCards.find((c) => String(c._id || c.id) === String(id));
        } else {
          throw fetchErr;
        }
      }

      if (!jobCard || typeof jobCard !== "object") {
        showToast.error("Job Card not found");
        navigate("/job-cards");
        return;
      }

      setJobStatus(jobCard.status || "Pending");
      const existingCustomerId =
        typeof jobCard.customerId === "object"
          ? jobCard.customerId?._id || jobCard.customerId?.id
          : jobCard.customerId || jobCard.customer?._id || jobCard.customer?.id;

      const existingCarId =
        typeof jobCard.carId === "object"
          ? jobCard.carId?._id || jobCard.carId?.id
          : jobCard.carId || jobCard.car?._id || jobCard.car?.id;

      setCustomerId(existingCustomerId || "");
      setCarId(existingCarId || "");

      setComplaints(
        Array.isArray(jobCard.complaints) && jobCard.complaints.length
          ? jobCard.complaints
          : [""]
      );

     setWorkToBeDone(
  Array.isArray(jobCard.workToBeDone) &&
    jobCard.workToBeDone.length
    ? jobCard.workToBeDone.map((work) => ({
        _id: work._id,

        description:
          work.description || "",

        cost:
          work.cost ?? "",

        status:
          work.status || "Pending",

        workUpdate:
          work.workUpdate || "",

        updatedBy:
          work.updatedBy || null,

        updatedAt:
          work.updatedAt || null,
      }))
    : [
        {
          description: "",
          cost: "",
          status: "Pending",
          workUpdate: "",
          updatedBy: null,
          updatedAt: null,
        },
      ]
);
setItemsUsed(
  Array.isArray(jobCard.itemsUsed) && jobCard.itemsUsed.length
    ? jobCard.itemsUsed.map((item) => ({
        itemId:
          typeof item.itemId === "object"
            ? item.itemId?._id || ""
            : item.itemId || "",

        quantity: item.quantity ?? 1,
        rate: item.rate ?? "",

        // Existing usedBy preserve karo
        usedBy:
  typeof item.usedBy === "object"
    ? item.usedBy?._id || ""
    : item.usedBy || "",

usedAt: item.usedAt || null,

isNew: false,
      }))
    : [
        {
          itemId: "",
          quantity: 1,
          rate: "",
          usedBy: "",
          usedAt: null,
        },
      ]
);
      if (jobCard.expectedDelivery) {
        const date = new Date(jobCard.expectedDelivery);

        if (!Number.isNaN(date.getTime())) {
          const localDate = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000
          );

          setExpectedDelivery(localDate.toISOString().slice(0, 10));
        } else {
          setExpectedDelivery("");
        }
      } else {
        setExpectedDelivery("");
      }

      setRemarks(jobCard.remarks || "");
      setDiscount(jobCard.discount ?? 0);
      setTax(jobCard.tax ?? 0);
    } catch (error) {
      console.error("Fetch Job Card Error:", error);
      showToast.error(error.message || "Failed to load Job Card");
    } finally {
      setIsLoading(false);
    }
  };


  // ============================================
  // SELECTED CUSTOMER
  // ============================================

  const selectedCustomer =
    customers.find(
      (customer) =>
        (customer._id || customer.id) ===
        customerId
    );


  // ============================================
  // FILTER VEHICLES BY CUSTOMER
  // ============================================

  const customerCars = useMemo(() => {
    if (!customerId) {
      return [];
    }

    const targetId = String(customerId).trim();
    const currentCustomer = customers.find(
      (c) => String(c._id || c.id || "").trim() === targetId
    );
    const customerPhone = currentCustomer?.phoneNumber
      ? String(currentCustomer.phoneNumber).trim()
      : "";
    const customerName = currentCustomer
      ? `${currentCustomer.firstName || ""} ${currentCustomer.lastName || ""}`
          .trim()
          .toLowerCase()
      : "";

    return cars.filter((car) => {
      // 1. Direct ID match across all schemas (MongoDB _id, SQL id, customer object, customerId object)
      const carCustId = String(
        car.customerId?._id ||
          car.customerId?.id ||
          car.customer?._id ||
          car.customer?.id ||
          (typeof car.customerId === "string" ? car.customerId : "") ||
          (typeof car.customer === "string" ? car.customer : "") ||
          car.customer_id ||
          ""
      ).trim();

      if (carCustId && carCustId === targetId) {
        return true;
      }

      // 2. Phone number match
      const carPhone = String(
        car.customerId?.phoneNumber ||
          car.customer?.phoneNumber ||
          car.phone ||
          ""
      ).trim();

      if (customerPhone && carPhone && customerPhone === carPhone) {
        return true;
      }

      // 3. Customer name match
      const carCustomerName = (
        car.customerId?.fullName ||
        car.customer?.fullName ||
        `${car.customerId?.firstName || car.customer?.firstName || ""} ${
          car.customerId?.lastName || car.customer?.lastName || ""
        }`
      )
        .trim()
        .toLowerCase();

      if (customerName && carCustomerName && customerName === carCustomerName) {
        return true;
      }

      return false;
    });
  }, [cars, customerId, customers]);


  // ============================================
  // SELECTED CAR
  // ============================================

  const selectedCar =
    cars.find(
      (car) =>
        (car._id || car.id) ===
        carId
    );


  // ============================================
  // CUSTOMER CHANGE
  // ============================================

  const handleCustomerChange = (e) => {
    setCustomerId(e.target.value);
    setCarId("");
  };

  useEffect(() => {
    if (customerId && customerCars.length === 1 && !carId) {
      const singleCar = customerCars[0];
      setCarId(singleCar._id || singleCar.id || "");
    }
  }, [customerId, customerCars, carId]);


  // ============================================
  // COMPLAINTS
  // ============================================

  const handleComplaintChange = (
    index,
    value
  ) => {
    const updated = [...complaints];

    updated[index] = value;

    setComplaints(updated);
  };


  const addComplaint = () => {
    setComplaints([
      ...complaints,
      "",
    ]);
  };


  const removeComplaint = (index) => {
    if (complaints.length === 1) {
      return;
    }

    setComplaints(
      complaints.filter(
        (_, currentIndex) =>
          currentIndex !== index
      )
    );
  };


  // ============================================
  // WORK TO BE DONE
  // ============================================

  const handleWorkChange = (
    index,
    field,
    value
  ) => {
    const updated =
      [...workToBeDone];

    updated[index] = {
      ...updated[index],

      [field]: value,
    };

    setWorkToBeDone(updated);
  };


 const addWork = () => {
  setWorkToBeDone([
    ...workToBeDone,
    {
      description: "",
      cost: "",
      status: "Pending",
      workUpdate: "",
      updatedBy: null,
      updatedAt: null,
    },
  ]);
};


  const removeWork = (index) => {
    if (
      workToBeDone.length === 1
    ) {
      return;
    }

    setWorkToBeDone(
      workToBeDone.filter(
        (_, currentIndex) =>
          currentIndex !== index
      )
    );
  };


  // ============================================
  // ITEMS USED
  // ============================================

  const handleItemChange = (
    index,
    field,
    value
  ) => {
    const updated =
      [...itemsUsed];

    updated[index] = {
      ...updated[index],

      [field]: value,
    };

    setItemsUsed(updated);
  };


  const addItemRow = () => {
  setItemsUsed([
    ...itemsUsed,
    {
      itemId: "",
      quantity: 1,
      rate: "",
      usedBy: "",
      usedAt: null,
      isNew: true,
    },
  ]);
};
  const removeItemRow = (
    index
  ) => {
    if (itemsUsed.length === 1) {
      return;
    }

    setItemsUsed(
      itemsUsed.filter(
        (_, currentIndex) =>
          currentIndex !== index
      )
    );
  };


  // ============================================
  // TOTAL CALCULATIONS
  // ============================================

  const labourTotal =
    workToBeDone.reduce(
      (total, work) =>
        total +
        Number(work.cost || 0),
      0
    );


  const partsTotal =
    itemsUsed.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ) *
          Number(
            item.rate || 0
          ),
      0
    );


  const subtotal =
    labourTotal +
    partsTotal;


  const grandTotal =
    Math.max(
      subtotal -
        Number(discount || 0) +
        Number(tax || 0),
      0
    );
const handleMarkAsDelivered = async () => {
  if (!id) return;

  

  try {
    await apiService.patch(
      `/api/job-cards/${id}/status`,
      {
        status: "Delivered",
      }
    );

    setJobStatus("Delivered");

    showToast.success(
      "Job card marked as Delivered successfully"
    );

    await fetchJobCardById();
  } catch (error) {
    console.error(
      "Mark as Delivered Error:",
      error
    );

    showToast.error(
      error.response?.data?.message ||
        "Failed to mark job as Delivered"
    );
  }
};

  // ============================================
  // SUBMIT JOB CARD
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerId) {
      showToast.error("Please select a customer");
      return;
    }

    if (!carId) {
      showToast.error("Please select a vehicle");
      return;
    }

    const finalComplaints = complaints
      .map((complaint) => complaint.trim())
      .filter(Boolean);

    const finalWork = workToBeDone
  .filter((work) =>
    work.description.trim()
  )
  .map((work) => ({
  ...(work._id && {
    _id: work._id,
  }),

  description: work.description.trim(),

    cost:
      Number(work.cost || 0),

    status:
      work.status || "Pending",

    workUpdate:
      work.workUpdate || "",

    updatedBy:
      typeof work.updatedBy === "object"
        ? work.updatedBy?._id || null
        : work.updatedBy || null,

    updatedAt:
      work.updatedAt || null,
  }));
const existingItems = itemsUsed
  .filter(
    (item) =>
      item.itemId &&
      !item.isNew
  )
  .map((item) => ({
    itemId: item.itemId,
    quantity: Number(item.quantity || 1),
    rate: Number(item.rate || 0),
    usedBy: item.usedBy || null,
    usedAt: item.usedAt || null,
  }));

const newItems = itemsUsed
  .filter(
    (item) =>
      item.itemId &&
      item.isNew
  )
  .map((item) => ({
    itemId: item.itemId,
    quantity: Number(item.quantity || 1),
  }));
    try {
      setIsLoading(true);

      const jobCardData = {
        customerId,
        carId,
        complaints: finalComplaints,
        workToBeDone: finalWork,
        itemsUsed: isEditMode
  ? existingItems
  : itemsUsed
      .filter((item) => item.itemId)
      .map((item) => ({
        itemId: item.itemId,
        quantity: Number(item.quantity || 1),
        rate: Number(item.rate || 0),
      })),
        expectedDelivery: expectedDelivery
          ? new Date(expectedDelivery).toISOString()
          : null,
        remarks: remarks.trim(),
        discount: Number(discount || 0),
        tax: Number(tax || 0),
      };

      try {
        if (isEditMode) {
          // 1. Update existing Job Card data
          await apiService.put(`/api/job-cards/${id}`, jobCardData);

          // 2. Add newly added items separately
          for (const item of newItems) {
            await apiService.post(`/api/job-cards/${id}/items`, {
              itemId: item.itemId,
              quantity: item.quantity,
            });
          }
        } else {
          await apiService.post("/api/job-cards", jobCardData);
        }
      } catch (apiErr) {
        if (
          apiErr?.response?.status === 404 ||
          apiErr?.status === 404 ||
          apiErr?.message?.includes("404")
        ) {
          console.warn("Backend /api/job-cards returned 404, persisting to localStorage");
          const localCards = JSON.parse(
            localStorage.getItem("garage_job_cards") || "[]"
          );
          const chosenCustomer =
            customers.find((c) => String(c._id || c.id) === String(customerId)) || {};
          const chosenCar =
            cars.find((c) => String(c._id || c.id) === String(carId)) || {};

          if (isEditMode) {
            const idx = localCards.findIndex(
              (c) => String(c._id || c.id) === String(id)
            );
            if (idx !== -1) {
              localCards[idx] = {
                ...localCards[idx],
                ...jobCardData,
                customerId: chosenCustomer,
                carId: chosenCar,
                grandTotal,
                labourTotal,
                partsTotal,
                subtotal,
                updatedAt: new Date().toISOString(),
              };
            }
          } else {
            const newCard = {
              _id: "jc-" + Date.now(),
              jobCardNumber: `JC-${new Date().getFullYear()}-${String(
                Date.now()
              ).slice(-4)}`,
              ...jobCardData,
              customerId: chosenCustomer,
              carId: chosenCar,
              grandTotal,
              labourTotal,
              partsTotal,
              subtotal,
              status: "Pending",
              createdAt: new Date().toISOString(),
            };
            localCards.unshift(newCard);
          }
          localStorage.setItem("garage_job_cards", JSON.stringify(localCards));
        } else {
          throw apiErr;
        }
      }

      showToast.success(
        isEditMode
          ? "Job card updated successfully"
          : "Job card created successfully"
      );
      navigate("/job-cards");
    } catch (error) {
      console.error(
        isEditMode ? "Update Job Card Error:" : "Create Job Card Error:",
        error
      );

      showToast.error(
        error.response?.data?.message ||
          error.message ||
          (isEditMode
            ? "Failed to update Job Card"
            : "Failed to create Job Card")
      );
    } finally {
      setIsLoading(false);
    }
  };


  // ============================================
  // UI
  // ============================================

  return (
    <div className="create-job-card-page">

      {/* PAGE HEADER */}

      <div className="create-job-header">

        <div>

          <button
            type="button"
            className="job-back-button"
            onClick={() =>
              navigate(
                "/job-cards"
              )
            }
          >
            <FiArrowLeft />

            Back to Job Cards
          </button>


          <div className="admin-job-title-row">

  <h1>
    {isEditMode
      ? "Edit Job Card"
      : "Create Job Card"}
  </h1>

  {isEditMode && (
    <span
      className={`admin-job-status ${
        (jobStatus || "Pending")
          .toLowerCase()
          .replace(/\s+/g, "-")
      }`}
    >
      {jobStatus || "Pending"}
    </span>
  )}

</div>

          <p>
            {isEditMode
              ? "Update the existing Job Card details."
              : "Create a new service job card for an existing customer and vehicle."}
          </p>

        </div>

      </div>


      <form
        onSubmit={
          handleSubmit
        }
        noValidate
      >

        {/* =====================================
            CUSTOMER & VEHICLE
        ====================================== */}

        <section className="job-form-card">

          <div className="job-form-section-header">

            <div>

              <h2>
                Customer & Vehicle
              </h2>

              <p>
                Select the customer and
                vehicle for this Job Card.
              </p>

            </div>

          </div>


          <div className="job-form-grid">

            <div className="job-form-group">

              <label>
                Customer *
              </label>

              <select
                value={
                  customerId
                }
                onChange={
                  handleCustomerChange
                }
                required
              >

                <option value="">
                  Select Customer
                </option>


                {customers.map(
                  (customer) => {

                    const id =
                      customer._id ||
                      customer.id;

                    return (

                      <option
                        key={id}
                        value={id}
                      >

                        {customer.fullName ||
                          `${customer.firstName || ""} ${
                            customer.lastName || ""
                          }`}

                      </option>

                    );
                  }
                )}

              </select>

            </div>


            <div className="job-form-group">

              <label>
                Vehicle *
              </label>

              <select
                value={
                  carId
                }
                onChange={(e) =>
                  setCarId(
                    e.target.value
                  )
                }
                disabled={
                  !customerId
                }
                required
              >

                <option value="">
                  {!customerId
                    ? "Select customer first"
                    : customerCars.length
                    ? "Select Vehicle"
                    : "Choose from all available vehicles"}
                </option>

                {customerCars.length > 0
                  ? customerCars.map((car) => {
                      const id = car._id || car.id;
                      return (
                        <option key={id} value={id}>
                          {car.registrationNo} | {car.make} {car.model}
                        </option>
                      );
                    })
                  : cars.map((car) => {
                      const id = car._id || car.id;
                      return (
                        <option key={id} value={id}>
                          {car.registrationNo} | {car.make} {car.model} (All Vehicles)
                        </option>
                      );
                    })}

              </select>

            </div>

          </div>


          {/* SELECTED DETAILS */}

          {(selectedCustomer ||
            selectedCar) && (

            <div className="selected-info-grid">

              {selectedCustomer && (

                <div className="selected-info-box">

                  <span>
                    Customer
                  </span>

                  <strong>

                    {selectedCustomer.fullName ||
                      `${selectedCustomer.firstName || ""} ${
                        selectedCustomer.lastName || ""
                      }`}

                  </strong>

                  <p>

                    {selectedCustomer.phoneNumber ||
                      "-"}

                  </p>

                </div>

              )}


              {selectedCar && (

                <div className="selected-info-box">

                  <span>
                    Vehicle
                  </span>

                  <strong>

                    {selectedCar.registrationNo}

                  </strong>

                  <p>

                    {selectedCar.make}
                    {" "}
                    {selectedCar.model}

                  </p>

                </div>

              )}

            </div>

          )}

        </section>


        {/* =====================================
            CUSTOMER COMPLAINTS
        ====================================== */}

        <section className="job-form-card">

          <div className="job-form-section-header">

            <div>

              <h2>
                Customer Complaints
              </h2>

              <p>
                Enter the issues reported
                by the customer.
              </p>

            </div>


           <button
  type="button"
  className="job-pencil-button"
  onClick={addComplaint}
  title="Add Complaint"
  aria-label="Add Complaint"
>
  <FiEdit2 />
</button>
          </div>


          <div className="dynamic-row-list">

            {complaints.map(
              (
                complaint,
                index
              ) => (

                <div
                  className="complaint-row"
                  key={index}
                >

                  <div className="row-number">

                    {index + 1}

                  </div>


                  <input
                    type="text"
                    placeholder="Example: Engine noise while driving"
                    value={
                      complaint
                    }
                    onChange={(e) =>
                      handleComplaintChange(
                        index,
                        e.target.value
                      )
                    }
                  />


                  <button
                    type="button"
                    className="job-remove-row-button"
                    onClick={() =>
                      removeComplaint(
                        index
                      )
                    }
                    disabled={
                      complaints.length ===
                      1
                    }
                  >
                    <FiTrash2 />
                  </button>

                </div>

              )
            )}

          </div>

        </section>


        {/* =====================================
            WORK TO BE DONE
        ====================================== */}

       {/* =====================================
    WORK TO BE DONE
====================================== */}

<section className="job-form-card">

  <div className="job-form-section-header">

    <div>
      <h2>Work To Be Done</h2>

      <p>
        Manage assigned work and view staff progress.
      </p>
    </div>

    <button
      type="button"
      className="job-pencil-button"
      onClick={addWork}
      title="Add Work"
      aria-label="Add Work"
    >
      <FiEdit2 />
    </button>

  </div>


  <div className="job-table-header admin-work-table-header">

    <span>Description</span>

    <span>Labour Cost</span>

    <span>Status</span>

    <span>Work Done / Update</span>

    <span></span>

  </div>


  <div className="dynamic-row-list">

    {workToBeDone.map((work, index) => (

      <div
        className="admin-work-row"
        key={work._id || index}
      >

        {/* ADMIN CAN EDIT DESCRIPTION */}
        <input
          type="text"
          placeholder="Example: Brake service"
          value={work.description}
          onChange={(e) =>
            handleWorkChange(
              index,
              "description",
              e.target.value
            )
          }
        />


        {/* ADMIN CAN EDIT LABOUR COST */}
        <input
          type="number"
          placeholder="₹ 0"
          min="0"
          value={work.cost}
          onChange={(e) =>
            handleWorkChange(
              index,
              "cost",
              e.target.value
            )
          }
        />


        {/* STAFF STATUS: ADMIN VIEW ONLY */}
        <div className="admin-work-status">

          <span
            className={`admin-status-badge ${
              work.status === "Completed"
                ? "completed"
                : work.status === "In Progress"
                ? "in-progress"
                : "pending"
            }`}
          >
            {work.status || "Pending"}
          </span>

        </div>


        {/* STAFF WORK UPDATE: ADMIN VIEW ONLY */}
        <div className="admin-work-update">

          {work.workUpdate ? (
            <span>
              {work.workUpdate}
            </span>
          ) : (
            <span className="admin-no-update">
              No update yet
            </span>
          )}

        </div>


        {/* ADMIN CAN REMOVE TASK */}
        <button
          type="button"
          className="job-remove-row-button"
          onClick={() =>
            removeWork(index)
          }
          disabled={
            workToBeDone.length === 1
          }
          title="Remove Work"
        >
          <FiTrash2 />
        </button>

      </div>

    ))}

  </div>

</section>


        {/* =====================================
            PARTS / ITEMS USED
        ====================================== */}

        <section className="job-form-card">

  <div className="job-form-section-header">
    <div>
      <h2>Parts / Items Used</h2>

      <p>
        View items used by staff during vehicle service.
      </p>
    </div>
  </div>

  <div className="job-table-header admin-item-table-header">
    <span>Item</span>
    <span>Qty</span>
    <span>Rate</span>
    <span>Amount</span>
    <span>Added By</span>
  </div>

  <div className="dynamic-row-list">

    {itemsUsed.length > 0 ? (

      itemsUsed.map((item, index) => {

        const amount =
          Number(item.quantity || 0) *
          Number(item.rate || 0);

        const selectedItem =
          items.find((availableItem) => {
            const availableId =
              availableItem._id ||
              availableItem.id;

            const currentItemId =
              typeof item.itemId === "object"
                ? item.itemId?._id
                : item.itemId;

            return (
              String(availableId) ===
              String(currentItemId)
            );
          });

        const itemName =
          typeof item.itemId === "object"
            ? item.itemId?.itemName
            : selectedItem?.itemName;

        const addedByName =
          typeof item.usedBy === "object"
            ? item.usedBy?.name
            : null;

        return (
          <div
            className="admin-item-row"
            key={item._id || index}
          >

            {/* ITEM NAME */}
            <div className="admin-item-readonly">
              {itemName || "Unknown Item"}
            </div>

            {/* QUANTITY */}
            <div className="admin-item-readonly">
              {item.quantity || 0}
            </div>

            {/* RATE */}
            <div className="admin-item-readonly">
              ₹
              {Number(
                item.rate || 0
              ).toLocaleString("en-IN")}
            </div>

            {/* AMOUNT */}
            <div className="admin-item-readonly">
              ₹
              {Number(
                item.amount || amount
              ).toLocaleString("en-IN")}
            </div>

            {/* ADDED BY STAFF */}
            <div className="admin-item-added-by">
              {addedByName || "Admin / Existing"}
            </div>

          </div>
        );
      })

    ) : (

      <div className="admin-no-items">
        No items have been used yet.
      </div>

    )}

  </div>

</section>


        {/* =====================================
            DELIVERY & REMARKS
        ====================================== */}

        <section className="job-form-card">

          <div className="job-form-section-header">

            <div>

              <h2>
                Delivery & Remarks
              </h2>

            </div>

          </div>


          <div className="job-form-grid">

            <div className="job-form-group">

              <label>
                Expected Delivery
              </label>

              <input
                type="date"
                value={
                  expectedDelivery
                }
                onChange={(e) =>
                  setExpectedDelivery(
                    e.target.value
                  )
                }
              />

            </div>


            <div className="job-form-group">

              <label>
                Discount
              </label>

              <input
                type="number"
                min="0"
                value={
                  discount
                }
                onChange={(e) =>
                  setDiscount(
                    e.target.value
                  )
                }
                placeholder="₹ 0"
              />

            </div>


            <div className="job-form-group">

              <label>
                Tax
              </label>

              <input
                type="number"
                min="0"
                value={
                  tax
                }
                onChange={(e) =>
                  setTax(
                    e.target.value
                  )
                }
                placeholder="₹ 0"
              />

            </div>

          </div>


          <div className="job-form-group job-remarks-group">

            <label>
              Remarks
            </label>

            <textarea
              rows="4"
              value={
                remarks
              }
              onChange={(e) =>
                setRemarks(
                  e.target.value
                )
              }
              placeholder="Enter additional remarks..."
            />

          </div>

        </section>


        {/* =====================================
            SUMMARY
        ====================================== */}

        <section className="job-form-card job-summary-card">

          <div className="job-form-section-header">

            <div>

              <h2>
                Job Summary
              </h2>

            </div>

          </div>


          <div className="job-summary-row">

            <span>
              Parts Total
            </span>

            <strong>
              ₹
              {partsTotal.toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>


          <div className="job-summary-row">

            <span>
              Labour Total
            </span>

            <strong>
              ₹
              {labourTotal.toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>


          <div className="job-summary-row">

            <span>
              Subtotal
            </span>

            <strong>
              ₹
              {subtotal.toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>


          <div className="job-summary-row">

            <span>
              Discount
            </span>

            <strong>
              - ₹
              {Number(
                discount || 0
              ).toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>


          <div className="job-summary-row">

            <span>
              Tax
            </span>

            <strong>
              + ₹
              {Number(
                tax || 0
              ).toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>


          <div className="job-summary-row job-grand-total">

            <span>
              Grand Total
            </span>

            <strong>
              ₹
              {grandTotal.toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>

        </section>


        {/* =====================================
            ACTION BUTTONS
        ====================================== */}

       <div className="create-job-actions">

  <button
    type="button"
    className="job-cancel-button"
    onClick={() =>
      navigate("/job-cards")
    }
  >
    Cancel
  </button>

  {isEditMode &&
    jobStatus === "Completed" && (
      <button
  type="button"
  className="job-delivered-button"
  onClick={() => setShowDeliveryConfirm(true)}
>
  Mark as Delivered
</button>
    )}

  <button
    type="submit"
    className="job-submit-button"
  >
    {isEditMode
      ? "Update Job Card"
      : "Create Job Card"}
  </button>

</div>

      </form>
{showDeliveryConfirm && (
  <div className="delivery-modal-overlay">
    <div className="delivery-modal">

      <div className="delivery-modal-icon">
        ✓
      </div>

      <h2>Confirm Delivery</h2>

      <p>
        Are you sure the vehicle has been delivered to the customer?
      </p>

      <div className="delivery-modal-actions">
        <button
          type="button"
          className="delivery-modal-cancel"
          onClick={() => setShowDeliveryConfirm(false)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="delivery-modal-confirm"
          onClick={() => {
            setShowDeliveryConfirm(false);
            handleMarkAsDelivered();
          }}
        >
          Yes, Mark as Delivered
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
};

export default CreateJobCard;