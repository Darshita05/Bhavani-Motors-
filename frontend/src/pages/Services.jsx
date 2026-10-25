import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { AiOutlineEye } from 'react-icons/ai';

import '../style/Services.css';
import AddVehicleModal from '../components/AddVehicleModal';
import { apiService } from '../services/apiService';
import { useLoading } from '../context/LoadingContext';
import Pagination from '../components/Pagination';

const Services = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [error, setError] = useState(null);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [addVehicleModalProps, setAddVehicleModalProps] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { setIsLoading } = useLoading();

  // Mobile Card Accordion Expand/Collapse State
  const [expandedCardId, setExpandedCardId] = useState(null);

  const months = [
    { value: '', label: 'Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => ({
    value: (new Date().getFullYear() - i).toString(),
    label: (new Date().getFullYear() - i).toString()
  }));

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage
      });

      if (selectedMonth) queryParams.append('month', selectedMonth);
      if (selectedYear) queryParams.append('year', selectedYear);

      const response = await apiService.get(`/api/services/get/pagination?${queryParams.toString()}`);
      console.log("SERVICES API RESPONSE:", response);
      console.log("FIRST SERVICE:", response?.services?.[0]);
      if (response) {
        const data = response;
        if (data && data.services) {
          setVehicles(data.services || []);
          setFilteredVehicles(data.services || []);
          setTotalPages(data.totalPages || 1);
        } else {
          console.error('Invalid API response:', data);
          setVehicles([]);
          setFilteredVehicles([]);
          setTotalPages(1);
          setError('Failed to load services. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError(err.response?.data?.message || 'Failed to fetch services. Please try again later.');
      setVehicles([]);
      setFilteredVehicles([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchVehicles().finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [currentPage, selectedMonth, selectedYear, itemsPerPage]);

  useEffect(() => {
    // Filter vehicles based on search query, month, and year
    const filterVehicles = (vehiclesList) => {
      let filtered = [...vehiclesList];

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(vehicle =>
          vehicle.car?.registrationNo?.toLowerCase().includes(query) ||
          vehicle.car?.make?.toLowerCase().includes(query) ||
          vehicle.car?.brand?.toLowerCase().includes(query) ||
          vehicle.serviceDescription?.toLowerCase().includes(query) ||
          vehicle.charges?.toString().includes(query) ||
          vehicle.serviceDate?.toLowerCase().includes(query) ||
          vehicle.dueDate?.toLowerCase().includes(query)
        );
      }

      if (selectedMonth || selectedYear) {
        filtered = filtered.filter(vehicle => {
          if (!vehicle.serviceDate) return false;
          const date = new Date(vehicle.serviceDate);
          const vehicleMonth = date.getMonth() + 1;
          const vehicleYear = date.getFullYear();

          if (selectedMonth && selectedYear) {
            return vehicleMonth === parseInt(selectedMonth) && vehicleYear === parseInt(selectedYear);
          } else if (selectedMonth) {
            return vehicleMonth === parseInt(selectedMonth);
          } else if (selectedYear) {
            return vehicleYear === parseInt(selectedYear);
          }
          return true;
        });
      }

      return filtered;
    };

    setFilteredVehicles(filterVehicles(vehicles));
  }, [searchQuery, vehicles, selectedMonth, selectedYear]);

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setCurrentPage(1);
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    setCurrentPage(1);
  };

  const getVehicleData = () => {
    return filteredVehicles;
  };

  const formatServiceDate = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const retryFetch = () => {
    fetchVehicles();
  };

  const handleAddService = () => {
    setIsAddVehicleModalOpen(true);
    setAddVehicleModalProps({
      onClose: () => setIsAddVehicleModalOpen(false),
      selectedCustomer: null,
      refreshCustomers: () => {
        fetchVehicles();
      }
    });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!value.trim()) {
      setSelectedMonth('');
      setSelectedYear('');
      setCurrentPage(1);
      fetchVehicles();
      return;
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchVehicles();
    }, 500);

    setSearchTimeout(timeout);
  };

  const handlePageChange = (page) => {
    if (page === currentPage) return;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  const toggleCard = (id) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  // Math Calculations for totals
  const totalCharges = filteredVehicles.reduce((sum, s) => sum + Number(s.cost || 0), 0);
  const totalCollected = filteredVehicles.reduce((sum, s) => sum + Number(s.collectedCost ?? s.collectedAmount ?? s.paid ?? 0), 0);
  const totalPending = filteredVehicles.reduce((sum, s) => sum + Math.max(0, Number(s.cost || 0) - Number(s.collectedCost ?? s.collectedAmount ?? s.paid ?? 0)), 0);

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={retryFetch} className="retry-button" style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="services-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">Services</h1>
        </div>
        <div className="header-right">
          <button className="add-customer-button" onClick={handleAddService}>
            <FiPlus className="plus-icon" /> Add Service
          </button>
          {isAddVehicleModalOpen && <AddVehicleModal {...addVehicleModalProps} />}
        </div>
      </div>

      {/* Top Filter & Search Section with Blue Border */}
      <div className="search-container">
        <div className="search-box">
          <span className="search-icon"><FiSearch /></span>
          <input
            type="text"
            placeholder="Search by registration number, description or date"
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>

        <div className="filter-box">
          <select value={selectedMonth} onChange={handleMonthChange} className="filter-select">
            {months.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
          </select>
          <select value={selectedYear} onChange={handleYearChange} className="filter-select">
            {years.map((year) => <option key={year.value} value={year.value}>{year.label}</option>)}
          </select>
        </div>
      </div>

      {/* Core Dynamic Content Container */}
      <div className="container">

        {/* DESKTOP ONLY VIEW (Traditional Table Grid Structure) */}
        <div className="desktop-only-view customer-table-scroll">
          <table className="vehicle-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Vehicle Number</th>
                <th>Vehicle Make/Brand</th>
                <th>Service Description</th>
                <th>Charges</th>
                <th>Pending</th>
                <th>Collected</th>
                <th>Service Date</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getVehicleData().map((service, index) => {
                const charges = Number(service.cost || 0);
                const collected = Number(service.collectedCost ?? service.collectedAmount ?? service.paid ?? 0);
                const pending = Math.max(0, charges - collected);

                return (
                  <tr key={service.id || index}>
                    <td>{(currentPage - 1) * itemsPerPage + (index + 1)}</td>
                    <td className="font-semibold">{service.carId?.registrationNo || '-'}</td>
                    <td>{service.carId?.make || '-'}</td>
                    <td>{service.description}</td>
                    <td>₹{charges}</td>
                    <td><span className={pending > 0 ? 'text-red' : ''}>₹{pending}</span></td>
                    <td><span className={collected > 0 ? 'text-green' : ''}>₹{collected}</span></td>
                    <td>{service.serviceDate ? formatServiceDate(service.serviceDate) : '-'}</td>
                    <td>{service.dueDate ? formatServiceDate(service.dueDate) : '-'}</td>
                    <td>
                      <div className="action-icons">
                        <div className="mobile-action-icons">
                          <Link
                            to={`/services/service-detail/${service._id}`}
                            className="mobile-icon-btn blue-btn"
                            title="View Details"
                          >
                            <AiOutlineEye />
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, background: '#f0f4ff', borderTop: '2px solid #c7d2fe' }}>
                <td colSpan={4} style={{ textAlign: 'right', padding: '10px 12px', color: '#374151' }}>
                  Total ({filteredVehicles.length} records)
                </td>
                <td style={{ padding: '10px 12px', color: '#1d4ed8' }}>₹{totalCharges.toLocaleString('en-IN')}</td>
                <td style={{ padding: '10px 12px', color: '#dc2626' }}>₹{totalPending.toLocaleString('en-IN')}</td>
                <td style={{ padding: '10px 12px', color: '#16a34a' }}>₹{totalCollected.toLocaleString('en-IN')}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* MOBILE ONLY VIEW (Clean Modern Accordion Layout Style) */}
        <div className="mobile-only-view cards-wrapper">
          {getVehicleData().length > 0 ? (
            getVehicleData().map((service, index) => {
              console.log("SERVICE OBJECT:", service);
              const charges = Number(service.cost || 0);
              const collected = Number(service.collectedCost ?? service.collectedAmount ?? service.paid ?? 0);
              const pending = Math.max(0, charges - collected);
              const isExpanded = expandedCardId === (service.id || index);
              const srNo = (currentPage - 1) * itemsPerPage + (index + 1);

              return (
                <div className={`customer-card-row ${isExpanded ? 'card-expanded' : ''}`} key={service.id || `service-${index}`}>
                  <div className="mobile-card-header" onClick={() => toggleCard(service.id || index)}>
                    <div className="mobile-header-left">
                      <button className={`mobile-toggle-btn ${isExpanded ? 'rotated' : ''}`}>
                        <FiChevronDown />
                      </button>
                      <div className="mobile-customer-info">
                        <span className="mobile-label">Vehicle No ({srNo})</span>
                        <span className="mobile-value-name">{service.car?.registrationNo || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mobile-card-body">
                      <div className="mobile-data-row">
                        <span className="mobile-row-label">Make/Brand</span>
                        <span className="mobile-row-value">{service.car?.make} {service.car?.brand}</span>
                      </div>
                      <div className="mobile-data-row">
                        <span className="mobile-row-label">Description</span>
                        <span className="mobile-row-value text-muted">{service.description || '-'}</span>
                      </div>
                      <div className="mobile-data-row">
                        <span className="mobile-row-label">Charges</span>
                        <span className="mobile-row-value font-semibold">₹{charges}</span>
                      </div>
                      <div className="mobile-data-row">
                        <span className="mobile-row-label">Pending</span>
                        <span className="mobile-row-value text-red">₹{pending}</span>
                      </div>
                      <div className="mobile-data-row">
                        <span className="mobile-row-label">Collected</span>
                        <span className="mobile-row-value text-green">₹{collected}</span>
                      </div>
                      <div className="mobile-data-row">
                        <span className="mobile-row-label">Service Date</span>
                        <span className="mobile-row-value">{service.serviceDate ? formatServiceDate(service.serviceDate) : '-'}</span>
                      </div>
                      <div className="mobile-data-row">
                        <span className="mobile-row-label">Due Date</span>
                        <span className="mobile-row-value">{service.dueDate ? formatServiceDate(service.dueDate) : '-'}</span>
                      </div>
                      <div className="mobile-data-row mobile-actions-row">
                        <span className="mobile-row-label">Action</span>
                        <div className="mobile-action-icons">
                          <div className="mobile-action-icons">
                            <Link
                              to={`/services/service-detail/${service._id}`}
                              className="mobile-icon-btn blue-btn"
                              title="View Details"
                            >
                              <AiOutlineEye />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="no-data-card">No services found</div>
          )}

          {/* Mobile Floating Total Summary Sheet Card */}
          {getVehicleData().length > 0 && (
            <div className="mobile-totals-summary-card">
              <h3 className="summary-title">Total Summary</h3>
              <div className="summary-row" style={{ color: "black" }} ><span>Total Charges:</span><span className="blue-text">₹{totalCharges.toLocaleString('en-IN')}</span></div>
              <div className="summary-row" style={{ color: "black" }}><span>Total Pending:</span><span className="red-text">₹{totalPending.toLocaleString('en-IN')}</span></div>
              <div className="summary-row" style={{ color: "black" }}><span>Total Collected:</span><span className="green-text">₹{totalCollected.toLocaleString('en-IN')}</span></div>
            </div>
          )}
        </div>

      </div>

      {/* Pagination Container */}
      {totalPages > 0 && (
        <div className="pagination-wrapper-container">
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
  );
};

export default Services;