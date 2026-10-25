import React from 'react';
import { Link } from 'react-router-dom';
import { 
    FiClipboard, 
    FiUser, 
    FiPhone, 
    FiCheckCircle, 
    FiClock, 
    FiArrowRight, 
    FiExternalLink,
    FiTool
} from 'react-icons/fi';
import './Modal.css';

const StaffAssignedJobsModal = ({ staff, onClose }) => {
    if (!staff) return null;

    const assignedJobs = staff.assignedJobs || [];
    const activeJobs = assignedJobs.filter(j => j.status === 'Pending' || j.status === 'In Progress');
    const completedJobs = assignedJobs.filter(j => j.status === 'Completed' || j.status === 'Delivered');

    const getStatusClass = (status = '') => {
        switch (status.toLowerCase()) {
            case 'in progress': return 'job-status-progress';
            case 'completed': return 'job-status-completed';
            case 'delivered': return 'job-status-delivered';
            case 'pending': return 'job-status-pending';
            default: return 'job-status-default';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                
                {/* Modal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px'
                        }}>
                            <FiTool />
                        </div>
                        <div>
                            <h2 className="modal-title" style={{ margin: 0, fontSize: '18px' }}>
                                Assigned Tasks – {staff.name}
                            </h2>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                {staff.designation || 'Staff'} • {staff.email}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
                    >
                        &times;
                    </button>
                </div>

                {/* Summary Badges Row */}
                <div style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    marginBottom: '16px',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>
                        Total Assigned: <strong>{assignedJobs.length}</strong>
                    </span>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#d97706' }}>
                        In Progress / Pending: <strong>{activeJobs.length}</strong>
                    </span>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#059669' }}>
                        Completed: <strong>{completedJobs.length}</strong>
                    </span>
                </div>

                {/* Assigned Job Cards List */}
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    paddingRight: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    maxHeight: '420px',
                    marginBottom: '16px'
                }}>
                    {assignedJobs.length > 0 ? (
                        assignedJobs.map((job) => {
                            const customer = job.customerId || {};
                            const car = job.carId || {};
                            const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Walk-in Customer';
                            const carInfo = `${car.make || ''} ${car.model || ''} (${car.numberPlate || car.registrationNumber || car.carNumber || 'No Plate'})`.trim();

                            return (
                                <div 
                                    key={job._id}
                                    style={{
                                        background: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '10px',
                                        padding: '12px 16px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FiClipboard color="#2563eb" />
                                            <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
                                                {job.jobCardNumber}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                • {formatDate(job.timeIn || job.createdAt)}
                                            </span>
                                        </div>

                                        <span className={`staff-job-status-pill ${getStatusClass(job.status)}`}>
                                            {job.status}
                                        </span>
                                    </div>

                                    {/* Customer and Vehicle Info */}
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: '1fr 1fr', 
                                        gap: '8px', 
                                        fontSize: '12.5px', 
                                        color: '#475569',
                                        background: '#f8fafc',
                                        padding: '8px 12px',
                                        borderRadius: '6px'
                                    }}>
                                        <div>
                                            <span style={{ color: '#64748b' }}>Customer:</span>{' '}
                                            <strong style={{ color: '#1e293b' }}>{customerName}</strong>
                                            {customer.phone && (
                                                <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                                                    ({customer.phone})
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <span style={{ color: '#64748b' }}>Vehicle:</span>{' '}
                                            <strong style={{ color: '#1e293b' }}>{carInfo || 'Vehicle Registered'}</strong>
                                        </div>
                                    </div>

                                    {/* Work to be Done */}
                                    {job.workToBeDone && job.workToBeDone.length > 0 && (
                                        <div style={{ fontSize: '12px', color: '#334155' }}>
                                            <span style={{ fontWeight: '600', color: '#64748b' }}>Assigned Tasks ({job.workToBeDone.length}):</span>
                                            <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                                                {job.workToBeDone.slice(0, 3).map((w, idx) => (
                                                    <li key={idx} style={{ marginBottom: '2px' }}>
                                                        {w.description}{' '}
                                                        <span style={{ fontSize: '10.5px', color: w.status === 'Completed' ? '#059669' : '#d97706', fontWeight: '600' }}>
                                                            [{w.status || 'Pending'}]
                                                        </span>
                                                    </li>
                                                ))}
                                                {job.workToBeDone.length > 3 && (
                                                    <li style={{ color: '#64748b', fontStyle: 'italic' }}>
                                                        +{job.workToBeDone.length - 3} more tasks...
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Action link */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                        <Link
                                            to={`/job-cards/${job._id}`}
                                            onClick={onClose}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: '#2563eb',
                                                textDecoration: 'none',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                background: '#eff6ff',
                                                border: '1px solid #bfdbfe'
                                            }}
                                        >
                                            Open Job Card Details <FiExternalLink size={12} />
                                        </Link>
                                    </div>

                                </div>
                            );
                        })
                    ) : (
                        <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                            <FiClipboard size={32} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                            <div style={{ fontWeight: '600', color: '#475569' }}>No Job Cards Currently Assigned</div>
                            <div style={{ fontSize: '12px', marginTop: '4px' }}>
                                When a Job Card is assigned to {staff.name} in the Job Cards section, it will appear here in real-time.
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="form-buttons" style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                    <button
                        type="button"
                        className="bg-btn"
                        onClick={onClose}
                        style={{ width: '100%' }}
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
};

export default StaffAssignedJobsModal;
