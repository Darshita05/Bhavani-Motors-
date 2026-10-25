// src/components/ToasterService.jsx
import { toast } from 'react-toastify';

export const showToast = {
    success: (message) => {
        toast.success(message, {
            position: "top-right",
            autoClose: 5000,
            theme: "light",
            style: {
                backgroundColor: '#d4edda', // Light green background
                color: '#155724' // Dark green text
            }
        }); 
    },
    error: (message) => {
        toast.error(message, {
            position: "top-right",
            autoClose: 5000,
            theme: "light",
            style: {
                backgroundColor: '#f8d7da', // Light red background
                color: '#721c24' // Dark red text
            }
        });
    },
    info: (message) => {
        toast.info(message, {
            position: "top-right",
            autoClose: 3000,
            theme: "light",
            style: {
                backgroundColor: '#d1ecf1',
                color: '#0c5460'
            }
        });
    },
    warn: (message) => {
        toast.warn(message, {
            position: "top-right",
            autoClose: 4000,
            theme: "light"
        });
    }
};
