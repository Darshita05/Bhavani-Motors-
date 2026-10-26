import React, { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './Modal.css';
import { toast } from 'react-toastify';
import apiService from '../services/apiService';
import { localDataStore } from '../services/localDataStore';

const AddVehicleModal = ({
    onClose,
    selectedCustomer,
    refreshCustomers,
    customers = []
}) => {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState(() => {

        const initialData = {
            make: '',
            model: '',
            registrationNo: '',
            fuelType: '',
            mileage: '',
            cost: '',
            serviceDate: new Date(),
            days: '',
            dueDate: '',
            description: '',
            customerId: '',
            customerName: ''
        };

        if (selectedCustomer) {

            initialData.customerId =
                selectedCustomer._id ||
                selectedCustomer.id;

            initialData.customerName =
                selectedCustomer.fullName ||
                `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim();
        }

        return initialData;
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [internalCustomers, setInternalCustomers] = useState([]);


    // ==========================================
    // LOAD CUSTOMERS
    // ==========================================

    useEffect(() => {

        if (customers && customers.length > 0) {

            setInternalCustomers(customers);

        } else if (!selectedCustomer) {

            fetchCustomers();

        }

    }, [selectedCustomer, customers]);


    // ==========================================
    // FETCH CUSTOMERS
    // ==========================================

    const fetchCustomers = async () => {
        try {
            let response = await apiService.get('/api/customers/getall');
            console.log('Customers API Response:', response);

            let customerList =
                response?.data?.customers ||
                response?.data?.data?.customers ||
                response?.data?.data ||
                response?.customers ||
                (Array.isArray(response) ? response : []);

            if (!customerList || customerList.length === 0) {
                const paged = await apiService.get('/api/customers/get/pagination?page=1&limit=1000');
                customerList = paged?.customers || paged?.data?.customers || paged?.data || [];
            }

            if (Array.isArray(customerList) && customerList.length > 0) {
                setInternalCustomers(customerList);
            } else {
                const localCusts = localDataStore.getCustomers();
                setInternalCustomers(localCusts || []);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            const localCusts = localDataStore.getCustomers();
            setInternalCustomers(localCusts || []);
        }
    };


    // ==========================================
    // CUSTOMER CHANGE
    // ==========================================

    const handleCustomerChange = (e) => {

        const customerId =
            e.target.value;

        const customer =
            internalCustomers.find(
                (customer) =>
                    (customer._id || customer.id) ===
                    customerId
            );

        setFormData((prev) => ({

            ...prev,

            customerId: customerId,

            customerName: customer
                ? customer.fullName ||
                  `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                : ''

        }));
    };


    // ==========================================
    // NORMAL INPUT CHANGE
    // ==========================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;


        // If user changes number of days
        if (name === 'days') {

            let calculatedDueDate = '';

            if (
                value &&
                formData.serviceDate
            ) {

                const days =
                    parseInt(value);

                if (!isNaN(days)) {

                    calculatedDueDate =
                        new Date(
                            formData.serviceDate.getTime() +
                            days *
                            24 *
                            60 *
                            60 *
                            1000
                        );
                }
            }


            setFormData((prev) => ({

                ...prev,

                days: value,

                dueDate:
                    calculatedDueDate

            }));

            return;
        }


        // Normal fields
        setFormData((prev) => ({

            ...prev,

            [name]: value

        }));
    };


    // ==========================================
    // SERVICE DATE CHANGE
    // ==========================================

    const handleDateChange = (date) => {

        if (!date) {

            setFormData((prev) => ({

                ...prev,

                serviceDate: null,

                dueDate: ''

            }));

            return;
        }


        let calculatedDueDate = '';


        if (formData.days) {

            const days =
                parseInt(
                    formData.days
                );


            if (!isNaN(days)) {

                calculatedDueDate =
                    new Date(

                        date.getTime() +

                        days *
                        24 *
                        60 *
                        60 *
                        1000

                    );
            }
        }


        setFormData((prev) => ({

            ...prev,

            serviceDate: date,

            dueDate:
                calculatedDueDate

        }));
    };


    // ==========================================
    // FORM SUBMIT
    // ==========================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);

        setError(null);


        try {

            // =====================================
            // CHECK LOGIN TOKEN
            // =====================================

            const token =
                localStorage.getItem(
                    'jwtToken'
                );


            if (!token) {

                throw new Error(
                    'No authentication token found'
                );
            }


            // =====================================
            // CHECK CUSTOMER
            // =====================================

            if (!formData.customerId) {

                throw new Error(
                    'Please select a customer'
                );
            }


            // =====================================
            // CHECK SERVICE DATE
            // =====================================

            if (!formData.serviceDate) {

                throw new Error(
                    'Please select service date'
                );
            }


            // =====================================
            // CHECK DUE DATE
            // =====================================

            if (!formData.dueDate) {

                throw new Error(
                    'Please enter valid service days'
                );
            }


            console.log(
                'Complete Form Data:',
                formData
            );


            // =====================================
            // STEP 1: CREATE CAR DATA
            // =====================================

            const carData = {

                make:
                    formData.make,

                model:
                    formData.model,

                registrationNo:
                    formData.registrationNo,

                fuelType:
                    formData.fuelType,

                mileage:
                    parseInt(
                        formData.mileage
                    ) || 0,

                customerId:
                    formData.customerId
            };


            console.log(
                'Creating car with data:',
                carData
            );


            // =====================================
            // STEP 2: CALL CREATE CAR API
            // =====================================

            const carResponse =
                await apiService.post(

                    '/api/cars/create',

                    carData

                );


            console.log(
                'Car API Response:',
                carResponse
            );


            // =====================================
            // STEP 3: GET CREATED CAR
            // =====================================

            let createdCar = null;


            if (
                carResponse.data?.data?.car
            ) {

                createdCar =
                    carResponse.data.data.car;

            } else if (
                carResponse.data?.car
            ) {

                createdCar =
                    carResponse.data.car;

            } else if (
                carResponse.data?.data
            ) {

                createdCar =
                    carResponse.data.data;

            }


            console.log(
                'Created Car:',
                createdCar
            );


            if (!createdCar) {

                throw new Error(
                    carResponse.data?.message ||
                    'Car was not created successfully'
                );
            }


            // MongoDB can return _id
            // Some APIs can return id

            const carId =

                createdCar._id ||

                createdCar.id;


            console.log(
                'Created Car ID:',
                carId
            );


            if (!carId) {

                throw new Error(
                    'Car created but car ID was not received'
                );
            }


            // =====================================
            // STEP 4: CREATE SERVICE DATA
            // =====================================

            const serviceData = {

                carId:
                    carId,

                registrationNo:
                    createdCar.registrationNo ||
                    formData.registrationNo,

                description:
                    formData.description,

                cost:
                    parseFloat(
                        formData.cost
                    ) || 0,

                serviceDate:
                    formData.serviceDate.toISOString(),

                days:
                    parseInt(
                        formData.days
                    ) || 0,

                dueDate:
                    formData.dueDate.toISOString(),

                customerId:
                    formData.customerId,

                mileage:
                    parseInt(
                        formData.mileage
                    ) || 0,

                reminderSent:
                    false
            };


            console.log(
                'Creating service with data:',
                serviceData
            );


            // =====================================
            // STEP 5: CREATE SERVICE
            // =====================================

            const serviceResponse =
                await apiService.post(

                    '/api/services/create',

                    serviceData

                );


            console.log(
                'Service API Response:',
                serviceResponse
            );


            // =====================================
            // STEP 6: CHECK RESPONSE
            // =====================================

            const status =

                serviceResponse.statusCode ||

                serviceResponse.status;


            if (
                status === 200 ||
                status === 201
            ) {

                toast.success(
                    'Service and car added successfully'
                );


                // Close modal
                onClose();


                // Refresh customer data
                if (refreshCustomers) {

                    refreshCustomers();

                }

            } else {

                throw new Error(

                    serviceResponse.data?.message ||

                    serviceResponse.message ||

                    'Failed to create service'

                );
            }


        } catch (error) {


            console.error(
                'Error creating car/service:',
                error
            );


            console.error(
                'Backend Error Response:',
                error.response
            );


            const errorMessage =

                error.response?.data?.message ||

                error.response?.message ||

                error.message ||

                'Failed to create car or service';


            setError(
                errorMessage
            );


            toast.error(
                errorMessage
            );


        } finally {


            setLoading(false);


        }
    };


    // ==========================================
    // FILTER CUSTOMERS
    // ==========================================

    const filteredCustomers = internalCustomers.filter((customer) => {
        if (!searchQuery) return true;
        const customerName =
            customer.fullName ||
            customer.name ||
            `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
        const phone = customer.phoneNumber || customer.phone || '';
        return (
            customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            phone.includes(searchQuery)
        );
    });


    // ==========================================
    // UI
    // ==========================================

    return (

        <div className="modal-overlay">

            <div className="modal">


                <h2 className="modal-title">

                    {selectedCustomer
                        ? 'Add Service'
                        : 'Add New Service'}

                </h2>


                {error && (

                    <div className="error-message">

                        {error}

                    </div>

                )}


                <form

                    onSubmit={handleSubmit}

                    style={{

                        display: 'flex',

                        flexDirection: 'column',

                        height: '100%',

                        overflow: 'hidden'

                    }}

                >


                    <div className="modal-form-scroll">


                        {/* CUSTOMER */}

                        <div className="form-group">

                            <div className="customer">


                                <label>

                                    Customer

                                </label>


                                {selectedCustomer ? (


                                    <input

                                        type="text"

                                        name="customerName"

                                        value={

                                            selectedCustomer.fullName ||

                                            `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim()

                                        }

                                        disabled

                                    />


                                ) : (


                                    <select

                                        name="customerId"

                                        value={
                                            formData.customerId
                                        }

                                        onChange={
                                            handleCustomerChange
                                        }

                                        required

                                    >


                                        <option value="">

                                            Select Customer

                                        </option>


                                        {filteredCustomers.map((customer) => {
                                            const customerId = customer._id || customer.id;
                                            const name =
                                                customer.fullName ||
                                                customer.name ||
                                                `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
                                                customer.email ||
                                                'Customer';

                                            return (
                                                <option key={customerId} value={customerId}>
                                                    {name}{customer.phoneNumber ? ` (${customer.phoneNumber})` : ''}
                                                </option>
                                            );
                                        })}


                                    </select>


                                )}


                            </div>

                        </div>


                        {/* VEHICLE DETAILS */}

                        <div className="service-grid">


                            <div>

                                <label>

                                    Brand Name

                                </label>

                                <input

                                    type="text"

                                    name="make"

                                    value={
                                        formData.make
                                    }

                                    onChange={
                                        handleChange
                                    }

                                    placeholder="Brand Name"

                                    required

                                />

                            </div>


                            <div>

                                <label>

                                    Model Name

                                </label>

                                <input

                                    type="text"

                                    name="model"

                                    value={
                                        formData.model
                                    }

                                    onChange={
                                        handleChange
                                    }

                                    placeholder="Model Name"

                                    required

                                />

                            </div>


                            <div>

                                <label>

                                    Registration Number

                                </label>

                                <input

                                    type="text"

                                    name="registrationNo"

                                    value={
                                        formData.registrationNo
                                    }

                                    onChange={
                                        handleChange
                                    }

                                    placeholder="Registration Number"

                                    required

                                />

                            </div>


                            <div>

                                <label>

                                    Fuel Type

                                </label>

                                <select

                                    name="fuelType"

                                    value={
                                        formData.fuelType
                                    }

                                    onChange={
                                        handleChange
                                    }

                                    required

                                >


                                    <option value="">

                                        Select Fuel Type

                                    </option>


                                    <option value="Petrol">

                                        Petrol

                                    </option>


                                    <option value="Diesel">

                                        Diesel

                                    </option>


                                    <option value="Petrol + CNG">

                                        Petrol + CNG

                                    </option>


                                    <option value="CNG">

                                        CNG

                                    </option>


                                    <option value="EV">

                                        EV

                                    </option>


                                </select>

                            </div>


                            <div>

                                <label>

                                    Mileage

                                </label>

                                <input

                                    type="number"

                                    name="mileage"

                                    value={
                                        formData.mileage
                                    }

                                    onChange={
                                        handleChange
                                    }

                                    placeholder="Mileage"

                                    required

                                />

                            </div>


                            <div>

                                <label>

                                    Service Cost

                                </label>

                                <input

                                    type="number"

                                    name="cost"

                                    value={
                                        formData.cost
                                    }

                                    onChange={
                                        handleChange
                                    }

                                    placeholder="₹ Service Cost"

                                    required

                                />

                            </div>


                        </div>


                        {/* SERVICE DATE */}

                        <div className="form-group service-date-row">


                            <div className="service-date-field">

                                <label>

                                    Service Date

                                </label>


                                <DatePicker

                                    selected={
                                        formData.serviceDate
                                    }

                                    onChange={
                                        handleDateChange
                                    }

                                    className="form-control"

                                    dateFormat="dd/MM/yyyy"

                                    placeholderText="Select service date"

                                />

                            </div>


                            {/* DAYS */}

                            <div className="days-field">

                                <label>

                                    Days

                                </label>


                                <input

                                    type="number"

                                    name="days"

                                    value={
                                        formData.days
                                    }

                                    onChange={
                                        handleChange
                                    }

                                    className="form-control"

                                    placeholder="Enter days"

                                    min="0"

                                    required

                                />

                            </div>


                            {/* DUE DATE */}

                            <div className="due-date-field">

                                <label>

                                    Due Date

                                </label>


                                <input

                                    type="text"

                                    value={

                                        formData.dueDate

                                            ? formData.dueDate.toLocaleDateString(

                                                'en-GB',

                                                {

                                                    day: '2-digit',

                                                    month: '2-digit',

                                                    year: 'numeric'

                                                }

                                            )

                                            : ''

                                    }

                                    readOnly

                                    className="form-control"

                                />

                            </div>


                        </div>


                        {/* SERVICE DETAILS */}

                        <div

                            style={{

                                display: 'flex',

                                flexDirection: 'column'

                            }}

                        >


                            <label

                                style={{

                                    marginBottom: '5px'

                                }}

                            >

                                Service Details

                            </label>


                            <textarea

                                name="description"

                                value={
                                    formData.description
                                }

                                onChange={
                                    handleChange
                                }

                                placeholder="Service details"

                                required

                            />


                        </div>


                    </div>


                    {/* BUTTONS */}

                    <div className="form-buttons">


                        <button

                            type="button"

                            className="border-btn"

                            onClick={
                                onClose
                            }

                            disabled={
                                loading
                            }

                        >

                            Cancel

                        </button>


                        <button

                            type="submit"

                            className="bg-btn"

                            disabled={
                                loading
                            }

                        >

                            {loading
                                ? 'Saving...'
                                : 'Save'}

                        </button>


                    </div>


                </form>


            </div>

        </div>

    );

};


export default AddVehicleModal;