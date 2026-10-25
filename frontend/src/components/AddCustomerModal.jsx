import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { showToast } from '../components/ToasterService';
import './Modal.css';
import { apiService } from '../services/apiService';

const AddCustomerModal = ({ onClose, onOpenVehicles, onCustomerAdded }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Phone number validation
        if (name === 'phoneNumber') {
            // Remove non-numeric characters
            const numericValue = value.replace(/\D/g, '');
            // Limit to 10 digits
            const limitedValue = numericValue.slice(0, 10);
            setFormData(prev => ({
                ...prev,
                [name]: limitedValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.phoneNumber.length !== 10) {
            showToast.error('Phone number must be exactly 10 digits', {
                position: "top-right",
                autoClose: 3000,
                closeOnClick: true,
                draggable: true,
                pauseOnHover: true
            });
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await apiService.post('/api/customers/create', formData);

            if (response.statusCode === 200 || response.statusCode === 201) {
                // Close modal first
                onClose();
                
                // Reset form data
                setFormData({
                    firstName: '',
                    lastName: '',
                    phoneNumber: '',
                    email: '',
                    address: ''
                });
                
                // Show success toast
                showToast.success('Customer added successfully');
                
                // Call onCustomerAdded after modal is closed and toast is shown
                onCustomerAdded({
                    ...formData,
                    ...response.dat,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            } else {
                showToast.error(response.message || 'Failed to create customer', {
                    position: "top-right",
                    autoClose: 3000,
                    closeOnClick: true,
                    draggable: true,
                    pauseOnHover: true
                });
            }
        } catch (err) {
            showToast.error(err.response?.message || err.message || 'Failed to create customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className='modal-content'>
                    <h2 className='modal-title'>Add New Customer</h2>
                    <p>Enter the customer information</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <div>
                            <label>First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Enter first name"
                                required
                            />
                        </div>
                        <div>
                            <label>Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Enter last name"
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <div>
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                                required
                            />
                        </div>
                        <div>
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email"
                                required
                            />
                        </div>
                    </div>
                    <label>Address</label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter your address"
                        required
                    ></textarea>
                    <div className="form-buttons">
                        <button
                            type="submit"
                            className='bg-btn'
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Customer'}
                        </button>
                    </div>
                </form>
                <button className="close-btn" onClick={onClose} disabled={loading}>×</button>
            </div>
        </div>
    );
};

export default AddCustomerModal;
