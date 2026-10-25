import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { FiCamera } from 'react-icons/fi';
import { FiTrash2 } from 'react-icons/fi';
import { ToastContainer } from 'react-toastify';
import { showToast } from '../components/ToasterService';
import 'react-toastify/dist/ReactToastify.css';
import { jsPDF } from 'jspdf';
import apiService from '../services/apiService';
import { useLoading } from '../context/LoadingContext';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { TbCalendarEvent, TbCalendarTime } from "react-icons/tb";
// Use CDN or local path, NOT false
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

import AddItemModal from '../components/AddItemModal';
import '../style/ServiceDetails.css';

const ServiceDetails = () => {
    const { id } = useParams();
    const [serviceData, setServiceData] = useState({});
    const [customerData, setCustomerData] = useState({});
    const [error, setError] = useState(null);
    const [images, setImages] = useState([]); // State to store uploaded images
    const [isUploading, setIsUploading] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [showAmountPopup, setShowAmountPopup] = useState(false);
    const [isSubmittingAmount, setIsSubmittingAmount] = useState(false);
    const [amountInput, setAmountInput] = useState('');
    const [items, setItems] = useState([]);
    const [selectedServiceItem, setSelectedServiceItem] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [focusedRowIndex, setFocusedRowIndex] = useState(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [addItemInitialName, setAddItemInitialName] = useState('');
    const [addItemRowIndex, setAddItemRowIndex] = useState(null);
    const { setIsLoading } = useLoading();

    // Force re-render when images state changes
    useEffect(() => {
    }, [images]);

    // Force re-render when serviceData changes
    // useEffect(() => {
    //     if (serviceData.carId) {
    //         fetchServiceData();
    //     }
    // }, [serviceData.carId]);

    // Fetch items from API
    const fetchItems = async () => {
        try {
            const response = await apiService.get('/api/items/getall?limit=500');
            console.log('Items API Response:', response);

            let itemsData = [];
            if (response?.data?.items) {
                itemsData = response.data.items;
            } else if (response?.data && Array.isArray(response.data)) {
                itemsData = response.data;
            } else if (Array.isArray(response)) {
                itemsData = response;
            }

            console.log('Processed items data:', itemsData);
            setItems(itemsData);
        } catch (error) {
            console.error('Error fetching items:', error);
            showToast.error('Failed to load items');
        }
    };

    // Fetch items on component mount
    useEffect(() => {
        fetchItems();
    }, []);

    // Debug items state
    useEffect(() => {
        console.log('Items state updated:', items);
    }, [items]);


    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const addInvoiceItem = () => {
        setInvoiceItems([...invoiceItems, {
            description: '',
            quantity: '',
            rate: '',
            amount: 0
        }]);
    };

    // UPDATED: Handle description change, filter suggestions, and auto-fill rate
    const updateInvoiceItem = (index, field, value) => {
        const newItems = [...invoiceItems];
        newItems[index][field] = value;

        // If description is changed, find the matching item to auto-fill rate
        if (field === 'description' && value) {
            const selectedItem = items.find(item => item.itemName === value);
            if (selectedItem && selectedItem.rate) {
                newItems[index].rate = selectedItem.rate;
            }
        }

        // Recalculate amount safely
        const qty = parseFloat(newItems[index].quantity) || 0;
        const rate = parseFloat(newItems[index].rate) || 0;
        newItems[index].amount = qty * rate;

        setInvoiceItems(newItems);
    };

    const removeInvoiceItem = (index) => {
        const newItems = [...invoiceItems];
        newItems.splice(index, 1);
        setInvoiceItems(newItems);
    };

    const calculateTotal = () => {
        return invoiceItems.reduce((total, item) => total + parseFloat(item.amount || 0), 0);
    };

    // Scroll highlighted suggestion into view
    useEffect(() => {
        if (highlightedIndex >= 0 && focusedRowIndex !== null) {
            const el = document.getElementById(`suggestion-${focusedRowIndex}-${highlightedIndex}`);
            if (el) el.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex]);

    // Autocomplete handlers
    const handleDescriptionChange = (index, value) => {
        updateInvoiceItem(index, 'description', value);
        setHighlightedIndex(-1);

        // Filter suggestions based on input
        if (value.length > 0) {
            const filteredSuggestions = items.filter(item =>
                item.itemName.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions(items); // Show all items when input is empty
        }
    };

    const handleDescriptionFocus = (index) => {
        setFocusedRowIndex(index);
        setShowSuggestions(true);
        setHighlightedIndex(-1);
        // Show all items when focused
        setSuggestions(items);
    };

    const selectSuggestion = (index, itemName) => {
        updateInvoiceItem(index, 'description', itemName);
        setShowSuggestions(false);

        // Move to quantity field after selection
        setTimeout(() => {
            const quantityField = document.getElementById(`quantity-${index}`);
            if (quantityField) quantityField.focus();
        }, 100);
    };

    const fetchServiceData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // First fetch the service data
            const serviceResponse = await apiService.get(`/api/services/get/${id}`);
            const service = serviceResponse?.data?.service || serviceResponse?.service || serviceResponse?.data;

            if (!service) {
                throw new Error('Invalid service response format');
            }

            setServiceData(service);

            // Now that we have service data, fetch the car image
            const carRawId = service.carId?._id || service.carId?.id || (typeof service.carId === 'string' ? service.carId : null) || service.car?._id || service.car?.id;
            if (carRawId) {
                try {
                    const carImageResponse = await apiService.get(`/api/cars/${carRawId}`);
                    const carObj = carImageResponse?.data?.car || carImageResponse?.car || carImageResponse?.data;
                    if (carObj && carObj.imageUrl) {
                        setImages(carObj.imageUrl);
                    }
                } catch (carErr) {
                    console.warn("Could not fetch car image:", carErr?.message);
                }
            }

            // Fetch customer data using customerId or nested car customer
            const custRawId =
                service.customerId?._id ||
                service.customerId?.id ||
                (typeof service.customerId === 'string' ? service.customerId : null) ||
                service.customer?._id ||
                service.customer?.id ||
                service.carId?.customerId?._id ||
                service.carId?.customerId?.id ||
                service.carId?.customerId ||
                service.carId?.customer?.id;

            if (custRawId) {
                try {
                    const customerResponse = await apiService.get(`/api/customers/get/${custRawId}`);
                    const customerInfo = customerResponse?.data?.customer || customerResponse?.customer || customerResponse?.data;
                    if (customerInfo) {
                        setCustomerData(customerInfo);
                    }
                } catch (custErr) {
                    console.warn("Could not fetch customer info:", custErr?.message);
                }
            }

        } catch (err) {
            setError(err.message);
            console.error('Error fetching service data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetchServiceData();
    }, [id]);

    const handleImageClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                setIsUploading(true);
                try {
                    const token = localStorage.getItem('jwtToken');
                    if (!token) {
                        throw new Error('No authentication token found');
                    }

                    // Show loading state
                    // setIsUploading(true);

                    const formData = new FormData();
                    formData.append('image', file);

                    try {
                       const carId = serviceData.carId?._id || serviceData.carId;

console.log("IMAGE UPLOAD CAR ID:", carId);

const response = await apiService.upload(
    `/api/cars/upload-images/${carId}`,
    formData
);

                        if (response.data && response.data.imageUrl) {
                            // Add the new image URL to the images state
                            const newImageUrl = response.data.imageUrl;

                            // Update images state with new image URL
                            setImages(newImageUrl);

                            // Force a re-render of the image gallery
                            setImages(prev => [...prev]);

                            showToast.success('Image uploaded successfully!');
                        } else {
                            throw new Error('Invalid response format: ' + JSON.stringify(response.data));
                        }
                    } catch (error) {
                        console.error('Error uploading image:', error);
                        showToast.error(error.response?.data?.message || 'Failed to upload image');
                    }
                } catch (error) {
                    console.error('Error uploading image:', error);
                    console.log('Error Status Code:', error.response?.status);
                    console.log('Error Response:', error.response?.data);
                    showToast.error('Failed to upload image: ' + error.message);
                } finally {
                    setIsUploading(false);
                }
            }
        };

        input.click();
    };

    const handleSendImage = async () => {
        if (images.length === 0) {
            showToast.error('No images to send');
            return;
        }
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Send image URLs directly to the API
            const response = await apiService.post(`/api/cars/send-image/${id}`, {
                images: images.map((imageUrl, index) => ({
                    url: imageUrl,
                    name: `image${index}.jpg`
                }))
            });

            if (response.statusCode === 200 || response.statusCode === 201) {
                showToast.success('Images send successfully!');
            } else {
                throw new Error(response.message || 'Failed to send images');
            }
        } catch (error) {
            console.error('Error sending images:', error);
            showToast.error(error.response?.message || 'Failed to send images');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShareWhatsApp = (imageUrl) => {
        const url = encodeURIComponent(imageUrl);
        const text = encodeURIComponent('Check out this image!');
        window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
    };

    const handleImageDelete = async (imageUrl) => {
        try {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Get carId from serviceData
            const carId = serviceData.carId;
            if (!carId) {
                throw new Error('No car ID found');
            }

            // First delete the specific image
            await apiService.delete(`/api/cars/delete-image/${carId}`, {
                data: {
                    imageUrl: imageUrl
                }
            });

            // Update local state
            setImages(prev => prev.filter(img => img !== imageUrl));
            showToast.success('Image deleted successfully');

            // Refresh service data since image is deleted
            fetchServiceData();
        } catch (error) {
            console.error('Error deleting image:', error);
            showToast.error(error.response?.data?.message || 'Error deleting image');
        }
    };

    const generateInvoice = () => {
        setShowInvoice(true);
    };

    const closeInvoice = () => {
        setShowInvoice(false);
    };

    const addAmountPopup = () => {
        setShowAmountPopup(true);
    };

    const closeAmountpopup = () => {
        setShowAmountPopup(false);
    };


    const printInvoice = () => {
        window.print();
    };

    const mm2px = (mm) => (mm / 25.4) * 96;

    function numberToWords(num) {
        if (num === 0) return "Zero";

        const ones = [
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
            "Sixteen", "Seventeen", "Eighteen", "Nineteen"
        ];
        const tens = [
            "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
        ];

        function convertToWords(n) {
            let str = "";

            if (n > 99) {
                str += ones[Math.floor(n / 100)] + " Hundred ";
                n %= 100;
            }

            if (n > 19) {
                str += tens[Math.floor(n / 10)] + " ";
                n %= 10;
            }

            if (n > 0) {
                str += ones[n] + " ";
            }

            return str.trim();
        }

        // Indian Numbering System
        let result = "";
        const crore = Math.floor(num / 10000000);
        if (crore > 0) {
            result += convertToWords(crore) + " Crore ";
            num %= 10000000;
        }

        const lakh = Math.floor(num / 100000);
        if (lakh > 0) {
            result += convertToWords(lakh) + " Lakh ";
            num %= 100000;
        }

        const thousand = Math.floor(num / 1000);
        if (thousand > 0) {
            result += convertToWords(thousand) + " Thousand ";
            num %= 1000;
        }

        const hundred = Math.floor(num / 100);
        if (hundred > 0) {
            result += convertToWords(hundred) + " ";
            num %= 100;
        }

        if (num > 0) {
            result += convertToWords(num) + " ";
        }

        return result.trim();
    }

    function amountInWords(amount) {
        const rounded = Math.round(amount);
        return numberToWords(rounded) + " Only";
    }

    const generatePDF = async () => {
        setIsLoading(true);
        const doc = new jsPDF({ format: 'a5', unit: 'mm', orientation: 'portrait' });

        const pageW = doc.internal.pageSize.getWidth();   // ~148mm
        const pageH = doc.internal.pageSize.getHeight();  // ~210mm
        const outerMargin = 4;     // mm (tight like sample)
        const innerPad = 4;        // mm padding inside page border
        const printableW = pageW - (outerMargin + innerPad) * 2;

        const contentX = outerMargin + innerPad;
        const contentY = outerMargin + innerPad;
        const contentW = pageW - 2 * (outerMargin + innerPad);
        const contentHpx = mm2px(pageH - 2 * (outerMargin + innerPad));

        const printerTopLoss = 4;     // try 3–6 mm (how much your printer clips at top)
        const sideMargin = 4;

        const x = sideMargin;
        const y = Math.max(2, 6 - printerTopLoss); // shift UP to offset printer top loss
        const w = pageW - sideMargin * 2;// mm (left/right side margin)

        const customerName =
            customerData?.firstName || customerData?.lastName
                ? `${customerData.firstName ?? ""} ${customerData.lastName ?? ""}`.trim()
                : "-";

        const vehicleNo = serviceData?.carId?.registrationNo
    ? serviceData.carId.registrationNo
        .replace(/[^a-zA-Z0-9\-]/g, "")
        .toUpperCase()
    : "-";

const mileage = serviceData?.mileage || serviceData?.carId?.mileage || "-";

const makeModel = `${serviceData?.carId?.make || "-"} ${serviceData?.carId?.model || "-"}`;

        const total = calculateTotal();         // your existing total
        const rounded = Math.round(total);      // like the pic
        const rounding = (rounded - total).toFixed(2);

        // Build item rows
        const totalQty = (invoiceItems || []).reduce((s, i) => s + Number(i.quantity || 0), 0);
        const rowsHtml = (invoiceItems || []).map((item, idx) => {
            const qty = Number(item.quantity || 0);
            const rate = Number(item.rate || 0);
            const lineTotal = qty * rate;
            return `
      <tr style="height:18px;">
        <td style="text-align:center;border-left:1px solid #000;border-right:1px solid #000;border-top:none;border-bottom:none;padding:2px 3px;">${idx + 1}</td>
        <td style="text-align:left;border-left:1px solid #000;border-right:1px solid #000;border-top:none;border-bottom:none;padding:2px 4px;">${item.description || "-"}</td>
        <td style="text-align:center;border-left:1px solid #000;border-right:1px solid #000;border-top:none;border-bottom:none;padding:2px 3px;">PCS</td>
        <td style="text-align:center;border-left:1px solid #000;border-right:1px solid #000;border-top:none;border-bottom:none;padding:2px 3px;">${qty || ""}</td>
        <td style="text-align:right;border-left:1px solid #000;border-right:1px solid #000;border-top:none;border-bottom:none;padding:2px 4px;">${rate ? rate.toFixed(2) : ""}</td>
        <td style="text-align:right;border-left:1px solid #000;border-right:1px solid #000;border-top:none;border-bottom:none;padding:2px 4px;">${lineTotal ? lineTotal.toFixed(2) : ""}</td>
      </tr>`;
        }).join("");

        const fillerRows = "";

        const invoiceNo = serviceData.invoiceNumber || getDefaultInvoiceNumber();
        const invoiceDate = formatDate(new Date());
const html = `
<div style="
    width:${mm2px(contentW)}px;
    height:${contentHpx}px;
    font-family:Arial,sans-serif;
    font-size:10px;
    color:#000;
    box-sizing:border-box;
    display:flex;
    flex-direction:column;
">

<style>
    * {
        box-sizing:border-box;
        margin:0;
        padding:0;
    }

    table {
        width:100%;
        border-collapse:collapse;
    }

    td, th {
        border:1px solid #000;
        padding:3px 4px;
        font-size:9px;
    }
</style>


<!-- ================= HEADER ================= -->

<table>
    <tr>

        <td style="
            width:20%;
            text-align:center;
            vertical-align:middle;
            height:55px;
        ">
            <div style="
                font-size:15px;
                font-weight:bold;
            ">
                BHAVANI
            </div>

            <div style="
                font-size:9px;
                letter-spacing:2px;
            ">
                MOTORS
            </div>
        </td>


        <td style="
            width:55%;
            text-align:center;
            vertical-align:middle;
        ">

            <div style="
                font-size:18px;
                font-weight:bold;
            ">
                BHAVANI MOTORS
            </div>

            <div style="
                font-size:8px;
                margin-top:4px;
            ">
                OPP. GANGA HOTEL, B/H AXIS BANK,
            </div>

            <div style="font-size:8px;">
                PUNA-PATIYA, KADODARA ROAD,
            </div>

            <div style="font-size:8px;">
                SURAT - 395010
            </div>

        </td>


        <td style="
            width:25%;
            vertical-align:top;
            padding:5px;
        ">

            <div style="
                font-size:11px;
                font-weight:bold;
                margin-bottom:5px;
            ">
                TAX INVOICE
            </div>

            <div>Original</div>
            <div>Duplicate</div>
            <div>Triplicate</div>

        </td>

    </tr>
</table>


<!-- ================= CONTACT ================= -->

<table>

    <tr>

       <td style="width:60%;">

    <strong>Email:</strong>
    ${customerData?.email || "-"}

    <br />

    <strong>Phone:</strong>
    ${customerData?.phoneNumber || "-"}

</td>

        <td style="width:40%;">

            <strong>GSTIN:</strong>
            24AKTPT0612Q1ZJ

        </td>

    </tr>

</table>


<!-- ================= CUSTOMER ================= -->

<table>

    <tr>

        <td style="
            width:60%;
            height:70px;
            vertical-align:top;
        ">

            <div>
                <strong>Name:</strong>
                ${customerName}
            </div>

            <div style="margin-top:5px;">
                <strong>Vehicle No:</strong>
                ${vehicleNo}
            </div>

            <div style="margin-top:5px;">
                <strong>Make / Model:</strong>
                ${makeModel}
            </div>

            <div style="margin-top:5px;">
                <strong>Mileage:</strong>
                ${mileage}
            </div>

        </td>


        <td style="
            width:40%;
            vertical-align:top;
        ">

            <div>
                <strong>Invoice No:</strong>
                ${invoiceNo}
            </div>

            <div style="margin-top:6px;">
                <strong>Invoice Date:</strong>
                ${invoiceDate}
            </div>

            <div style="margin-top:6px;">
                <strong>Mobile:</strong>
                ${customerData?.phoneNumber || "-"}
            </div>

        </td>

    </tr>

</table>


<!-- ================= ITEMS ================= -->

<table style="
    flex:1;
    height:100%;
">

    <thead>

        <tr>

            <th style="width:7%;">
                Sr.
            </th>

            <th style="width:43%;">
                Description
            </th>

            <th style="width:10%;">
                Unit
            </th>

            <th style="width:10%;">
                Qty
            </th>

            <th style="width:15%;">
                Rate
            </th>

            <th style="width:15%;">
                Amount
            </th>

        </tr>

    </thead>


    <tbody>

        ${rowsHtml}

        <tr style="height:100%;">

            <td></td>

            <td></td>

            <td></td>

            <td></td>

            <td></td>

            <td></td>

        </tr>

    </tbody>


    <tfoot>

        <tr>

            <td colspan="3"
                style="
                    text-align:right;
                    font-weight:bold;
                "
            >

                TOTAL

            </td>


            <td style="
                text-align:center;
                font-weight:bold;
            ">

                ${totalQty}

            </td>


            <td></td>


            <td style="
                text-align:right;
                font-weight:bold;
            ">

                ${total.toFixed(2)}

            </td>

        </tr>

    </tfoot>

</table>


<!-- ================= TOTAL ================= -->

<table>

    <tr>

        <td style="
            width:55%;
            height:75px;
            vertical-align:top;
        ">

            <strong>
                Amount in Words:
            </strong>

            <br><br>

            Rupees ${amountInWords(rounded)}

            <br><br>

            <strong>
                Vehicle Owner:
            </strong>

            ${customerName}

            <br>

            <strong>
                Car No:
            </strong>

            ${vehicleNo}

        </td>


        <td style="
            width:45%;
            vertical-align:top;
        ">

            <table>

                <tr>

                    <td>
                        Amount Before Tax
                    </td>

                    <td style="text-align:right;">
                        ${total.toFixed(2)}
                    </td>

                </tr>


                <tr>

                    <td>
                        Total Amount
                    </td>

                    <td style="text-align:right;">
                        ${total.toFixed(2)}
                    </td>

                </tr>


                <tr>

                    <td>
                        Rounding
                    </td>

                    <td style="text-align:right;">
                        ${rounding}
                    </td>

                </tr>


                <tr>

                    <td style="font-weight:bold;">
                        Invoice Total
                    </td>

                    <td style="
                        text-align:right;
                        font-weight:bold;
                    ">

                        ₹ ${rounded.toFixed(2)}

                    </td>

                </tr>

            </table>

        </td>

    </tr>

</table>


<!-- ================= SIGNATURE ================= -->

<table>

    <tr>

        <td style="
            width:50%;
            height:55px;
            vertical-align:bottom;
        ">

            Receiver's Signature

        </td>


        <td style="
            width:50%;
            text-align:right;
            vertical-align:bottom;
        ">

            <strong>
                For BHAVANI MOTORS
            </strong>

            <br><br><br>

            Authorised Signatory

        </td>

    </tr>

</table>


</div>
`;

        doc.html(html, {
            x: contentX,
            y: contentY,
            width: contentW,                   // mm — must match the px width above
            windowWidth: mm2px(contentW),      // px — must match the div width above
            callback: async (doc) => {
                // Draw page border using the SAME outerMargin on all sides
                doc.setDrawColor(0);
                doc.setLineWidth(0.4);
                doc.rect(outerMargin, outerMargin,
                    pageW - 2 * outerMargin, pageH - 2 * outerMargin, 'S');

                const pdfBlob = doc.output('blob');
                // window.open(URL.createObjectURL(pdfBlob), '_blank');
                try {
                    const formData = new FormData();
                    formData.append('invoiceNumber', serviceData.invoiceNumber || getDefaultInvoiceNumber());
                    formData.append('invoiceAmount', calculateTotal().toString());
                    formData.append('invoicePdf', pdfBlob, `Invoice_${serviceData.invoiceNumber || getDefaultInvoiceNumber()}.pdf`);

await apiService.upload(`/api/cars/storeinvoice/${serviceData._id || id}`, formData);                    showToast.success('PDF uploaded to S3 successfully!');
                    window.location.reload();
                } catch (err) {
                    console.error('PDF upload error:', err);
                    showToast.error('Failed to upload PDF to S3');
                    setIsLoading(false);
                }
                setIsLoading(false);
            }
        });

        try {
            const token = localStorage.getItem('jwtToken');
await apiService.patch(`/api/services/collect-cost/${serviceData._id || id}`, {                cost: Number(calculateTotal())
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast.success('Collected amount updated!');
            closeInvoice()
            fetchServiceData(); // Refresh data if needed
        } catch (err) {
            showToast.error('Failed to update amount');
            return; // Stop PDF generation if API fails
        }
    };
    const getDefaultInvoiceNumber = () => {
        const now = new Date();
        now.setDate(now.getDate() - 1); // previous date
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const date = now.getDate().toString().padStart(2, '0');
        const minute = now.getMinutes().toString().padStart(2, '0');
        return `INV-${month}${date}${minute}`;
    };

    // useEffect(() => {
    //     fetchServiceData();
    // }, [id]);

        // Helper function to check if item exists, if not, create it via API
    const createItemIfNotExists = async (itemName) => {
        if (!itemName || itemName.trim() === "") return;

        // 1. Check if item already exists in the local state (case-insensitive check)
        const itemExists = items.find(item => item.itemName.toLowerCase() === itemName.toLowerCase());

        if (!itemExists) {
            try {
                setIsLoading(true); // Optional: Show loading if needed
                // 2. Call API to create new item
                const response = await apiService.post('/api/items/create', {
                    itemName: itemName.trim(),
                    // You can add default values here if your API requires them, e.g.:
                    // rate: 0, 
                    // type: 'General' 
                });

                if (response.data && (response.data.item || response.data)) {
                    const newItem = response.data.item || response.data;
                    
                    // 3. Update the items state to include the new item so autocomplete works next time
                    setItems(prevItems => [...prevItems, newItem]);
                    showToast.success(`New item "${itemName}" added to list`);
                }
            } catch (error) {
                console.error("Error creating item:", error);
                showToast.error('Failed to add new item to database');
            } finally {
                setIsLoading(false);
            }
        }
    };

        // Handle keyboard navigation in invoice table
    const handleKeyPress = (e, index, field) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            let nextField = null;
            const currentRowIndex = index;

            // Define navigation flow: description -> quantity -> rate -> next row description
            if (field === 'description') {
                nextField = `quantity-${currentRowIndex}`;
            } else if (field === 'quantity') {
                nextField = `rate-${currentRowIndex}`;
            } else if (field === 'rate') {
                // Move to next row's description, or add new item if last row
                const nextRowIndex = currentRowIndex + 1;
                if (nextRowIndex < invoiceItems.length) {
                    nextField = `description-${nextRowIndex}`;
                } else {
                    // Add new item and focus on its description
                    addInvoiceItem();
                    setTimeout(() => {
                        nextField = `description-${nextRowIndex}`;
                        const element = document.getElementById(nextField);
                        if (element) element.focus();
                    }, 100);
                    return;
                }
            }

            // Focus on next field
            if (nextField) {
                const element = document.getElementById(nextField);
                if (element) {
                    element.focus();
                }
            }
        }
    };

    return (
        <>
            <div className="cd-container">
                {showInvoice && (
                    <div className="invoice-overlay">
                        <div className="invoice-modal">
                            <div className="invoice-header">
                                <h2>INVOICE</h2>
                                <button className="close-invoice" onClick={closeInvoice}>×</button>
                            </div>
                            <div className="invoice-content">
                                <div className="invoice-header-section">
                                    <div className="invoice-header-info">
                                        <div className="invoice-label">Invoice No:</div>
                                        <div className="invoice-value">{serviceData.invoiceNumber || getDefaultInvoiceNumber()}</div>
                                    </div>
                                    <div className="invoice-header-info">
                                        <div className="invoice-label">Date:</div>
                                        <div className="invoice-value">{formatDate(new Date())}</div>
                                    </div>
                                </div>

                                <div className="service-section">
                                    <h3>Service Details</h3>
                                    <div className="service-info">
                                        <div className="info-label">Service:</div>
                                        <div className="info-value">{serviceData.description || '-'}</div>
                                    </div>
                                </div>

                                <div className="invoice-table">
                                    <div className="table-header">
                                        <div className="table-cell">Description</div>
                                        <div className="table-cell">Quantity</div>
                                        <div className="table-cell">Rate</div>
                                        <div className="table-cell">Amount</div>
                                    </div>
                                    {invoiceItems.map((item, index) => (
                                        <div key={index} className="table-row">
                                            <div className="table-cell">
                                                {/* Description Field with Autocomplete */}
                                                <div className="table-cell" style={{ position: 'relative', zIndex: 1 }}>
                                                    <input
                                                        id={`description-${index}`}
                                                        type="text"
                                                        value={item.description}
                                                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                                        onFocus={() => handleDescriptionFocus(index)}
                                                        onBlur={() => {
                                                            // Hide suggestions
                                                            setTimeout(() => setShowSuggestions(false), 200);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.altKey && e.key === 'c') {
                                                                e.preventDefault();
                                                                setAddItemInitialName(item.description);
                                                                setAddItemRowIndex(index);
                                                                setShowAddItemModal(true);
                                                                return;
                                                            }
                                                            if (showSuggestions && focusedRowIndex === index) {
                                                                const totalOptions = suggestions.length + 1;
                                                                if (e.key === 'ArrowDown') {
                                                                    e.preventDefault();
                                                                    setHighlightedIndex(prev => Math.min(prev + 1, totalOptions - 1));
                                                                } else if (e.key === 'ArrowUp') {
                                                                    e.preventDefault();
                                                                    setHighlightedIndex(prev => Math.max(prev - 1, 0));
                                                                } else if (e.key === 'Enter' && highlightedIndex >= 0) {
                                                                    e.preventDefault();
                                                                    if (highlightedIndex < suggestions.length) {
                                                                        selectSuggestion(index, suggestions[highlightedIndex].itemName);
                                                                    } else {
                                                                        setAddItemInitialName(item.description);
                                                                        setAddItemRowIndex(index);
                                                                        setShowAddItemModal(true);
                                                                        setShowSuggestions(false);
                                                                    }
                                                                    setHighlightedIndex(-1);
                                                                } else if (e.key === 'Escape') {
                                                                    setShowSuggestions(false);
                                                                    setHighlightedIndex(-1);
                                                                }
                                                            }
                                                        }}
                                                    onKeyPress={(e) => handleKeyPress(e, index, 'description')}
                                                    className="filter-input"
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                                    placeholder="Type or select item..."
                                                    autoComplete="off"
                                                    />
                                                    {/* Suggestions Popup */}
                                                    {showSuggestions && focusedRowIndex === index && (
                                                        <ul style={{
                                                            position: 'absolute',
                                                            top: '100%', // Position directly below the input
                                                            left: 0,
                                                            zIndex: 9999, // High z-index to sit above buttons
                                                            background: '#fff',
                                                            border: '1px solid #ccc',
                                                            borderRadius: '4px',
                                                            width: '100%',
                                                            maxHeight: '200px',
                                                            overflowY: 'auto',
                                                            listStyle: 'none',
                                                            padding: 0,
                                                            margin: 0,
                                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                                            fontSize: '14px'
                                                        }}>
                                                            {suggestions.length > 0 ? (
                                                                <>
                                                                    {suggestions.map((s, i) => (
                                                                        <li
                                                                            key={s._id}
                                                                            id={`suggestion-${index}-${i}`}
                                                                            onMouseDown={() => selectSuggestion(index, s.itemName)}
                                                                            onMouseEnter={() => setHighlightedIndex(i)}
                                                                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', background: highlightedIndex === i ? '#e8f0fe' : '#fff' }}
                                                                        >
                                                                            {s.type ? `${s.type} - ` : ''}{s.itemName}
                                                                        </li>
                                                                    ))}
                                                                    <li
                                                                        id={`suggestion-${index}-${suggestions.length}`}
                                                                        onMouseDown={(e) => { e.preventDefault(); setAddItemInitialName(item.description); setAddItemRowIndex(index); setShowAddItemModal(true); }}
                                                                        onMouseEnter={() => setHighlightedIndex(suggestions.length)}
                                                                        style={{ padding: '8px 12px', cursor: 'pointer', borderTop: '2px solid #eee', color: '#2563eb', fontWeight: 500, background: highlightedIndex === suggestions.length ? '#eff6ff' : '#fff' }}
                                                                    >
                                                                        + Add new item (Alt+C)
                                                                    </li>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <li style={{ padding: '8px 12px', color: '#888' }}>
                                                                        No items found
                                                                    </li>
                                                                    <li
                                                                        id={`suggestion-${index}-0`}
                                                                        onMouseDown={(e) => { e.preventDefault(); setAddItemInitialName(item.description); setAddItemRowIndex(index); setShowAddItemModal(true); }}
                                                                        onMouseEnter={() => setHighlightedIndex(0)}
                                                                        style={{ padding: '8px 12px', cursor: 'pointer', borderTop: '2px solid #eee', color: '#2563eb', fontWeight: 500, background: highlightedIndex === 0 ? '#eff6ff' : '#fff' }}
                                                                    >
                                                                        + Add "{item.description}" as new item (Alt+C)
                                                                    </li>
                                                                </>
                                                            )}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="table-cell">
                                                <input
                                                    id={`quantity-${index}`}
                                                    type="number"
                                                    value={item.quantity === 0 || item.quantity === '0' ? '' : item.quantity}
                                                    placeholder="Qty"
                                                    onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                                                    onKeyPress={(e) => handleKeyPress(e, index, 'quantity')}
                                                />
                                            </div>
                                            <div className="table-cell">
                                                <input
                                                    id={`rate-${index}`}
                                                    type="number"
                                                    value={item.rate === 0 || item.rate === '0' ? '' : item.rate}
                                                    placeholder="Rate"
                                                    onChange={(e) => updateInvoiceItem(index, 'rate', e.target.value)}
                                                    onKeyPress={(e) => handleKeyPress(e, index, 'rate')}
                                                />
                                            </div>
                                            <div className="table-cell">{item.amount || 0}</div>
                                            <div className="table-cell">
                                                <button className="remove-btn" onClick={() => removeInvoiceItem(index)}>Remove</button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="table-row">
                                        <div className="table-cell">
                                            <button className="add-invoice-item" onClick={addInvoiceItem}>Add Item</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="total-section">
                                    <div className="total-label">Total Amount:</div>
                                    <div className="total-value">₹{calculateTotal()}</div>
                                </div>

                                <button className="pdf-invoice" onClick={generatePDF}>Generate PDF</button>

                            </div>
                        </div>
                    </div>
                )}

                {showAmountPopup && (
                    <div className="invoice-overlay">
                        <div className="invoice-modal" style={{ maxWidth: 350 }}>
                            <div className="invoice-header" style={{ marginBottom: 16 }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Enter Collected Amount</h3>
                                <button className="close-invoice" onClick={() => setShowAmountPopup(false)}>×</button>
                            </div>
                            <div className="invoice-content">
                                <input
                                    type="number"
                                    value={amountInput}
                                    onChange={e => setAmountInput(e.target.value)}
                                    placeholder="Enter amount"
                                    style={{ marginBottom: 16, width: '100%', padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
                                />
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                    <button
                                        className="add-customer-button"
                                        style={{ minWidth: 90 }}
                                        onClick={async () => {
                                            setIsSubmittingAmount(true);
                                            try {
                                                const token = localStorage.getItem('jwtToken');
await apiService.patch(`/api/services/collect-cost/${serviceData._id || id}`, {                                                    additionalCost: Number(amountInput)
                                                }, {
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                                showToast.success('Collected amount updated!');
                                                setShowAmountPopup(false);
                                                setAmountInput('');
                                                fetchServiceData(); // Refresh data
                                            } catch (err) {
                                                showToast.error('Failed to update amount');
                                            } finally {
                                                setIsSubmittingAmount(false);
                                            }
                                        }}
                                        disabled={!amountInput || isSubmittingAmount}
                                    >
                                        {isSubmittingAmount ? 'Submitting...' : 'Submit'}
                                    </button>
                                    <button className="add-customer-button" onClick={() => setShowAmountPopup(false)}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                />
                {showAddItemModal && (
                    <AddItemModal
                        initialName={addItemInitialName}
                        onClose={() => setShowAddItemModal(false)}
                        onItemAdded={(savedName) => {
                            setShowAddItemModal(false);
                            fetchItems();
                            if (addItemRowIndex !== null && savedName) {
                                updateInvoiceItem(addItemRowIndex, 'description', savedName);
                                setTimeout(() => {
                                    const el = document.getElementById(`quantity-${addItemRowIndex}`);
                                    if (el) el.focus();
                                }, 100);
                            }
                            setAddItemRowIndex(null);
                        }}
                    />
                )}
                <div className="service-details-container">
                    <div className="cd-header">
                        <div>
                            <Link to="/services" className="cd-back-btn"><FiArrowLeft /> Back</Link>
                        </div>
                    </div>
                    <div className="cd-vertical-layout">
<div className="cd-left-sidebar">                    
                        <div className="service-profile">
                            {customerData && customerData.firstName ? (
                                <>
                                    <div className="service-avatar">{customerData.firstName?.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <div className="service-name">{`${customerData.firstName?.charAt(0).toUpperCase()}${customerData.firstName?.slice(1)} ${customerData.lastName?.charAt(0).toUpperCase()}${customerData.lastName?.slice(1)}`}</div>
                                        <div className="service-since">
                                            Customer since {formatDate(customerData.createdAt)}
                                        </div>
                                    </div>
                                    
                                </>
                                
                            ) : (
                                
                                <div className="no-customer-data">
                                    <div>No customer data available</div>
                                    {serviceData.customerId ? (
                                        <div>Customer ID: {serviceData.customerId}</div>
                                    ) : (
                                        <div>No customer ID found</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className='servicebtn-container'>
                            <button className="add-customer-button1" onClick={handleSendImage}>
                                Send Image
                                <FaWhatsapp className='icon2' style={{color:"green"}}/>
                            </button>
                            <button className="add-customer-button1" onClick={generateInvoice}>
                                Generate Invoice
                            </button>
                        </div>
                         <div className='service-date'>
                         <div className='icon'>📅</div>
                                <div className='service-date-tittle'>Service Date</div>
                                
                                <div className='service-tittle'>{formatDate(serviceData?.serviceDate)}</div>
                            </div>
                            <div className='service-date'>
                            <div className='icon'>⏳</div>
                                <div className=' service-date-tittle'>Due Date</div>
                                <div className='service-tittle'>{formatDate(serviceData?.dueDate)}</div>
                            </div>
                    </div>
                    
<div className="cd-right-content">
                    <div className='cd-service-info'>
                        <div className='cd-service-info-header'>
                            <div className='cd-service-header-title'>Service Details</div>
                        </div>
                        <div className='cd-service-content'>
                            <div className='cd-service-content-item'>
                                <div className='cd-service-content-item-title'>Brand Name</div>
                                <div className='cd-service-content-item-content'>{serviceData?.carId?.make} {serviceData?.carId?.model}</div>
                            </div>
                            <div className='cd-service-content-item'>
                                <div className='cd-service-content-item-title'>Vehicle Number</div>
                                <div className='cd-service-content-item-content'>{serviceData?.carId?.registrationNo}</div>
                            </div>
                            <div className='cd-service-content-item'>
                                <div className='cd-service-content-item-title'>Fuel Type</div>
                                <div className='cd-service-content-item-content'>{serviceData?.carId?.fuelType || '-'}</div>
                            </div>
                            <div className='cd-service-content-item'>
                                <div className='cd-service-content-item-title'>Mileage</div>
                                <div className='cd-service-content-item-content'>{serviceData?.mileage}</div>
                            </div>
                            <div className='cd-service-content-item'>
                                <div className='cd-service-content-item-title'>Service Type</div>
                                <div className='cd-service-content-item-content'>
                                    <select
                                        value={selectedServiceItem || serviceData?.description || ''}
                                        onChange={(e) => setSelectedServiceItem(e.target.value)}
                                        className="filter-select"
                                        style={{ width: '100%', padding: '0.5rem' }}
                                    >
                                        <option value="">{serviceData?.description || 'Select an item'}</option>
                                        {items.map((item) => (
                                            <option key={item._id} value={item.itemName}>
                                                {/* UPDATED: Shows Type - Name in Service Type dropdown */}
                                                {item.type ? `${item.type} - ` : ''}{item.itemName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className='cd-service-content-item' style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div className='cd-service-content-item-title'>Bill Amount</div>
                                    <div className='cd-service-content-item-content'>₹{serviceData?.cost}</div>
                                </div>
                                {Number(serviceData?.cost || 0) !== Number(serviceData?.collectedCost || 0) && (
                                    <div>
                                        <button className="add-customer-button" onClick={addAmountPopup}>
                                            Add Amount
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className='cd-service-content-item' style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div className='cd-service-content-item-title'>Pending Amount</div>
                                    <div className='cd-service-content-item-content' style={{ color: 'red' }}>₹ {
                                        Number(serviceData?.cost || 0) - Number(serviceData?.collectedCost || 0)
                                    }</div>
                                </div>
                                <div>
                                    <div className='cd-service-content-item-title'>Collected Amount</div>
                                    <div className='cd-service-content-item-content' style={{ color: 'green' }}>₹ {serviceData?.collectedCost == null ? 0 : serviceData?.collectedCost}</div>
                                </div>
                            </div>
                           
                            {serviceData?.invoiceUrl && (<div className='cd-service-content-item'>
                                <div className='cd-service-content-item-title'>Invoice PDF</div>
                                <div className='cd-service-content-item-content'>
                                    <a
                                        href={serviceData?.invoiceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#125caf', textDecoration: 'underline', cursor: 'pointer' }}
                                    >
                                        {`${serviceData.invoiceNumber || getDefaultInvoiceNumber()}.pdf`}
                                    </a>
                                </div>
                            </div>)}

                        </div>
                    </div>

                    <div className='cd-service-image-container'>
                        <div className='cd-service-image-header'>
                            <div className='cd-service-header-title'>Service Images</div>
                        </div>
                        <div className='cd-service-image-grid'>
                            {images.map((image, index) => (
                                <div key={index} className="cd-service-image-item">
                                    <a href={image} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={image}
                                            alt={`Service ${index + 1}`}
                                            className="cd-service-image"
                                        />
                                    </a>
                                    <FiTrash2
                                        className="cd-image-delete"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent the click from opening the image
                                            handleImageDelete(image);
                                        }}
                                    />
                                </div>
                            ))}
                            {images.length < 12 && (
                                <div className='cd-service-image-item add-image'>
                                    <div className='cd-service-image'>
                                        {isUploading ? (
                                            <div className="upload-loading">
                                                <div className="upload-spinner"></div>
                                                <span>Uploading...</span>
                                            </div>
                                        ) : (
                                            <span className="cd-vehicle-camera" onClick={handleImageClick}>
                                                <FiCamera />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div> </div>
       </div>
        </>
    );
};

export default ServiceDetails;
