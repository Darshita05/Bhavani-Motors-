import React, { useState, useEffect } from 'react';
import { showToast } from './ToasterService';
import './Modal.css';
import { apiService } from '../services/apiService';

const CustomerModal = ({
    onClose,
    customer,
    onCustomerAdded,
}) => {

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        address: ''
    });

    const [loading, setLoading] = useState(false);

    // EDIT MODE:
    // When customer is available, fill the form with existing customer data
    useEffect(() => {
        if (customer) {
            setFormData({
                id: customer._id || customer.id,
                firstName: customer.firstName || '',
                lastName: customer.lastName || '',
                phoneNumber: customer.phoneNumber || '',
                email: customer.email || '',
                address: customer.address || ''
            });
        } else {
            // ADD MODE:
            // Keep form empty
            setFormData({
                firstName: '',
                lastName: '',
                phoneNumber: '',
                email: '',
                address: ''
            });
        }
    }, [customer]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Phone number validation
        if (name === 'phoneNumber') {

            // Remove non-numeric characters
            const numericValue = value.replace(/\D/g, '');

            // Maximum 10 digits
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

        // Phone validation
        if (formData.phoneNumber.length !== 10) {
            showToast.error(
                'Phone number must be exactly 10 digits'
            );
            return;
        }

        setLoading(true);

        try {

            // =========================
            // EDIT MODE
            // =========================
            if (customer) {

                const customerId = customer._id || customer.id;

                const response = await apiService.patch(
                    `/api/customers/update/${customerId}`,
                    formData
                );

                if (
                    response &&
                    (response.statusCode === 200 ||
                     response.statusCode === 201)
                ) {

                    showToast.success(
                        'Customer updated successfully'
                    );

                    onClose();

                    if (onCustomerAdded) {
                        onCustomerAdded();
                    }
                } else {

                    showToast.error(
                        response?.message ||
                        'Failed to update customer'
                    );
                }

            }

            // =========================
            // ADD MODE
            // =========================
            else {

                const response = await apiService.post(
                    '/api/customers/create',
                    formData
                );

                if (
                    response.statusCode === 200 ||
                    response.statusCode === 201
                ) {

                    showToast.success(
                        'Customer added successfully'
                    );

                    onClose();

                    // Tell parent that customer was added
                    if (onCustomerAdded) {
                        onCustomerAdded();
                    }

                    // Reset form
                    setFormData({
                        firstName: '',
                        lastName: '',
                        phoneNumber: '',
                        email: '',
                        address: ''
                    });

                } else {

                    showToast.error(
                        response.message ||
                        'Failed to create customer'
                    );
                }
            }

        } catch (err) {

            showToast.error(
                err.response?.message ||
                err.message ||
                'Something went wrong'
            );

        } finally {

            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">

            <div className="modal">

                <div className="modal-header">

                    <div className="modal-content">

                        <h2 className="modal-title">
                            {customer
                                ? 'Edit Customer'
                                : 'Add New Customer'}
                        </h2>

                        <p>
                            {customer
                                ? 'Update customer information'
                                : 'Enter the customer information'}
                        </p>

                    </div>

                    <button
                        className="close-btn"
                        onClick={onClose}
                        disabled={loading}
                    >
                        <span className="close-icon">
                            &times;
                        </span>
                    </button>

                </div>

                <form onSubmit={handleSubmit}>

                    {/* First Name + Last Name */}

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


                    {/* Phone + Email */}

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


                    {/* Address */}

                    <label>Address</label>

                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter your address"
                        required
                    ></textarea>


                    {/* Submit Button */}

                    <div className="form-buttons">

                        <button
                            type="submit"
                            className="bg-btn"
                            disabled={loading}
                        >
                            {loading
                                ? customer
                                    ? 'Updating...'
                                    : 'Adding...'
                                : customer
                                    ? 'Update Customer'
                                    : 'Add Customer'}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
};

export default CustomerModal;