import React from 'react';
import './Modal.css';

const AddCustomerModal = ({ onClose, onOpenVehicles }) => {
    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className='modal-content'>
                    <h2 className='modal-title'>Add Vehicle Details</h2>
                </div>
                <form>
                    <div className="vehicle-number form-input">
                        <label>Vehicle Number</label>
                        <input type="text" placeholder="Enter Vehicle Number" />
                    </div>
                    <div className="model/brand form-input">
                        <label>Model/Brand</label>
                        <input type="text" placeholder="Enter Model/Brand" /> 
                    </div>  
                    <div className="form-group form-input">
                        <div className='fuel-type'>
                            <label>Fuel Type</label>
                            <select>
                                <option>Select Fuel Type</option>
                                <option>Petrol</option>
                                <option>Diesel</option>
                                <option>CNG</option>
                            </select>
                        </div>
                        <div className='contact-number form-input'>
                            <label>Contact Number</label>
                            <input type="text" placeholder="Enter Contact Number" />
                        </div>
                    </div>
                    <div className="form-group form-input">
                        <div className='service-date'>
                            <label>Last Service Date</label>
                            <input type="text" placeholder="Enter Last Service Date" />
                        </div>
                    </div>
                    <div className="form-buttons">
                        <button type="submit" className='bg-btn'>Save</button>
                    </div>
                </form>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>
        </div>
    );
};

export default AddCustomerModal;
