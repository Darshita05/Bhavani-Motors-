import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { AiOutlineEye } from 'react-icons/ai';
import { ToastContainer } from 'react-toastify';
import { showToast } from '../components/ToasterService';
import 'react-toastify/dist/ReactToastify.css';
 
import { useLoading } from '../context/LoadingContext';
import '../style/Customers.css';
import CustomerModal from '../components/CustomerModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { apiService } from '../services/apiService';
import Pagination from '../components/Pagination';

const Customers = () => {
  const [showCustomer, setShowCustomer] = useState(false);
  const [showVehicle, setShowVehicle] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { setIsLoading } = useLoading();

  // Mobile Accordion State to track which card is expanded
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
    { value: '12', label: 'December' },
  ];

  const years = Array.from({ length: 10 }, (_, i) => ({
    value: (new Date().getFullYear() - i).toString(),
    label: (new Date().getFullYear() - i).toString()
  }));

  const fetchCustomers = async () => {
    try {
      const fullRes = await apiService.get(`/api/customers/get/pagination?page=1&limit=10000`);

      if (fullRes?.customers) {
        setAllCustomers(fullRes.customers);
    
        let filteredCustomers = fullRes.customers;
        
        if (selectedMonth || selectedYear) {
          filteredCustomers = filteredCustomers.filter(customer => {
            const customerDate = new Date(customer.createdAt);
            const selectedYearNum = parseInt(selectedYear);
            const selectedMonthNum = parseInt(selectedMonth);
            
            if (selectedYear && customerDate.getFullYear() !== selectedYearNum) {
              return false;
            }
            
            if (selectedMonth && customerDate.getMonth() + 1 !== selectedMonthNum) {
              return false;
            }
             
            return true;
          });
        }

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedCustomers = filteredCustomers.slice(start, end);

        setUsers(paginatedCustomers);
        setFilteredUsers(filteredCustomers);
        setTotalPages(Math.ceil(filteredCustomers.length / itemsPerPage));
      } else {
        setAllCustomers([]);
        setUsers([]);
        setFilteredUsers([]);
        setTotalPages(1);
        setError('Failed to load customers.');
      }

    } catch (err) {
      console.error('Fetch Error:', err);
      setError('Failed to fetch customers.');
      setUsers([]);
      setFilteredUsers([]);
      setAllCustomers([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchCustomers().finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchCustomers();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, itemsPerPage]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredUsers(users);                    
      return;
    }

     const searchTerm = query.toLowerCase();

    const filtered = allCustomers.filter(user => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const email = user.email?.toLowerCase() || '';
      const phoneNumber = user.phoneNumber?.toString() || '';
      const address = user.address?.toLowerCase() || '';

      return (
        fullName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        phoneNumber.includes(searchTerm) ||
        address.includes(searchTerm)
      );
    });

    setFilteredUsers(filtered);
  };

  useEffect(() => { 
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    }
  }, [users, searchQuery]);

  const handleMonthChange = (e) => setSelectedMonth(e.target.value);
  const handleYearChange = (e) => setSelectedYear(e.target.value);

  const handleEditClick = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomer(true);
};

  const handleDeleteClick = (customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;

    setIsLoading(true);
    try {
      const customerId = selectedCustomer._id || selectedCustomer.id;
      await apiService.delete(`/api/customers/delete/${customerId}`);
      showToast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (err) {
      showToast.error("Failed to delete customer");
    } finally {
      setShowDeleteModal(false);
      setSelectedCustomer(null);
      setIsLoading(false);
    }
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setSelectedCustomer(null);
  };

  const handleCustomerAdded = () => {
    fetchCustomers();
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePageSizeChange = (size) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  // Toggle mobile card accordion
  const toggleCard = (id) => {
    if (expandedCardId === id) {
      setExpandedCardId(null);
    } else {
      setExpandedCardId(id);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" />
      <div className='customer-section'>
        {error && <div className="error-message">{error}</div>}

        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">Customer</h1>
          </div>
          <div className="header-right">
<button
    className="add-customer-button"
    onClick={() => {
        setSelectedCustomer(null);
        setShowCustomer(true);
    }}
>              <FiPlus className="plus-icon" /> Add Customer
            </button>
           {showCustomer && (
    <CustomerModal
        customer={selectedCustomer}
        onClose={() => {
            setShowCustomer(false);
            setSelectedCustomer(null);
        }}
        onCustomerAdded={handleCustomerAdded}
    />
)}
            {showVehicle && <AddVehicleModal onClose={() => setShowVehicle(false)} />}
          </div>
        </div>

        {/* Top Search and Filters Section */}
        <div className='search-container'>
          <div className="search-box">
            <span className="search-icon"><FiSearch /></span>
            <input
              type="text"
              className="search-input"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <div className="filter-box">
            <select className="filter-select" value={selectedMonth} onChange={handleMonthChange}>
              {months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
            </select>
            <select className="filter-select" value={selectedYear} onChange={handleYearChange}>
              {years.map(year => <option key={year.value} value={year.value}>{year.label}</option>)}
            </select>
          </div>
        </div>

        {/* Core List View Section */}
        <div className="list-container">
          {/* Desktop List Columns Headers (Hidden on Mobile) */}
          <div className="list-header-row desktop-only-header">
            <div className="col-sr">SR No</div>
            <div className="col-name">Customer Name</div>
            <div className="col-email">Email</div>
            <div className="col-phone">Phone Number</div>
            <div className="col-address">Address</div>
            <div className="col-actions">Actions</div>
          </div>

          {/* Cards Body Wrapper */}
          <div className="cards-wrapper">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => {
                const customerId = user._id || user.id;
                const isExpanded = expandedCardId === (customerId || index);
                return (
                  <div 
                    className={`customer-card-row ${isExpanded ? 'card-expanded' : ''}`} 
                   key={customerId || `user-row-${index}`}
                  >
                    {/* Desktop Layout Structure */}
                    <div className="desktop-grid-layout">
                      <div className="col-sr">
                        <span className="sr-badge">{index + 1}</span>
                      </div>
                      <div className="col-name font-semibold">
                        {`${user.firstName || ''} ${user.lastName || ''}`}
                      </div>
                      <div className="col-email text-muted">{user.email || '-'}</div>
                      <div className="col-phone">{user.phoneNumber || '-'}</div>
                      <div className="col-address text-muted">{user.address || '-'}</div>
                      <div className="col-actions">
                        <div className="action-icons">
                          {customerId ? (
                            <>
                              <Link to={`/customers/customer-detail/${customerId}`} className="icon-btn" title="View Details">
                                <AiOutlineEye className="icon view-icon" />
                              </Link>
                              <button className="icon-btn" title="Edit" onClick={() => handleEditClick(user)}>
                                <FiEdit2 className="icon edit-icon" />
                              </button>
                              <button className="icon-btn" title="Delete" onClick={() => handleDeleteClick(user)}>
                                <FiTrash2 className="icon delete-icon" />
                              </button>
                            </>
                          ) : (
                            <span className="no-id">No actions</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mobile Modern Responsive Layout (Accordion View Like Image 3) */}
<div
    className="mobile-accordion-layout"
    onClick={() => toggleCard(customerId || index)}
>                      <div className="mobile-card-header" >
                        <div className="mobile-header-left">
                          <button className={`mobile-toggle-btn ${isExpanded ? 'rotated' : ''}`}>
                            <FiChevronDown />
                          </button>
                          <div className="mobile-customer-info">
                            <span className="mobile-label">Name</span>
                            <span className="mobile-value-name">{`${user.firstName || ''} ${user.lastName || ''}`}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Content Area */}
                      {isExpanded && (
                        <div className="mobile-card-body">
                          <div className="mobile-data-row">
                            <span className="mobile-row-label">Email</span>
                            <span className="mobile-row-value text-muted">{user.email || '-'}</span>
                          </div>
                          <div className="mobile-data-row">
                            <span className="mobile-row-label">Phone Number</span>
                            <span className="mobile-row-value">{user.phoneNumber || '-'}</span>
                          </div>
                          <div className="mobile-data-row">
                            <span className="mobile-row-label">Address</span>
                            <span className="mobile-row-value text-muted">{user.address || '-'}</span>
                          </div>
                          <div className="mobile-data-row mobile-actions-row">
                            <span className="mobile-row-label">Action</span>
                            <div className="mobile-action-icons">
                            {customerId ? (
                                <>
                                  <Link to={`/customers/customer-detail/${customerId}`} className="mobile-icon-btn blue-btn" title="View Details">
                                    <AiOutlineEye />
                                  </Link>
                                  <button className="mobile-icon-btn edit-btn" title="Edit" onClick={() => handleEditClick(user)}>
                                    <FiEdit2 />
                                  </button>
                                  <button className="mobile-icon-btn delete-btn" title="Delete" onClick={() => handleDeleteClick(user)}>
                                    <FiTrash2 />
                                  </button>
                                </>
                              ) : (
                                <span className="no-id">No actions</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="no-data-card">No customers found</div>
            )}
          </div>
        </div>

        {/* Modern Pagination Section */}
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

        {showDeleteModal && selectedCustomer && (
          <DeleteConfirmationModal
            onClose={handleDeleteModalClose}
            onConfirm={handleDeleteConfirm}
            customer={selectedCustomer}
          />
        )}
      </div>
    </>
  );
};

export default Customers;