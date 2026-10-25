import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { showToast } from '../components/ToasterService';
import 'react-toastify/dist/ReactToastify.css';

import { useLoading } from '../context/LoadingContext';
import '../style/Items.css';
import AddItemModal from '../components/AddItemModal';
import EditItemModal from '../components/EditItemModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import Pagination from '../components/Pagination';
import { apiService } from '../services/apiService';

const Items = () => {
    const [showAddItem, setShowAddItem] = useState(false);
    const [showEditItem, setShowEditItem] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [filteredItems, setFilteredItems] = useState([]);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const { setIsLoading } = useLoading();

    const fetchItems = async (page = 1, search = '', limit) => {
        const effectiveLimit = limit !== undefined ? limit : itemsPerPage;
        try {
            setIsLoading(true);
            const response = await apiService.get(`/api/items/getall?page=${page}&limit=${effectiveLimit}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
            console.log('Get Items Response:', response);

            if (response?.data?.items) {
                setFilteredItems(response.data.items);
                setCurrentPage(response.data.pagination?.page || 1);
                setTotalPages(response.data.pagination?.totalPages || 1);
            } else if (response?.data && Array.isArray(response.data)) {
                // Fallback for non-paginated response
                setFilteredItems(response.data);
                setCurrentPage(1);
                setTotalPages(1);
            } else if (Array.isArray(response)) {
                // Fallback for array response
                setFilteredItems(response);
                setCurrentPage(1);
                setTotalPages(1);
            } else {
                setFilteredItems([]);
                setError('No items found or invalid response format');
                setCurrentPage(1);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('Error fetching items:', err);
            setError(err?.message || 'Failed to load items');
            showToast.error(err?.message || 'Failed to load items');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems(1, searchQuery);
    }, [searchQuery]);

    const handlePageChange = (page) => {
        fetchItems(page, searchQuery);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePageSizeChange = (size) => {
        setItemsPerPage(size);
        fetchItems(1, searchQuery, size);
    };

    const handleAddItem = () => {
        setShowAddItem(true);
    };

    const handleEditItem = (item) => {
        setSelectedItem(item);
        setShowEditItem(true);
    };

    const handleDeleteItem = (item) => {
        setSelectedItem(item);
        setShowDeleteModal(true);
    };

    const handleItemAdded = () => {
        fetchItems();
        setShowAddItem(false);
    };

    const handleItemUpdated = () => {
        fetchItems();
        setShowEditItem(false);
        setSelectedItem(null);
    };

    const confirmDelete = async () => {
        if (!selectedItem) return;

        try {
            setIsLoading(true);
            // Use item.id instead of item._id since that's what's being used in the table
            const itemId = selectedItem.id || selectedItem._id;
            if (!itemId) {
                throw new Error('Item ID is missing');
            }
            const response = await apiService.delete(`/api/items/delete/${itemId}`);
            console.log('Delete Item Response:', response);

            showToast.success('Item deleted successfully');
            fetchItems();
            setShowDeleteModal(false);
            setSelectedItem(null);
        } catch (err) {
            console.error('Error deleting item:', err);
            showToast.error(err?.message || 'Failed to delete item');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        
        // If search query is empty, fetch all items
        if (!query.trim()) {
            fetchItems(1, '');
            return;
        }
        
        // Filter items based on item name only
        const filtered = filteredItems.filter(item => {
            const itemName = item.itemName || item.name || '';
            return itemName.toLowerCase().includes(query);
        });
        
        setFilteredItems(filtered);
    };

    return (
        <div className="items-container">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Items</h1>
                </div>
                <button className="add-item-button" onClick={handleAddItem}>
                    <FiPlus className="plus-icon" />
                    Add Item
                </button>
            </div>

            <div className="search-container">
                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by Item name..."
                        className="search-input"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="items-table-container">
                <table className="items-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Item Name</th>
                            <th>Item Details</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length > 0 ? (filteredItems.map((item, index) => (
                            <tr key={item.id || index}>
                                <td>{index + 1}</td>
                                <td>{item.itemName}</td>
                                <td className="item-details-cell">{item.itemDetails}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="action-button edit-button"
                                            onClick={() => handleEditItem(item)}
                                            title="Edit Item"
                                        >
                                            <FiEdit2 />
                                        </button>
                                        <button
                                            className="action-button delete-button"
                                            onClick={() => handleDeleteItem(item)}
                                            title="Delete Item"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))) : (
                            <tr>
                                <td colSpan="4" className="no-data">
                                    {searchQuery ? 'No items found matching your search.' : 'No items available. Click "Add Item" to create one.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 0 && (
                <div className="pagination-wrapper" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        showOnSeparatePage={totalPages >= 3}
                        pageSize={itemsPerPage}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </div>
            )}

            {showAddItem && (
                <AddItemModal
                    onClose={() => setShowAddItem(false)}
                    onItemAdded={handleItemAdded}
                />
            )}

            {showEditItem && selectedItem && (
                <EditItemModal
                    item={selectedItem}
                    onClose={() => {
                        setShowEditItem(false);
                        setSelectedItem(null);
                    }}
                    onItemUpdated={handleItemUpdated}
                />
            )}

            {showDeleteModal && selectedItem && (
                <DeleteConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedItem(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Delete Item"
                    message={`Are you sure you want to delete "${selectedItem.name}"? This action cannot be undone.`}
                />
            )}
        </div>
    );
};

export default Items;
