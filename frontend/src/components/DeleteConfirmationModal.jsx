import React from 'react';
import { showToast } from './ToasterService';
import './DeleteConfirmationModal.css';

const DeleteConfirmationModal = ({ onClose, onConfirm, customer }) => {
    const handleConfirm = async () => {
        try {
            await onConfirm();
            // showToast.success('Customer deleted successfully');
            onClose();
        } catch (error) {
            showToast.error(error.message || 'Failed to delete customer');
        }
    };

    return ( 
        <div className="delete-modal-overlay"> 
            <div className="delete-modal">
                <div className="delete-modal-header">
                    <h2 className='delete-modal-title'>Confirm Delete</h2>
                    <button className="delete-modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <div className="delete-modal-content">
                    <p>Are you sure you want to delete this item?</p>
                    {/* <p>Customer: {customer.name}</p> */}
                </div>

                <div className="delete-modal-footer">
                    <button onClick={handleConfirm} className="btn-danger">Delete</button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
