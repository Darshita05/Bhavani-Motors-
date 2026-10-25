import React, { useState, useEffect } from 'react';
import { showToast } from '../components/ToasterService';
import './Modal.css';
import { apiService } from '../services/apiService';

const EditItemModal = ({ item, onClose, onItemUpdated }) => {
    const [formData, setFormData] = useState({
        name: '',
        details: ''
    });
    const [loading, setLoading] = useState(false);
    const [itemId, setItemId] = useState('');

    useEffect(() => {
        if (item) {
            console.log('Item data received:', item);
            setItemId(item.id || item._id || '');
            setFormData({
                name: item.itemName || item.name || '',
                details: item.itemDetails || item.details || ''
            });
        }
    }, [item]);

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
            if (!itemId) {
                throw new Error('Item ID is missing');
            }
            
            const payload = {
                itemName: formData.name,
                itemDetails: formData.details
            };
            
            const response = await apiService.put(`/api/items/update/${itemId}`, payload);

            if (response.statusCode === 200 || response.item) {
                showToast.success('Item updated successfully');
                onItemUpdated();
                onClose();
            } else {
                throw new Error(response.message || 'Failed to update item');
            }
        } catch (err) {
            showToast.error(err?.message || 'Failed to update item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Edit Item</h2>
                <p>Update the item details below.</p>

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
                            {loading ? 'Updating...' : 'Update Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditItemModal;
