import React from 'react';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 75, 100];

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    showOnSeparatePage = false,
    pageSize,
    onPageSizeChange,
}) => {
    const sizeSelector = onPageSizeChange ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#374151' }}>
            <span>Rows per page:</span>
            <select
                value={pageSize || 10}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    cursor: 'pointer',
                    background: '#fff',
                }}
            >
                {PAGE_SIZE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    ) : null;

    const wrapWithSelector = (navContent) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '10px' }}>
            {sizeSelector || <span />}
            {navContent || <span />}
        </div>
    );

    if (totalPages <= 1) {
        if (!sizeSelector) return null;
        return wrapWithSelector(null);
    }

    // Show simplified prev/next when 3+ pages and showOnSeparatePage is false
    if (totalPages >= 3 && !showOnSeparatePage) {
        const navContent = (
            <div className="pagination-container">
                <div className="pagination-info">
                    <p>Showing page {currentPage} of {totalPages}</p>
                </div>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="page-button"
                >
                    Previous
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="page-button"
                >
                    Next
                </button>
            </div>
        );
        return wrapWithSelector(navContent);
    }

    // Numbered pages for 2 pages or showOnSeparatePage = true
    let maxVisiblePages = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    let pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(
            <button
                key={i}
                onClick={() => onPageChange(i)}
                className={`page-button ${currentPage === i ? 'active' : ''}`}
            >
                {i}
            </button>
        );
    }

    const navContent = (
        <div className="pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-button"
            >
                Previous
            </button>
            {pages}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="page-button"
            >
                Next
            </button>
        </div>
    );

    return wrapWithSelector(navContent);
};

export default Pagination;
