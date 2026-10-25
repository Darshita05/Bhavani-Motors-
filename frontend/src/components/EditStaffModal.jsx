import React, { useState, useEffect } from 'react';
import { showToast } from './ToasterService';
import './Modal.css';
import { apiService } from '../services/apiService';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const EditStaffModal = ({ staff, onClose, onStaffUpdated }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        designation: 'Mechanic',
        isActive: true,
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const designations = [
        'Mechanic',
        'Service Advisor',
        'Technician',
        'Electrician',
        'Helper',
        'Other'
    ];

    useEffect(() => {
        if (staff) {
            setFormData({
                name: staff.name || '',
                email: staff.email || '',
                phone: staff.phone || '',
                designation: staff.designation || 'Mechanic',
                isActive: staff.isActive !== undefined ? staff.isActive : true,
                password: '',
            });
        }
    }, [staff]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showToast.error('Full name is required');
            return;
        }

        if (!formData.email.trim()) {
            showToast.error('Email address is required');
            return;
        }

        if (formData.password && formData.password.length < 6) {
            showToast.error('New password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const staffId = staff._id || staff.id;
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                designation: formData.designation,
                isActive: formData.isActive,
            };

            if (formData.password.trim()) {
                payload.password = formData.password.trim();
            }

            const response = await apiService.put(`/api/users/staff/${staffId}`, payload);
            console.log('Update Staff Response:', response);

            showToast.success('Staff member updated successfully!');
            onStaffUpdated();
            onClose();
        } catch (err) {
            console.error('Error updating staff:', err);
            showToast.error(err?.response?.data?.message || err?.message || 'Failed to update staff');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 className="modal-title" style={{ margin: 0 }}>Edit Staff Member</h2>
                    <button 
                        onClick={onClose} 
                        style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}
                    >
                        &times;
                    </button>
                </div>
                <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '18px' }}>
                    Update staff member profile details, assigned designation, and active access status.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <div className="item">
                            <label htmlFor="name">Full Name <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="e.g. Ramesh Patel"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div className="item">
                            <label htmlFor="email">Email Address <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="e.g. ramesh@bhavanimotors.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="item">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                placeholder="e.g. 9876543210"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                        <div className="item">
                            <label htmlFor="designation">Designation / Role <span style={{ color: 'red' }}>*</span></label>
                            <select
                                id="designation"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    backgroundColor: '#fff',
                                    fontSize: '14px',
                                    color: '#334155',
                                    outline: 'none'
                                }}
                            >
                                {designations.map(des => (
                                    <option key={des} value={des}>{des}</option>
                                ))}
                            </select>
                        </div>

                        <div className="item" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <label style={{ marginBottom: '8px' }}>Account Status</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: formData.isActive ? '#059669' : '#dc2626' }}>
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                {formData.isActive ? 'Active (Can Log in)' : 'Inactive (Suspended)'}
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="item" style={{ position: 'relative' }}>
                            <label htmlFor="password">Change Password <span style={{ color: '#94a3b8', fontSize: '12px' }}>(Leave blank to keep unchanged)</span></label>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                placeholder="Enter new password (optional)"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    bottom: '10px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#64748b'
                                }}
                            >
                                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-buttons" style={{ marginTop: '22px' }}>
                        <button
                            type="button"
                            className="border-btn"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-btn"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditStaffModal;
