import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    FiPlus, 
    FiEdit2, 
    FiTrash2, 
    FiSearch, 
    FiMail, 
    FiPhone, 
    FiExternalLink
} from 'react-icons/fi';
import { AiOutlineEye } from 'react-icons/ai';
import { showToast } from '../components/ToasterService';
import { useLoading } from '../context/LoadingContext';
import { apiService } from '../services/apiService';

import AddStaffModal from '../components/AddStaffModal';
import EditStaffModal from '../components/EditStaffModal';
import StaffDetailModal from '../components/StaffDetailModal';
import StaffAssignedJobsModal from '../components/StaffAssignedJobsModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import Pagination from '../components/Pagination';
import socket from '../socket';

import '../style/Staff.css';

const Staff = () => {
    const { setIsLoading } = useLoading();

    // Data States
    const [staffList, setStaffList] = useState([]);
    const [allJobCards, setAllJobCards] = useState([]);
    const [error, setError] = useState(null);

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showJobsModal, setShowJobsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDesignation, setSelectedDesignation] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const designations = [
        'All',
        'Mechanic',
        'Service Advisor',
        'Technician',
        'Electrician',
        'Helper',
        'Other'
    ];

    // ==========================================
    // FETCH STAFF & JOB CARDS
    // ==========================================
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [staffRes, jobRes] = await Promise.all([
                apiService.get('/api/users/staff').catch(async () => {
                    try {
                        const fallback = await apiService.get('/api/users/getall');
                        return { staff: fallback?.data?.users || fallback?.users || [] };
                    } catch {
                        return { staff: [] };
                    }
                }),
                apiService.get('/api/job-cards').catch(() => ({ data: [] }))
            ]);

            const rawStaff = staffRes?.data?.staff || staffRes?.staff || (Array.isArray(staffRes) ? staffRes : []);
            const rawJobs = jobRes?.data || (Array.isArray(jobRes) ? jobRes : []);

            setAllJobCards(rawJobs);

            const processedStaff = rawStaff.map((staffMember) => {
                const staffIdStr = String(staffMember._id || staffMember.id || '');
                const staffNameLower = (staffMember.name || '').trim().toLowerCase();

                const assigned = rawJobs.filter((job) => {
                    if (!job.assignedTo) return false;

                    if (typeof job.assignedTo === 'object') {
                        const assignedId = String(job.assignedTo._id || job.assignedTo.id || '');
                        const assignedName = (job.assignedTo.name || '').trim().toLowerCase();

                        if (assignedId && staffIdStr && assignedId === staffIdStr) return true;
                        if (assignedName && staffNameLower && assignedName === staffNameLower) return true;
                    }

                    if (typeof job.assignedTo === 'string') {
                        const assignedStr = job.assignedTo.trim();
                        if (assignedStr === staffIdStr) return true;
                        if (assignedStr.toLowerCase() === staffNameLower) return true;
                    }

                    return false;
                });

                return {
                    ...staffMember,
                    assignedJobs: assigned,
                    assignedJobsCount: assigned.length,
                };
            });

            setStaffList(processedStaff);

        } catch (err) {
            console.error('Fetch Data Error:', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to load staff data');
            showToast.error('Failed to load staff data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const handleRealtimeUpdate = () => {
            fetchData();
        };

        socket.on("jobCardUpdated", handleRealtimeUpdate);
        socket.on("jobUpdated", handleRealtimeUpdate);
        socket.on("jobStatusChanged", handleRealtimeUpdate);
        socket.on("jobAssigned", handleRealtimeUpdate);
        socket.on("jobRemoved", handleRealtimeUpdate);

        return () => {
            socket.off("jobCardUpdated", handleRealtimeUpdate);
            socket.off("jobUpdated", handleRealtimeUpdate);
            socket.off("jobStatusChanged", handleRealtimeUpdate);
            socket.off("jobAssigned", handleRealtimeUpdate);
            socket.off("jobRemoved", handleRealtimeUpdate);
        };
    }, []);

    // ==========================================
    // FILTERING LOGIC
    // ==========================================
    const filteredStaff = useMemo(() => {
        return staffList.filter((item) => {
            const query = searchQuery.trim().toLowerCase();
            const nameMatch = (item.name || '').toLowerCase().includes(query);
            const emailMatch = (item.email || '').toLowerCase().includes(query);
            const phoneMatch = (item.phone || '').includes(query);
            const desMatch = (item.designation || '').toLowerCase().includes(query);

            const assignedJobs = item.assignedJobs || [];
            const vehicleMatch = assignedJobs.some((j) => {
                const car = j.carId || {};
                const customer = j.customerId || {};
                const regNo = (car.registrationNo || car.numberPlate || car.carNumber || '').toLowerCase();
                const makeModel = `${car.make || ''} ${car.model || ''}`.toLowerCase();
                const jcNum = (j.jobCardNumber || '').toLowerCase();
                const custName = `${customer.firstName || ''} ${customer.lastName || ''}`.toLowerCase();

                return regNo.includes(query) || makeModel.includes(query) || jcNum.includes(query) || custName.includes(query);
            });

            const matchesSearch = !query || (nameMatch || emailMatch || phoneMatch || desMatch || vehicleMatch);

            const matchesDesignation = 
                selectedDesignation === 'All' || 
                (item.designation || '').toLowerCase() === selectedDesignation.toLowerCase();

            const matchesStatus = 
                selectedStatus === 'All' ||
                (selectedStatus === 'Active' && item.isActive) ||
                (selectedStatus === 'Inactive' && !item.isActive);

            return matchesSearch && matchesDesignation && matchesStatus;
        });
    }, [staffList, searchQuery, selectedDesignation, selectedStatus]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredStaff.length / itemsPerPage));
    const paginatedStaff = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStaff.slice(start, start + itemsPerPage);
    }, [filteredStaff, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedDesignation, selectedStatus]);

    // ==========================================
    // ACTION HANDLERS
    // ==========================================
    const handleViewStaff = (staff) => {
        setSelectedStaff(staff);
        setShowDetailModal(true);
    };

    const handleViewJobs = (staff) => {
        setSelectedStaff(staff);
        setShowJobsModal(true);
    };

    const handleEditStaff = (staff) => {
        setSelectedStaff(staff);
        setShowEditModal(true);
    };

    const handleDeleteClick = (staff) => {
        setSelectedStaff(staff);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!selectedStaff) return;
        try {
            setIsLoading(true);
            const staffId = selectedStaff._id || selectedStaff.id;
            await apiService.delete(`/api/users/deleteuser/${staffId}`);
            showToast.success('Staff member removed successfully');
            setShowDeleteModal(false);
            setSelectedStaff(null);
            fetchData();
        } catch (err) {
            console.error('Error deleting staff:', err);
            showToast.error(err?.response?.data?.message || err?.message || 'Failed to delete staff member');
        } finally {
            setIsLoading(false);
        }
    };

    const getInitials = (name = '') => {
        return name
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'ST';
    };

    const getStatusClass = (status = '') => {
        const s = (status || '').toLowerCase();
        if (s === 'delivered' || s === 'completed') return 'status-delivered';
        if (s === 'in progress') return 'status-progress';
        if (s === 'pending') return 'status-pending';
        return 'status-pending';
    };

    const getDesignationTheme = (des = '') => {
        switch (des?.toLowerCase()) {
            case 'mechanic': return 'theme-mechanic';
            case 'service advisor': return 'theme-advisor';
            case 'technician': return 'theme-technician';
            case 'electrician': return 'theme-electrician';
            case 'helper': return 'theme-helper';
            default: return 'theme-default';
        }
    };

    return (
        <div className="staff-main-section">
            
            {/* 1. Header */}
            <div className="dashboard-header compact-header">
                <div className="header-left">
                    <h1 className="dashboard-title">Staff Management</h1>
                </div>
                <div className="header-right">
                    <button 
                        className="add-customer-button compact-btn" 
                        onClick={() => setShowAddModal(true)}
                    >
                        <FiPlus className="plus-icon" />
                        Add Staff
                    </button>
                </div>
            </div>

            {/* 2. Search & Filter Bar */}
            <div className="job-search-container compact-search">
                <div className="job-search-box compact-input-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search Staff, Car Plate Number..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="job-filter-box">
                    <select
                        className="filter-select compact-select"
                        value={selectedDesignation}
                        onChange={(e) => setSelectedDesignation(e.target.value)}
                    >
                        <option value="All">All Designations</option>
                        {designations.filter(d => d !== 'All').map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>

                    <select
                        className="filter-select compact-select"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="staff-error-banner">
                    {error}
                </div>
            )}

            {/* 3. Main Staff List Container */}
            <div className="job-list-container compact-container">
                
                {/* Desktop Header Row */}
                <div className="job-list-header compact-header-row">
                    <div style={{ width: '6%', textAlign: 'center' }}>SR NO</div>
                    <div style={{ width: '24%' }}>STAFF MEMBER</div>
                    <div style={{ width: '15%' }}>DESIGNATION</div>
                    <div style={{ width: '36%' }}>ASSIGNED VEHICLE</div>
                    <div style={{ width: '10%', textAlign: 'center' }}>STATUS</div>
                    <div style={{ width: '9%', textAlign: 'center' }}>ACTIONS</div>
                </div>

                {/* Staff Rows */}
                <div className="job-list-items">
                    {paginatedStaff.length > 0 ? (
                        paginatedStaff.map((staff, index) => {
                            const srNo = (currentPage - 1) * itemsPerPage + index + 1;
                            const assignedJobs = staff.assignedJobs || [];

                            return (
                                <div key={staff._id || staff.id} className="job-card-row compact-row">
                                    <div className="job-desktop-grid compact-grid">
                                        
                                        {/* Serial Number */}
                                        <div style={{ width: '6%', display: 'flex', justifyContent: 'center' }}>
                                            <div className="staff-sr-badge">
                                                {srNo}
                                            </div>
                                        </div>

                                        {/* Staff Member Info */}
                                        <div style={{ width: '24%', paddingRight: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="staff-avatar-circle">
                                                    {getInitials(staff.name)}
                                                </div>
                                                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                    <div className="staff-member-name text-truncate">{staff.name}</div>
                                                    <div className="staff-member-email text-truncate">
                                                        <FiMail size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                                        {staff.email}
                                                    </div>
                                                    {staff.phone && (
                                                        <div className="staff-member-phone text-truncate">
                                                            <FiPhone size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                                            {staff.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Designation */}
                                        <div style={{ width: '15%' }}>
                                            <span className={`staff-clean-designation ${getDesignationTheme(staff.designation)}`}>
                                                {staff.designation || 'Mechanic'}
                                            </span>
                                        </div>

                                        {/* 🚗 Assigned Vehicles (Only Car Number + Job Card + Status; Clickable to see full details!) */}
                                        <div style={{ width: '36%', paddingRight: '8px' }}>
                                            {assignedJobs.length > 0 ? (
                                                <div className="assigned-chips-wrapper">
                                                    {/* Primary/First Vehicle Badge */}
                                                    {(() => {
                                                        const firstJob = assignedJobs[0];
                                                        const car = firstJob.carId || {};
                                                        const carPlate = car.registrationNo || car.numberPlate || car.carNumber || 'Vehicle';

                                                        return (
                                                            <div 
                                                                className="compact-vehicle-chip"
                                                                onClick={() => handleViewJobs(staff)}
                                                                title="Click to view full vehicle and customer details"
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                <span className="chip-car-plate">
                                                                    🚗 <strong>{carPlate}</strong>
                                                                </span>
                                                                <span className="chip-divider">•</span>
                                                                <span className="chip-jc-tag">
                                                                    {firstJob.jobCardNumber}
                                                                </span>
                                                                <span className={`clean-job-status-pill chip-status ${getStatusClass(firstJob.status)}`}>
                                                                    {firstJob.status || 'Pending'}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* +more button: Click opens modal with customer name, car model, etc. */}
                                                    {assignedJobs.length > 1 && (
                                                        <button 
                                                            className="more-vehicles-badge-btn"
                                                            onClick={() => handleViewJobs(staff)}
                                                            title="Click to view all assigned cars, customer names, and details"
                                                        >
                                                            +{assignedJobs.length - 1} more
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="no-car-assigned-text">
                                                    — No vehicle assigned
                                                </span>
                                            )}
                                        </div>

                                        {/* Status */}
                                        <div style={{ width: '10%', textAlign: 'center' }}>
                                            <span className={`clean-status-tag ${staff.isActive ? 'active' : 'inactive'}`}>
                                                <span className="status-live-dot"></span>
                                                {staff.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ width: '9%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                            <button 
                                                className="action-icon-btn"
                                                onClick={() => handleViewStaff(staff)}
                                                title="View Profile"
                                            >
                                                <AiOutlineEye className="action-icon view" />
                                            </button>
                                            <button 
                                                className="action-icon-btn"
                                                onClick={() => handleEditStaff(staff)}
                                                title="Edit Staff"
                                            >
                                                <FiEdit2 className="action-icon edit" />
                                            </button>
                                            <button 
                                                className="action-icon-btn"
                                                onClick={() => handleDeleteClick(staff)}
                                                title="Delete Staff"
                                            >
                                                <FiTrash2 className="action-icon delete" />
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ textAlign: 'center', padding: '30px 20px', color: '#64748b' }}>
                            No staff members found.
                        </div>
                    )}
                </div>

            </div>

            {/* Pagination */}
            {filteredStaff.length > itemsPerPage && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredStaff.length}
                    onPageSizeChange={(size) => {
                        setItemsPerPage(size);
                        setCurrentPage(1);
                    }}
                />
            )}

            {/* MODALS */}
            {showAddModal && (
                <AddStaffModal
                    onClose={() => setShowAddModal(false)}
                    onStaffAdded={fetchData}
                />
            )}

            {showEditModal && selectedStaff && (
                <EditStaffModal
                    staff={selectedStaff}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedStaff(null);
                    }}
                    onStaffUpdated={fetchData}
                />
            )}

            {showDetailModal && selectedStaff && (
                <StaffDetailModal
                    staff={selectedStaff}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedStaff(null);
                    }}
                    onEdit={(staff) => {
                        setSelectedStaff(staff);
                        setShowEditModal(true);
                    }}
                />
            )}

            {/* ASSIGNED JOBS MODAL: Shows Customer Name, Car Model, Phone, All Details when clicked! */}
            {showJobsModal && selectedStaff && (
                <StaffAssignedJobsModal
                    staff={selectedStaff}
                    onClose={() => {
                        setShowJobsModal(false);
                        setSelectedStaff(null);
                    }}
                />
            )}

            {showDeleteModal && selectedStaff && (
                <DeleteConfirmationModal
                    customer={{ name: selectedStaff.name }}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedStaff(null);
                    }}
                    onConfirm={confirmDelete}
                />
            )}

        </div>
    );
};

export default Staff;