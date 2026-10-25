import React, { useState } from 'react';
import { showToast } from '../components/ToasterService';
import './Modal.css';
import { apiService } from '../services/apiService';

const AddItemModal = ({ onClose, onItemAdded, initialName = '' }) => {
    const [formData, setFormData] = useState({
        name: initialName,
        details: ''
    });
    const [loading, setLoading] = useState(false);

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
            showToast.error('Item name is required');
            return;
        }

        if (!formData.details.trim()) {
            showToast.error('Item details are required');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                itemName: formData.name,
                itemDetails: formData.details
            };

            const response = await apiService.post('/api/items/create', payload);
            console.log('Add Item Response:', response);

            if (response.statusCode === 200 || response.statusCode === 201 || response.item) {
                onClose();

                setFormData({
                    name: '',
                    details: ''
                });

                showToast.success('Item added successfully');
                onItemAdded(formData.name);
            } else {
                showToast.error(response.message || 'Failed to create item');
            }
        } catch (err) {
            showToast.error(err?.message || 'Failed to create item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Add New Item</h2>
                <p>Fill in the details to add a new item to your inventory.</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <div className="item">
                            <label htmlFor="name">Item Name <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Enter item name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="itemdetail">
                            <label htmlFor="details">Item Details <span style={{ color: 'red' }}>*</span></label>
                            <textarea
                                id="details"
                                name="details"
                                placeholder="Enter item details or description"
                                value={formData.details}
                                onChange={handleChange}
                                rows="4"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-buttons">
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
                            {loading ? 'Adding...' : 'Add Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddItemModal;
