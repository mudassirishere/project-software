// history.js - Bill History Page Functionality

// Global variables
let allBills = [];
let filteredBills = [];
let currentPage = 1;
let pageSize = 25;
let selectedBillIds = new Set();

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('History Page Initializing...');
    
    // Load bills
    loadBills();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check if viewing a specific bill
    const urlParams = new URLSearchParams(window.location.search);
    const viewBillId = urlParams.get('view');
    if (viewBillId) {
        showBillDetails(viewBillId);
    }
    
    console.log('History Page Initialized');
});

function setupEventListeners() {
    // Search input events
    const searchInputs = [
        'searchCustomer', 'searchBillNo', 'searchFromDate', 'searchToDate',
        'searchPaymentMethod', 'searchStatus', 'searchMinAmount', 'searchMaxAmount'
    ];
    
    searchInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    applyFilters();
                }
            });
        }
    });
    
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.bill-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
                const billId = checkbox.dataset.billId;
                if (this.checked) {
                    selectedBillIds.add(billId);
                } else {
                    selectedBillIds.delete(billId);
                }
            });
            updateSelectedCount();
        });
    }
}

function loadBills() {
    try {
        // Get page size
        pageSize = parseInt(document.getElementById('pageSize').value) || 25;
        
        // Load bills from localStorage
        allBills = JSON.parse(localStorage.getItem('bills') || '[]');
        
        // Sort by date (newest first)
        allBills.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
        
        // Apply filters
        applyFilters();
        
        // Update summary
        updateSummary();
        
        // Clear selected bills
        selectedBillIds.clear();
        const selectAllCheckbox = document.getElementById('selectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
        
    } catch (error) {
        console.error('Error loading bills:', error);
        showAlert('Error loading bills: ' + error.message, 'danger');
    }
}

function applyFilters() {
    try {
        // Get filter values
        const customer = document.getElementById('searchCustomer').value.toLowerCase();
        const billNo = document.getElementById('searchBillNo').value.toLowerCase();
        const fromDate = document.getElementById('searchFromDate').value;
        const toDate = document.getElementById('searchToDate').value;
        const paymentMethod = document.getElementById('searchPaymentMethod').value;
        const status = document.getElementById('searchStatus').value;
        const minAmount = parseFloat(document.getElementById('searchMinAmount').value) || 0;
        const maxAmount = parseFloat(document.getElementById('searchMaxAmount').value) || Number.MAX_SAFE_INTEGER;
        
        // Filter bills
        filteredBills = allBills.filter(bill => {
            // Customer filter
            if (customer && !bill.customerName?.toLowerCase().includes(customer)) {
                return false;
            }
            
            // Bill number filter
            if (billNo && !bill.billNo?.toLowerCase().includes(billNo)) {
                return false;
            }
            
            // Date range filter
            if (fromDate && bill.date < fromDate) {
                return false;
            }
            if (toDate && bill.date > toDate) {
                return false;
            }
            
            // Payment method filter
            if (paymentMethod && bill.paymentMethod !== paymentMethod) {
                return false;
            }
            
            // Status filter
            if (status) {
                const balance = parseFloat(bill.balance) || 0;
                const received = parseFloat(bill.receivedAmount) || 0;
                const netAmount = parseFloat(bill.netAmount) || 0;
                
                let billStatus = 'paid';
                if (balance > 0 && received > 0) {
                    billStatus = 'partial';
                } else if (balance > 0) {
                    billStatus = 'pending';
                }
                
                if (billStatus !== status) {
                    return false;
                }
            }
            
            // Amount range filter
            const amount = parseFloat(bill.netAmount) || 0;
            if (amount < minAmount || amount > maxAmount) {
                return false;
            }
            
            return true;
        });
        
        // Reset to first page
        currentPage = 1;
        
        // Display filtered bills
        displayBills();
        updatePagination();
        
        // Update filtered count
        document.getElementById('filteredCount').textContent = `${filteredBills.length} bills`;
        
    } catch (error) {
        console.error('Error applying filters:', error);
        showAlert('Error applying filters: ' + error.message, 'danger');
    }
}

function clearFilters() {
    // Clear all filter inputs
    document.getElementById('searchCustomer').value = '';
    document.getElementById('searchBillNo').value = '';
    document.getElementById('searchFromDate').value = '';
    document.getElementById('searchToDate').value = '';
    document.getElementById('searchPaymentMethod').value = '';
    document.getElementById('searchStatus').value = '';
    document.getElementById('searchMinAmount').value = '';
    document.getElementById('searchMaxAmount').value = '';
    
    // Apply filters (will show all bills)
    applyFilters();
    
    showAlert('Filters cleared', 'info');
}

function displayBills() {
    const tableBody = document.getElementById('billsTableBody');
    const noBillsMessage = document.getElementById('noBillsMessage');
    
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    if (filteredBills.length === 0) {
        // Show no bills message
        tableBody.style.display = 'none';
        if (noBillsMessage) {
            noBillsMessage.style.display = 'block';
        }
        return;
    }
    
    // Hide no bills message
    if (noBillsMessage) {
        noBillsMessage.style.display = 'none';
    }
    tableBody.style.display = 'table-row-group';
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredBills.length);
    const pageBills = filteredBills.slice(startIndex, endIndex);
    
    // Display bills for current page
    let totalAmount = 0;
    let totalDiscount = 0;
    let totalNetAmount = 0;
    let totalReceived = 0;
    let totalBalance = 0;
    
    pageBills.forEach(bill => {
        const amount = parseFloat(bill.subTotal) || 0;
        const discount = parseFloat(bill.discount) || 0;
        const netAmount = parseFloat(bill.netAmount) || 0;
        const received = parseFloat(bill.receivedAmount) || 0;
        const balance = parseFloat(bill.balance) || 0;
        
        // Calculate status
        let status = 'Paid';
        let statusClass = 'success';
        let rowClass = 'paid-row';
        
        if (balance > 0 && received > 0) {
            status = 'Partial';
            statusClass = 'info';
            rowClass = 'partial-row';
        } else if (balance > 0) {
            status = 'Pending';
            statusClass = 'warning';
            rowClass = 'pending-row';
        }
        
        // Update totals
        totalAmount += amount;
        totalDiscount += discount;
        totalNetAmount += netAmount;
        totalReceived += received;
        totalBalance += balance;
        
        // Create row
        const row = document.createElement('tr');
        row.className = rowClass;
        row.innerHTML = `
            <td class="select-checkbox no-print">
                <input type="checkbox" class="form-check-input bill-checkbox" 
                       data-bill-id="${bill.id}" onchange="toggleBillSelection('${bill.id}')">
            </td>
            <td><strong>${bill.billNo || 'N/A'}</strong></td>
            <td>${bill.date || 'N/A'}</td>
            <td>${bill.customerName || 'Unknown'}</td>
            <td class="bill-amount">Rs. ${amount.toFixed(2)}</td>
            <td class="d-none d-md-table-cell">Rs. ${discount.toFixed(2)}</td>
            <td><strong>Rs. ${netAmount.toFixed(2)}</strong></td>
            <td class="received-amount">Rs. ${received.toFixed(2)}</td>
            <td class="balance-amount">Rs. ${balance.toFixed(2)}</td>
            <td>
                <span class="badge payment-badge bg-secondary">${bill.paymentMethod || 'Cash'}</span>
            </td>
            <td>
                <span class="badge status-badge bg-${statusClass}">${status}</span>
            </td>
            <td class="no-print action-buttons">
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="showBillDetails('${bill.id}')" title="View details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="editBill('${bill.id}')" title="Edit bill">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmDeleteBill('${bill.id}')" title="Delete bill">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Update footer totals
    document.getElementById('footerAmount').textContent = `Rs. ${totalAmount.toFixed(2)}`;
    document.getElementById('footerDiscount').textContent = `Rs. ${totalDiscount.toFixed(2)}`;
    document.getElementById('footerNetAmount').textContent = `Rs. ${totalNetAmount.toFixed(2)}`;
    document.getElementById('footerReceived').textContent = `Rs. ${totalReceived.toFixed(2)}`;
    document.getElementById('footerBalance').textContent = `Rs. ${totalBalance.toFixed(2)}`;
    
    // Update selected count
    updateSelectedCount();
}

function updatePagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(filteredBills.length / pageSize);
    
    // Clear existing pagination
    pagination.innerHTML = '';
    
    if (totalPages <= 1) {
        return;
    }
    
    // Previous button
    const prevItem = document.createElement('li');
    prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevItem.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>`;
    pagination.appendChild(prevItem);
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
        pagination.appendChild(pageItem);
    }
    
    // Next button
    const nextItem = document.createElement('li');
    nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextItem.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>`;
    pagination.appendChild(nextItem);
}

function changePage(page) {
    if (page < 1 || page > Math.ceil(filteredBills.length / pageSize)) {
        return;
    }
    currentPage = page;
    displayBills();
    updatePagination();
    
    // Scroll to top of table
    const table = document.querySelector('.table-responsive');
    if (table) {
        table.scrollIntoView({ behavior: 'smooth' });
    }
}

function updateSummary() {
    const totalBills = allBills.length;
    const totalAmount = allBills.reduce((sum, bill) => sum + (parseFloat(bill.netAmount) || 0), 0);
    const pendingAmount = allBills.reduce((sum, bill) => sum + (parseFloat(bill.balance) || 0), 0);
    const averageAmount = totalBills > 0 ? totalAmount / totalBills : 0;
    
    document.getElementById('totalBillsCount').textContent = totalBills;
    document.getElementById('totalAmountSum').textContent = `Rs. ${totalAmount.toFixed(2)}`;
    document.getElementById('pendingBillsCount').textContent = `Rs. ${pendingAmount.toFixed(2)}`;
    document.getElementById('averageBillAmount').textContent = `Rs. ${averageAmount.toFixed(2)}`;
}

function toggleBillSelection(billId) {
    const checkbox = document.querySelector(`.bill-checkbox[data-bill-id="${billId}"]`);
    if (checkbox) {
        if (checkbox.checked) {
            selectedBillIds.add(billId);
        } else {
            selectedBillIds.delete(billId);
        }
    }
    
    // Update select all checkbox
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        const allCheckboxes = document.querySelectorAll('.bill-checkbox');
        const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
        selectAllCheckbox.checked = allChecked;
    }
    
    updateSelectedCount();
}

function updateSelectedCount() {
    // You can add a counter display if needed
    // For now, just update the delete button text
    const deleteBtn = document.querySelector('button[onclick="deleteSelectedBills()"]');
    if (deleteBtn && selectedBillIds.size > 0) {
        deleteBtn.innerHTML = `<i class="fas fa-trash me-1"></i> Delete (${selectedBillIds.size})`;
    } else if (deleteBtn) {
        deleteBtn.innerHTML = `<i class="fas fa-trash me-1"></i> Delete`;
    }
}

// DELETE FUNCTIONALITY - FIXED
function confirmDeleteBill(billId) {
    document.getElementById('deleteBillId').value = billId;
    document.getElementById('deleteCount').textContent = 'this bill';
    
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    deleteModal.show();
}

function deleteSelectedBills() {
    if (selectedBillIds.size === 0) {
        showAlert('Please select bills to delete', 'warning');
        return;
    }
    
    document.getElementById('deleteBillId').value = Array.from(selectedBillIds).join(',');
    document.getElementById('deleteCount').textContent = `${selectedBillIds.size} bill(s)`;
    
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    deleteModal.show();
}

function confirmBillDelete() {
    const billIds = document.getElementById('deleteBillId').value.split(',');
    
    try {
        // Get current bills
        let bills = JSON.parse(localStorage.getItem('bills') || '[]');
        
        // Count deleted bills for message
        const deletedCount = billIds.length;
        
        // Filter out deleted bills
        bills = bills.filter(bill => !billIds.includes(bill.id));
        
        // Save back to localStorage
        localStorage.setItem('bills', JSON.stringify(bills));
        
        // Close modal
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        deleteModal.hide();
        
        // Show success message
        showAlert(`${deletedCount} bill(s) deleted successfully`, 'success');
        
        // Reload bills
        loadBills();
        
        // Clear selection
        selectedBillIds.clear();
        
    } catch (error) {
        console.error('Error deleting bills:', error);
        showAlert('Error deleting bills: ' + error.message, 'danger');
    }
}

function showBillDetails(billId) {
    try {
        const bills = JSON.parse(localStorage.getItem('bills') || '[]');
        const bill = bills.find(b => b.id === billId);
        
        if (!bill) {
            showAlert('Bill not found', 'warning');
            return;
        }
        
        const modalContent = document.getElementById('billDetailsContent');
        if (!modalContent) return;
        
        // Calculate status
        const balance = parseFloat(bill.balance) || 0;
        const received = parseFloat(bill.receivedAmount) || 0;
        let status = 'Paid';
        let statusClass = 'success';
        
        if (balance > 0 && received > 0) {
            status = 'Partial Payment';
            statusClass = 'info';
        } else if (balance > 0) {
            status = 'Pending';
            statusClass = 'warning';
        }
        
        // Format items table
        let itemsHtml = '';
        if (bill.items && bill.items.length > 0) {
            itemsHtml = `
                <table class="table table-bordered bill-details-table">
                    <thead class="table-light">
                        <tr>
                            <th>Product</th>
                            <th>Weight (kg)</th>
                            <th>Rate (Rs.)</th>
                            <th>Amount (Rs.)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bill.items.map(item => `
                            <tr>
                                <td>${item.productName || 'N/A'}</td>
                                <td>${parseFloat(item.weight || 0).toFixed(2)}</td>
                                <td>${parseFloat(item.rate || 0).toFixed(2)}</td>
                                <td>${parseFloat(item.amount || 0).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            itemsHtml = '<p class="text-muted">No items found in this bill</p>';
        }
        
        // Create bill details HTML
        modalContent.innerHTML = `
            <div class="bill-details">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <h5 class="border-bottom pb-2">Bill Information</h5>
                        <p><strong>Bill No:</strong> ${bill.billNo || 'N/A'}</p>
                        <p><strong>Date:</strong> ${bill.date || 'N/A'}</p>
                        <p><strong>Status:</strong> <span class="badge bg-${statusClass}">${status}</span></p>
                    </div>
                    <div class="col-md-6">
                        <h5 class="border-bottom pb-2">Customer Information</h5>
                        <p><strong>Name:</strong> ${bill.customerName || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${bill.customerPhone || 'N/A'}</p>
                        <p><strong>Payment Method:</strong> ${bill.paymentMethod || 'Cash'}</p>
                    </div>
                </div>
                
                <h5 class="border-bottom pb-2 mb-3">Bill Items</h5>
                ${itemsHtml}
                
                <div class="row mt-4">
                    <div class="col-md-6">
                        <h5 class="border-bottom pb-2">Amount Summary</h5>
                        <p><strong>Sub Total:</strong> Rs. ${parseFloat(bill.subTotal || 0).toFixed(2)}</p>
                        <p><strong>Discount:</strong> Rs. ${parseFloat(bill.discount || 0).toFixed(2)}</p>
                        <p><strong>Net Amount:</strong> <span class="fw-bold">Rs. ${parseFloat(bill.netAmount || 0).toFixed(2)}</span></p>
                    </div>
                    <div class="col-md-6">
                        <h5 class="border-bottom pb-2">Payment Summary</h5>
                        <p><strong>Received Amount:</strong> Rs. ${parseFloat(bill.receivedAmount || 0).toFixed(2)}</p>
                        <p><strong>Balance:</strong> Rs. ${parseFloat(bill.balance || 0).toFixed(2)}</p>
                        <p><strong>Remarks:</strong> ${bill.remarks || 'None'}</p>
                    </div>
                </div>
                
                ${bill.timestamp ? `
                <div class="mt-3 text-muted small">
                    <i class="fas fa-clock me-1"></i>
                    Created: ${new Date(bill.timestamp).toLocaleString()}
                </div>
                ` : ''}
            </div>
        `;
        
        // Store current bill ID for printing
        modalContent.dataset.currentBillId = billId;
        
        // Show modal
        const detailsModal = new bootstrap.Modal(document.getElementById('billDetailsModal'));
        detailsModal.show();
        
    } catch (error) {
        console.error('Error showing bill details:', error);
        showAlert('Error loading bill details', 'danger');
    }
}

function editBill(billId) {
    window.location.href = `billing.html?edit=${billId}`;
}

function printCurrentBill() {
    const billId = document.getElementById('billDetailsContent').dataset.currentBillId;
    if (!billId) {
        showAlert('No bill selected for printing', 'warning');
        return;
    }
    
    // Save current bill in localStorage for printing
    try {
        const bills = JSON.parse(localStorage.getItem('bills') || '[]');
        const bill = bills.find(b => b.id === billId);
        
        if (bill) {
            // Open billing page in print mode
            window.open(`billing.html?print=${billId}`, '_blank');
        }
    } catch (error) {
        console.error('Error preparing bill for printing:', error);
    }
}

function printBillList() {
    window.print();
}

function generateSummaryReport() {
    try {
        if (filteredBills.length === 0) {
            showAlert('No bills to generate report', 'warning');
            return;
        }
        
        // Calculate report data
        const totalBills = filteredBills.length;
        const totalRevenue = filteredBills.reduce((sum, bill) => sum + (parseFloat(bill.netAmount) || 0), 0);
        const pendingAmount = filteredBills.reduce((sum, bill) => sum + (parseFloat(bill.balance) || 0), 0);
        const totalDiscount = filteredBills.reduce((sum, bill) => sum + (parseFloat(bill.discount) || 0), 0);
        
        // Create report HTML
        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bill History Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1, h2 { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f4f4f4; }
                    .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .total { font-weight: bold; color: #198754; }
                </style>
            </head>
            <body>
                <h1>Bill History Report</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                
                <div class="summary">
                    <h2>Summary</h2>
                    <p>Total Bills: ${totalBills}</p>
                    <p>Total Revenue: Rs. ${totalRevenue.toFixed(2)}</p>
                    <p>Total Discount: Rs. ${totalDiscount.toFixed(2)}</p>
                    <p>Pending Amount: Rs. ${pendingAmount.toFixed(2)}</p>
                </div>
                
                <h2>Bills List</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Bill No</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Net Amount</th>
                            <th>Received</th>
                            <th>Balance</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredBills.map(bill => {
                            const netAmount = parseFloat(bill.netAmount) || 0;
                            const received = parseFloat(bill.receivedAmount) || 0;
                            const balance = parseFloat(bill.balance) || 0;
                            const status = balance === 0 ? 'Paid' : (received > 0 ? 'Partial' : 'Pending');
                            
                            return `
                                <tr>
                                    <td>${bill.billNo || 'N/A'}</td>
                                    <td>${bill.date || 'N/A'}</td>
                                    <td>${bill.customerName || 'Unknown'}</td>
                                    <td>Rs. ${netAmount.toFixed(2)}</td>
                                    <td>Rs. ${received.toFixed(2)}</td>
                                    <td>Rs. ${balance.toFixed(2)}</td>
                                    <td>${status}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; text-align: center; color: #666;">
                    <p>Generated by Billing System Pro</p>
                </div>
            </body>
            </html>
        `);
        
        reportWindow.document.close();
        reportWindow.print();
        
        showAlert('Report generated successfully', 'success');
        
    } catch (error) {
        console.error('Error generating report:', error);
        showAlert('Error generating report', 'danger');
    }
}

function exportAllBills() {
    exportBills(allBills, 'all_bills');
}

function exportFilteredBills() {
    exportBills(filteredBills, 'filtered_bills');
}

function exportBills(billsToExport, filename) {
    try {
        if (billsToExport.length === 0) {
            showAlert('No bills to export', 'warning');
            return;
        }
        
        // Convert to CSV
        const headers = ['Bill No', 'Date', 'Customer', 'Phone', 'Sub Total', 'Discount', 'Net Amount', 
                        'Received Amount', 'Balance', 'Payment Method', 'Status', 'Remarks'];
        
        const csvData = billsToExport.map(bill => {
            const netAmount = parseFloat(bill.netAmount) || 0;
            const received = parseFloat(bill.receivedAmount) || 0;
            const balance = parseFloat(bill.balance) || 0;
            const status = balance === 0 ? 'Paid' : (received > 0 ? 'Partial' : 'Pending');
            
            return [
                bill.billNo || '',
                bill.date || '',
                bill.customerName || '',
                bill.customerPhone || '',
                parseFloat(bill.subTotal || 0).toFixed(2),
                parseFloat(bill.discount || 0).toFixed(2),
                netAmount.toFixed(2),
                received.toFixed(2),
                balance.toFixed(2),
                bill.paymentMethod || 'Cash',
                status,
                bill.remarks || ''
            ];
        });
        
        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        csvData.forEach(row => {
            csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert(`Exported ${billsToExport.length} bills successfully`, 'success');
        
    } catch (error) {
        console.error('Error exporting bills:', error);
        showAlert('Error exporting bills', 'danger');
    }
}

function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    container.parentNode.insertBefore(alertDiv, container);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}