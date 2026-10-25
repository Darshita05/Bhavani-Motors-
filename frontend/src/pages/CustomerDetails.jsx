import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiPhone,
  FiMail,
  FiMapPin,
  FiPlus,
  FiUser,
} from "react-icons/fi";
import { FaCarSide, FaRegCalendarAlt, FaRupeeSign } from "react-icons/fa";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Pagination from "../components/Pagination";
import apiService from "../services/apiService";
import AddVehicleModal from "../components/AddVehicleModal";
import "../style/CustomerDetails.css";
import { useLoading } from "../context/LoadingContext";
import { AiOutlineEye } from "react-icons/ai";

const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [allCustomerServices, setAllCustomerServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("all");
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [addVehicleModalProps, setAddVehicleModalProps] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { setIsLoading } = useLoading();

  const fetchCustomerData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get(`/api/customers/get/${id}`);
      const customerData =
        response?.data?.customer ||
        response?.customer ||
        (response?.data && !Array.isArray(response.data) ? response.data : null);

      if (customerData) {
        customerData.totalCars =
          response?.data?.totalCars ?? response?.totalCars ?? customerData.totalCars ?? 0;
        setCustomer(customerData);
      } else {
        setCustomer(null);
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServices = async (page = 1, limit) => {
    const effectiveLimit = limit !== undefined ? limit : itemsPerPage;
    try {
      const response = await apiService.get(
        `/api/services/get/pagination?limit=${effectiveLimit}&customerId=${id}&page=${page}`
      );
      const rawServices =
        response?.services ||
        response?.data?.services ||
        (Array.isArray(response?.data) ? response.data : null) ||
        (Array.isArray(response) ? response : null);

      if (rawServices) {
        const services = rawServices.map((service) => ({
          ...service,
          car: service.carId || service.car || {
            registrationNo: "N/A",
            mileage: 0,
            make: "",
            model: "",
          },
          dueDate: service.dueDate || new Date().toISOString(),
          serviceDate: service.serviceDate || new Date().toISOString(),
        }));
        setAllCustomerServices(services);
        setFilteredServices(
          selectedVehicleId === "all"
            ? services
            : services.filter((s) => s.car.registrationNo === selectedVehicleId)
        );
        setTotalPages(response?.totalPages || response?.data?.totalPages || 1);
        setTotalItems(response?.totalItems || response?.data?.totalItems || services.length);
        setCustomer((prev) => (prev ? { ...prev, services } : prev));
      } else {
        setAllCustomerServices([]);
        setFilteredServices([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setAllCustomerServices([]);
      setFilteredServices([]);
      setTotalPages(1);
      setTotalItems(0);
    }
  };

  const handleAddService = () => {
    setIsAddVehicleModalOpen(true);
    setAddVehicleModalProps({
      selectedCustomer: customer,
      onClose: () => {
        setIsAddVehicleModalOpen(false);
        fetchServices(currentPage);
      },
    });
  };

  const handleVehicleSelectChange = (e) => {
    const regNo = e.target.value;
    setSelectedVehicleId(regNo);
    setFilteredServices(
      regNo === "all"
        ? allCustomerServices
        : allCustomerServices.filter((s) => s.car.registrationNo === regNo)
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchServices(page);
  };

  const handlePageSizeChange = (size) => {
    setItemsPerPage(size);
    setCurrentPage(1);
    fetchServices(1, size);
  };

  const getUniqueVehicles = () => {
    const map = new Map();
    if (Array.isArray(customer?.cars)) {
      customer.cars.forEach((c) => {
        const reg = c.registrationNo;
        if (reg && !map.has(reg)) {
          map.set(reg, { make: c.make, model: c.model, registrationNo: reg });
        }
      });
    }
    if (Array.isArray(customer?.vehicles)) {
      customer.vehicles.forEach((c) => {
        const reg = c.registrationNo;
        if (reg && !map.has(reg)) {
          map.set(reg, { make: c.make, model: c.model, registrationNo: reg });
        }
      });
    }
    customer?.services?.forEach((s) => {
      const reg = s.car?.registrationNo;
      if (reg && !map.has(reg)) {
        map.set(reg, {
          make: s.car?.make || "",
          model: s.car?.model || "",
          registrationNo: reg,
        });
      }
    });
    return Array.from(map.values());
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  useEffect(() => {
    fetchServices(1);
  }, [id]);

  if (!customer)
    return (
      <div className="customer-details-container">No customer data found.</div>
    );

  return (
    <div className="customer-details-container">
      <ToastContainer position="top-right" />
      
      {/* Header Line containing Back and Add Service buttons outside cards */}
      <div className="cd-header">
        <Link to="/customers" className="cd-back-btn">
          <FiArrowLeft /> Back
        </Link>
        <div className="servicebtn-container">
          <button className="add-customer-button" onClick={handleAddService}>
            <FiPlus className="plus-icon" /> Add Service
          </button>
          {isAddVehicleModalOpen && (
            <AddVehicleModal {...addVehicleModalProps} />
          )}
        </div>
      </div>

      <div className="cd-vertical-layout">
        
        {/* ================= LEFT SIDEBAR PANEL (Full Stretch) ================= */}
        <div className="cd-left-sidebar">
          
          <div className="cd-sidebar-profile">
            <div className="cd-avatar">
              {customer.firstName?.[0]}
            </div>
            <div>
              <div className="cd-name">
                {customer.firstName} {customer.lastName}
              </div>
              <div className="cd-since">
                Customer since{" "}
                {customer.createdAt
                  ? new Date(customer.createdAt).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>
          </div>
          <div className="cd-contact1">
            <div className="cd-contact-list">
              <div className="cd-contact-item">
                <FiPhone className="icon" /> {customer.phoneNumber}
              </div>
              <div className="cd-contact-item">
                <FiMail className="icon" /> {customer.email}
              </div>
              <div className="cd-contact-item">
                <FiMapPin className="icon" /> {customer.address}
              </div>
            </div>
          </div>

          {/* Total Spent */}
          <div className="cd-stat">
            <FaRupeeSign
              className="cd-stat-icon rupee"
              style={{ backgroundColor: "#FFEDD5", color: "#FCA311" }}
            />
            <div className="cd-stat-detail">
              <span className="cd-stat-title">
                ₹{" "}
                {customer.services?.reduce(
                  (sum, s) => sum + (s.cost ? Number(s.cost) : 0),
                  0
                )}
              </span>
              <br />
              <span className="cd-stat-content">Total Spent</span>
            </div>
          </div>

          {/* Vehicles Count */}
          <div className="cd-stat">
            <FaCarSide
              className="cd-stat-icon car"
              style={{ backgroundColor: "#DBEAFE", color: "#125CAF" }}
            />
            <div className="cd-stat-detail">
              <span className="cd-stat-title">{customer.totalCars || 0}</span>
              <br />
              <span className="cd-stat-content">Vehicles</span>
            </div>
          </div>

          {/* Latest Service Date */}
          <div className="cd-stat">
            <FaRegCalendarAlt
              className="cd-stat-icon calendar"
              style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}
            />
            <div className="cd-stat-detail">
              <span className="cd-stat-title">
                {customer.services?.length > 0
                  ? new Date(
                      customer.services[0].serviceDate
                    ).toLocaleDateString()
                  : "N/A"}
              </span>
              <br />
              <span className="cd-stat-vehicle">
                {customer.services?.length > 0
                  ? `${customer.services[0].car.make} ${customer.services[0].car.model}`
                  : "N/A"}
              </span>
              <br />
              <span className="cd-stat-content">Latest Service Date</span>
            </div>
          </div>

        </div>

        {/* ================= RIGHT MAIN CONTENT PANELS ================= */}
        <div className="cd-right-content">
          
          

          {/* Registered Vehicles List */}
          <div className="cd-vehicles">
            <div className="cd-vehicles-title">
              <FaCarSide className="cd-section-icon" /> Registered Vehicles List
            </div>
            <div className="cd-vehicle-list">
              {getUniqueVehicles().map((vehicle) => (
                <div className="cd-vehicle-item" key={vehicle.registrationNo}>
                  <div className="vehicle-make-model">
                    {vehicle.make} {vehicle.model}&nbsp;&nbsp;{vehicle.registrationNo}
                </div>
                  </div>
                 
              ))}
            </div>
          </div>

          {/* Service History Panel (Clean Box containing ONLY table layout) */}
          <div className="cd-service-history">
            <div className="cd-service-header">
              <div className="cd-service-title-container">
                <div className="cd-service-title">Service History</div>
                <div className="cd-service-vehicle">
                  {selectedVehicleId === "all"
                    ? "All Vehicles"
                    : `${
                        customer.services.find(
                          (s) => s.car.registrationNo === selectedVehicleId
                        )?.car.make
                      } ${
                        customer.services.find(
                          (s) => s.car.registrationNo === selectedVehicleId
                        )?.car.model
                      }`}
                </div>
              </div>
              <div className="brand-select">
                <select
                  value={selectedVehicleId}
                  onChange={handleVehicleSelectChange}
                >
                  <option value="all">All Vehicles</option>
                  {getUniqueVehicles().map((v) => (
                    <option key={v.registrationNo} value={v.registrationNo}>
                      {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="cd-table-wrapper">
              <table className="cd-service-table">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Registration No.</th>
                    <th>Mileage</th>
                    <th>Description</th>
                    <th>Cost</th>
                    <th>Service Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.length > 0 ? (
                    filteredServices.map((service, idx) => (
                      <tr key={service._id || idx}>
                        <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                        <td>{service.car.registrationNo}</td>
                        <td>{service.car.mileage} km</td>
                        <td>{service.description}</td>
                        <td>₹{service.cost}</td>
                        <td>
                          {new Date(service.serviceDate).toLocaleDateString()}
                        </td>
                        <td>
                          <Link
  to={`/services/service-detail/${service._id}`}
  className="icon-btn"
  title="View Details"
>
  <AiOutlineEye className="icon" style={{ color: "#125CAF" }} />
</Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                        No services found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination parameters shifted to an outer standalone layout box block */}
          {totalPages > 0 && (
            <div className="outer-pagination-container">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                showOnSeparatePage={totalPages >= 3}
                pageSize={itemsPerPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default CustomerDetails;