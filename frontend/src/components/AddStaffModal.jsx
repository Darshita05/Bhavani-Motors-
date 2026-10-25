import React, { useState } from 'react';
import { showToast } from './ToasterService';
import './Modal.css';
import { apiService } from '../services/apiService';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const AddStaffModal = ({ onClose, onStaffAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        designation: 'Mechanic',
        password: '',
        confirmPassword: '',
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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

        if (!formData.password) {
            showToast.error('Password is required');
            return;
        }

        if (formData.password.length < 6) {
            showToast.error('Password must be at least 6 characters');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            showToast.error('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                designation: formData.designation,
                password: formData.password,
            };

            let response;
            try {
                response = await apiService.post('/api/users/staff', payload);
            } catch (postErr) {
                if (postErr?.response?.status === 404 || postErr?.status === 404) {
                    console.warn("POST /api/users/staff returned 404, falling back to /api/auth/register");
                    response = await apiService.post('/api/auth/register', {
                        name: payload.name,
                        email: payload.email,
                        password: payload.password,
                        role: 'admin',
                    });
                } else {
                    throw postErr;
                }
            }
            console.log('Add Staff Response:', response);

            showToast.success('Staff member added successfully!');
            onStaffAdded();
            onClose();
        } catch (err) {
            console.error('Error adding staff:', err);
            showToast.error(err?.response?.data?.message || err?.message || 'Failed to create staff');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 className="modal-title" style={{ margin: 0 }}>Add New Staff</h2>
                    <button 
                        onClick={onClose} 
                        style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}
                    >
                        &times;
                    </button>
                </div>
                <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '18px' }}>
                    Create login credentials and assign role designation for a garage team member.
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

                    <div className="form-group">
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
                    </div>

                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div className="item" style={{ position: 'relative' }}>
                            <label htmlFor="password">Password <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                placeholder="Min 6 characters"
                                value={formData.password}
                                onChange={handleChange}
                                required
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

                        <div className="item">
                            <label htmlFor="confirmPassword">Confirm Password <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Confirm password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
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
                            {loading ? 'Adding...' : 'Add Staff Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStaffModal;
