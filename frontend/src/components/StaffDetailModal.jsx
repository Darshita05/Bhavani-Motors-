import React from 'react';
import { FiUser, FiMail, FiPhone, FiCheckCircle, FiXCircle, FiCalendar, FiShield } from 'react-icons/fi';
import './Modal.css';

const StaffDetailModal = ({ staff, onClose, onEdit }) => {
    if (!staff) return null;

    const getInitials = (name = '') => {
        return name
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'ST';
    };

    const getDesignationColor = (des = '') => {
        switch (des?.toLowerCase()) {
            case 'mechanic': return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
            case 'service advisor': return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' };
            case 'technician': return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
            case 'electrician': return { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' };
            case 'helper': return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
            default: return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
        }
    };

    const desStyle = getDesignationColor(staff.designation);

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h2 className="modal-title" style={{ margin: 0 }}>Staff Profile</h2>
                    <button 
                        onClick={onClose} 
                        style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}
                    >
                        &times;
                    </button>
                </div>

                {/* Profile Header */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    padding: '16px', 
                    background: '#f8fafc', 
                    borderRadius: '10px',
                    marginBottom: '18px',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1e293b, #3b82f6)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: '700',
                        flexShrink: 0
                    }}>
                        {getInitials(staff.name)}
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: '700' }}>{staff.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                            <span style={{
                                background: desStyle.bg,
                                color: desStyle.text,
                                border: `1px solid ${desStyle.border}`,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600'
                            }}>
                                {staff.designation || 'Staff'}
                            </span>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: staff.isActive ? '#ecfdf5' : '#fef2f2',
                                color: staff.isActive ? '#059669' : '#dc2626',
                                border: `1px solid ${staff.isActive ? '#a7f3d0' : '#fecaca'}`,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600'
                            }}>
                                {staff.isActive ? <FiCheckCircle size={11} /> : <FiXCircle size={11} />}
                                {staff.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#334155' }}>
                        <FiMail size={16} color="#64748b" />
                        <div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Email Address</div>
                            <div style={{ fontWeight: '600' }}>{staff.email}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#334155' }}>
                        <FiPhone size={16} color="#64748b" />
                        <div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Phone Number</div>
                            <div style={{ fontWeight: '600' }}>{staff.phone || 'Not Provided'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#334155' }}>
                        <FiShield size={16} color="#64748b" />
                        <div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>System Role</div>
                            <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{staff.role || 'Staff User'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#334155' }}>
                        <FiCalendar size={16} color="#64748b" />
                        <div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Registration Date</div>
                            <div style={{ fontWeight: '600' }}>{formatDate(staff.createdAt)}</div>
                        </div>
                    </div>

                    {/* Assigned Tasks Summary Box */}
                    <div style={{ 
                        marginTop: '4px',
                        padding: '12px 14px', 
                        background: '#eff6ff', 
                        border: '1px solid #bfdbfe', 
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ fontSize: '11.5px', color: '#1d4ed8', fontWeight: '700' }}>
                                Assigned Job Tasks
                            </div>
                            <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '2px' }}>
                                <strong>{staff.assignedJobsCount || (staff.assignedJobs ? staff.assignedJobs.length : 0)} Total Jobs</strong> ({staff.activeJobsCount || 0} In Progress)
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-buttons">
                    <button
                        type="button"
                        className="border-btn"
                        onClick={onClose}
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        className="bg-btn"
                        onClick={() => {
                            onClose();
                            onEdit(staff);
                        }}
                    >
                        Edit Member
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StaffDetailModal;
