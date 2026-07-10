// Inventory Management JavaScript - Fixed Version
// Compatible with storage.js and script.js

// Global variables
let currentInventory = [];
let editItemId = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inventory Management Initializing...');
    
    // Check if we're on inventory page
    if (!document.getElementById('inventoryTableBody')) {
        console.log('Not on inventory page');
        return;
    }
    
    // Load initial data
    loadInventory();
    loadInventoryStats();
    loadStockAlerts();
    setupEventListeners();
    
    console.log('Inventory Management Initialized');
});

// ==================== STORAGE FUNCTIONS ====================
// These functions are also in storage.js, but we'll define them here for safety

function getInventoryFromStorage() {
    try {
        const inventory = localStorage.getItem('inventory');
        if (inventory) {
            return JSON.parse(inventory);
        } else {
            // Create default inventory if none exists
            const defaultInventory = [
                {
                    id: 'item_1',
                    name: 'Sample Product',
                    category: 'General',
                    type: 'finished',
                    unit: 'piece',
                    stock: 50,
                    costPrice: 100,
                    sellingPrice: 150,
                    reorderLevel: 10,
                    supplier: 'Default Supplier',
                    supplierContact: 'contact@supplier.com',
                    description: 'Sample inventory item',
                    lastUpdated: new Date().toISOString()
                }
            ];
            localStorage.setItem('inventory', JSON.stringify(defaultInventory));
            return defaultInventory;
        }
    } catch (error) {
        console.error('Error loading inventory from storage:', error);
        return [];
    }
}

function saveInventoryItemToStorage(itemData) {
    try {
        let inventory = getInventoryFromStorage();
        
        // Generate ID if new item
        if (!itemData.id) {
            itemData.id = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            itemData.createdAt = new Date().toISOString();
        }
        
        // Update timestamp
        itemData.lastUpdated = new Date().toISOString();
        
        // Check if editing existing item
        const existingIndex = inventory.findIndex(item => item.id === itemData.id);
        
        if (existingIndex >= 0) {
            // Update existing item
            inventory[existingIndex] = { ...inventory[existingIndex], ...itemData };
        } else {
            // Add new item
            inventory.push(itemData);
        }
        
        // Save to localStorage
        localStorage.setItem('inventory', JSON.stringify(inventory));
        console.log('Inventory item saved:', itemData.id);
        return true;
    } catch (error) {
        console.error('Error saving inventory item:', error);
        return false;
    }
}

function deleteInventoryItem(itemId) {
    try {
        let inventory = getInventoryFromStorage();
        const initialLength = inventory.length;
        
        inventory = inventory.filter(item => item.id !== itemId);
        
        if (inventory.length === initialLength) {
            console.log('Item not found for deletion:', itemId);
            return false;
        }
        
        localStorage.setItem('inventory', JSON.stringify(inventory));
        console.log('Inventory item deleted:', itemId);
        return true;
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        return false;
    }
}

// ==================== HELPER FUNCTIONS ====================

function getFinishedGoods() {
    const inventory = getInventoryFromStorage();
    return inventory.filter(item => item.type === 'finished');
}

function getLowStockItems() {
    const inventory = getInventoryFromStorage();
    return inventory.filter(item => {
        const reorderLevel = item.reorderLevel || 10;
        return item.stock > 0 && item.stock < reorderLevel;
    });
}

// ==================== MAIN FUNCTIONS ====================

// Load inventory items
function loadInventory() {
    try {
        const searchTerm = document.getElementById('searchInventory')?.value.toLowerCase() || '';
        const filterType = document.getElementById('filterType')?.value || '';
        const filterStock = document.getElementById('filterStock')?.value || '';
        
        currentInventory = getInventoryFromStorage();
        const tbody = document.getElementById('inventoryTableBody');
        const noItemsMessage = document.getElementById('noItemsMessage');
        
        if (!tbody) {
            console.error('Inventory table body not found');
            return;
        }
        
        // Show loading
        tbody.innerHTML = `
            <tr id="loadingRow">
                <td colspan="9" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 mb-0">Loading inventory...</p>
                </td>
            </tr>
        `;
        
        setTimeout(() => {
            // Filter inventory
            let filteredInventory = currentInventory.filter(item => {
                // Search filter
                if (searchTerm && 
                    !item.name.toLowerCase().includes(searchTerm) && 
                    !item.category.toLowerCase().includes(searchTerm)) {
                    return false;
                }
                
                // Type filter
                if (filterType && item.type !== filterType) {
                    return false;
                }
                
                // Stock filter
                if (filterStock) {
                    const reorderLevel = item.reorderLevel || 10;
                    if (filterStock === 'low' && (item.stock >= reorderLevel || item.stock === 0)) return false;
                    if (filterStock === 'out' && item.stock > 0) return false;
                    if (filterStock === 'available' && item.stock <= 0) return false;
                }
                
                return true;
            });
            
            // Update total items count
            const totalItemsElement = document.getElementById('totalItems');
            if (totalItemsElement) {
                totalItemsElement.textContent = filteredInventory.length;
            }
            
            // Calculate total inventory value
            const totalValue = filteredInventory.reduce((sum, item) => {
                return sum + (item.stock * parseFloat(item.costPrice || 0));
            }, 0);
            
            const totalValueElement = document.getElementById('totalInventoryValue');
            if (totalValueElement) {
                totalValueElement.textContent = `Rs. ${totalValue.toFixed(2)}`;
            }
            
            // Update inventory summary
            const summaryElement = document.getElementById('inventorySummary');
            if (summaryElement) {
                summaryElement.textContent = `Showing ${filteredInventory.length} of ${currentInventory.length} items`;
            }
            
            if (filteredInventory.length === 0) {
                tbody.innerHTML = '';
                if (noItemsMessage) noItemsMessage.style.display = 'block';
                return;
            }
            
            if (noItemsMessage) noItemsMessage.style.display = 'none';
            
            // Sort by stock level (lowest first)
            filteredInventory.sort((a, b) => a.stock - b.stock);
            
            tbody.innerHTML = '';
            
            filteredInventory.forEach(item => {
                const row = document.createElement('tr');
                
                // Add CSS classes based on stock level
                const reorderLevel = item.reorderLevel || 10;
                if (item.stock === 0) {
                    row.classList.add('out-of-stock');
                } else if (item.stock < reorderLevel) {
                    row.classList.add('low-stock');
                }
                
                // Determine status
                let status = '';
                let statusClass = '';
                if (item.stock === 0) {
                    status = 'Out of Stock';
                    statusClass = 'badge bg-danger';
                } else if (item.stock < reorderLevel) {
                    status = 'Low Stock';
                    statusClass = 'badge bg-warning';
                } else {
                    status = 'In Stock';
                    statusClass = 'badge bg-success';
                }
                
                row.innerHTML = `
                    <td><small class="text-muted">${item.id.substring(0, 8)}</small></td>
                    <td><strong>${item.name}</strong></td>
                    <td class="d-none d-md-table-cell">${item.category}</td>
                    <td>
                        <span class="badge ${item.type === 'finished' ? 'bg-success' : 
                                          item.type === 'raw' ? 'bg-info' : 'bg-secondary'}">
                            ${item.type === 'finished' ? 'Finished' : 
                             item.type === 'raw' ? 'Raw' : 'Consumable'}
                        </span>
                    </td>
                    <td>
                        <strong>${item.stock}</strong> ${item.unit}
                        ${item.reorderLevel ? `<br><small class="text-muted">Reorder: ${item.reorderLevel}</small>` : ''}
                    </td>
                    <td>Rs. ${parseFloat(item.costPrice || 0).toFixed(2)}</td>
                    <td>Rs. ${parseFloat(item.sellingPrice || 0).toFixed(2)}</td>
                    <td><span class="${statusClass}">${status}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-outline-primary btn-sm" onclick="editItem('${item.id}')" 
                                    title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="updateStock('${item.id}', 'add')"
                                    title="Add Stock">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="btn btn-outline-warning btn-sm" onclick="updateStock('${item.id}', 'remove')"
                                    title="Remove Stock">
                                <i class="fas fa-minus"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="showDeleteConfirm('${item.id}')"
                                    title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Initialize tooltips
            initializeTooltips();
            
        }, 300); // Small delay for better UX
        
    } catch (error) {
        console.error('Error loading inventory:', error);
        const tbody = document.getElementById('inventoryTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4 text-danger">
                        <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                        <p>Error loading inventory</p>
                        <button class="btn btn-sm btn-primary" onclick="loadInventory()">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </td>
                </tr>
            `;
        }
    }
}

// Load inventory statistics
function loadInventoryStats() {
    try {
        const inventory = getInventoryFromStorage();
        const finishedGoods = getFinishedGoods();
        const lowStockItems = getLowStockItems();
        const outOfStockItems = inventory.filter(item => item.stock === 0);
        const inStockItems = inventory.filter(item => item.stock > 0);
        
        // Update DOM elements
        const elements = {
            'totalItems': inventory.length,
            'inStockItems': inStockItems.length, // Changed from 'finishedGoods' to match HTML
            'lowStock': lowStockItems.length,
            'outOfStock': outOfStockItems.length
        };
        
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
        
    } catch (error) {
        console.error('Error loading inventory stats:', error);
    }
}

// Load stock alerts
function loadStockAlerts() {
    try {
        const lowStockItems = getLowStockItems();
        const outOfStockItems = getInventoryFromStorage().filter(item => item.stock === 0);
        const alertsDiv = document.getElementById('stockAlerts');
        const alertsCard = document.getElementById('alertsCard');
        
        if (!alertsDiv) return;
        
        alertsDiv.innerHTML = '';
        
        if (lowStockItems.length === 0 && outOfStockItems.length === 0) {
            alertsDiv.innerHTML = `
                <div class="alert alert-success mb-0">
                    <i class="fas fa-check-circle me-2"></i>
                    All inventory items are sufficiently stocked.
                </div>
            `;
            if (alertsCard) alertsCard.style.display = 'block';
            return;
        }
        
        // Show alerts card
        if (alertsCard) alertsCard.style.display = 'block';
        
        // Out of stock alerts
        outOfStockItems.forEach(item => {
            const alert = document.createElement('div');
            alert.className = 'alert alert-danger mb-2';
            alert.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="fas fa-times-circle me-2"></i>
                        <strong>${item.name}</strong> is out of stock!
                        ${item.supplier ? `<br><small>Supplier: ${item.supplier}</small>` : ''}
                    </div>
                    <button class="btn btn-sm btn-outline-light" onclick="restockItem('${item.id}')">
                        Restock
                    </button>
                </div>
            `;
            alertsDiv.appendChild(alert);
        });
        
        // Low stock alerts
        lowStockItems.forEach(item => {
            const reorderLevel = item.reorderLevel || 10;
            const alert = document.createElement('div');
            alert.className = 'alert alert-warning mb-2';
            alert.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>${item.name}</strong> has low stock: ${item.stock} ${item.unit}
                        ${reorderLevel ? `<br><small>Reorder level: ${reorderLevel}</small>` : ''}
                    </div>
                    <button class="btn btn-sm btn-outline-dark" onclick="updateStock('${item.id}', 'add')">
                        Add Stock
                    </button>
                </div>
            `;
            alertsDiv.appendChild(alert);
        });
        
    } catch (error) {
        console.error('Error loading stock alerts:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    try {
        // Search input
        const searchInput = document.getElementById('searchInventory');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(loadInventory, 300); // Debounce
            });
        }
        
        // Filter selects
        ['filterType', 'filterStock'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', loadInventory);
            }
        });
        
        // Save item button
        const saveBtn = document.getElementById('saveItemBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveInventoryItem);
        }
        
        // Form submission
        const inventoryForm = document.getElementById('inventoryForm');
        if (inventoryForm) {
            inventoryForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveInventoryItem();
            });
        }
        
        // Modal close event
        const modal = document.getElementById('addItemModal');
        if (modal) {
            modal.addEventListener('hidden.bs.modal', function() {
                resetInventoryForm();
            });
        }
        
        console.log('Event listeners set up');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Initialize tooltips
function initializeTooltips() {
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltips = document.querySelectorAll('[title]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
    }
}

// Load categories for autocomplete
function loadCategories() {
    try {
        const inventory = getInventoryFromStorage();
        const categories = [...new Set(inventory.map(item => item.category).filter(Boolean))];
        const datalist = document.getElementById('categoryList');
        
        if (!datalist) return;
        
        datalist.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            datalist.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Edit inventory item
function editItem(itemId) {
    try {
        const inventory = getInventoryFromStorage();
        const item = inventory.find(item => item.id === itemId);
        
        if (!item) {
            showAlert('Item not found!', 'danger');
            return;
        }
        
        editItemId = itemId;
        
        // Fill form
        document.getElementById('modalTitle').textContent = 'Edit Inventory Item';
        document.getElementById('itemId').value = item.id;
        document.getElementById('itemName').value = item.name || '';
        document.getElementById('category').value = item.category || '';
        document.getElementById('itemType').value = item.type || 'finished';
        document.getElementById('unit').value = item.unit || 'piece';
        document.getElementById('stock').value = item.stock || 0;
        document.getElementById('costPrice').value = item.costPrice || 0;
        document.getElementById('sellingPrice').value = item.sellingPrice || 0;
        document.getElementById('reorderLevel').value = item.reorderLevel || '';
        document.getElementById('supplier').value = item.supplier || '';
        document.getElementById('supplierContact').value = item.supplierContact || '';
        document.getElementById('description').value = item.description || '';
        
        // Show modal
        const modalElement = document.getElementById('addItemModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    } catch (error) {
        console.error('Error editing item:', error);
        showAlert('Error loading item for editing!', 'danger');
    }
}

// Save inventory item
function saveInventoryItem() {
    try {
        // Validate form
        const requiredFields = [
            { id: 'itemName', name: 'Item Name' },
            { id: 'category', name: 'Category' },
            { id: 'stock', name: 'Stock Quantity' },
            { id: 'costPrice', name: 'Cost Price' },
            { id: 'sellingPrice', name: 'Selling Price' }
        ];
        
        let isValid = true;
        let errorMessages = [];
        
        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element) return;
            
            const value = element.value.trim();
            if (!value || (field.id === 'stock' && parseFloat(value) < 0)) {
                element.classList.add('is-invalid');
                errorMessages.push(`${field.name} is required`);
                isValid = false;
            } else {
                element.classList.remove('is-invalid');
            }
        });
        
        if (!isValid) {
            showAlert('Please fix the following errors:<br>' + errorMessages.join('<br>'), 'danger');
            return;
        }
        
        // Prepare item data
        const itemData = {
            id: document.getElementById('itemId').value || null,
            name: document.getElementById('itemName').value,
            category: document.getElementById('category').value,
            type: document.getElementById('itemType').value,
            unit: document.getElementById('unit').value,
            stock: parseFloat(document.getElementById('stock').value),
            costPrice: parseFloat(document.getElementById('costPrice').value),
            sellingPrice: parseFloat(document.getElementById('sellingPrice').value),
            reorderLevel: document.getElementById('reorderLevel').value ? 
                          parseFloat(document.getElementById('reorderLevel').value) : null,
            supplier: document.getElementById('supplier').value || null,
            supplierContact: document.getElementById('supplierContact').value || null,
            description: document.getElementById('description').value || null,
            lastUpdated: new Date().toISOString()
        };
        
        // Save to storage
        const success = saveInventoryItemToStorage(itemData);
        
        if (success) {
            // Close modal
            const modalElement = document.getElementById('addItemModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
            
            // Reload data
            loadInventory();
            loadInventoryStats();
            loadStockAlerts();
            loadCategories();
            
            // Show success message
            showAlert(`Item "${itemData.name}" saved successfully!`, 'success');
        } else {
            showAlert('Error saving item!', 'danger');
        }
    } catch (error) {
        console.error('Error saving inventory item:', error);
        showAlert('Error saving item: ' + error.message, 'danger');
    }
}

// Reset form
function resetInventoryForm() {
    try {
        const form = document.getElementById('inventoryForm');
        if (form) {
            form.reset();
            document.getElementById('modalTitle').textContent = 'Add New Inventory Item';
            document.getElementById('itemId').value = '';
            editItemId = null;
            
            // Remove validation classes
            const formControls = form.querySelectorAll('.form-control, .form-select');
            formControls.forEach(control => {
                control.classList.remove('is-valid', 'is-invalid');
            });
        }
    } catch (error) {
        console.error('Error resetting form:', error);
    }
}

// Show delete confirmation
function showDeleteConfirm(itemId) {
    try {
        const inventory = getInventoryFromStorage();
        const item = inventory.find(item => item.id === itemId);
        
        if (!item) {
            showAlert('Item not found!', 'danger');
            return;
        }
        
        document.getElementById('deleteItemId').value = itemId;
        
        const modalElement = document.getElementById('deleteConfirmModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    } catch (error) {
        console.error('Error showing delete confirmation:', error);
    }
}

// Confirm delete
function confirmDelete() {
    try {
        const itemId = document.getElementById('deleteItemId').value;
        const inventory = getInventoryFromStorage();
        const item = inventory.find(item => item.id === itemId);
        
        if (!item) {
            showAlert('Item not found!', 'danger');
            return;
        }
        
        const success = deleteInventoryItem(itemId);
        
        if (success) {
            // Close modal
            const modalElement = document.getElementById('deleteConfirmModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
            
            // Reload data
            loadInventory();
            loadInventoryStats();
            loadStockAlerts();
            loadCategories();
            
            showAlert(`Item "${item.name}" deleted successfully!`, 'success');
        } else {
            showAlert('Error deleting item!', 'danger');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showAlert('Error deleting item: ' + error.message, 'danger');
    }
}

// Update stock
function updateStock(itemId, action) {
    try {
        const inventory = getInventoryFromStorage();
        const item = inventory.find(item => item.id === itemId);
        
        if (!item) {
            showAlert('Item not found!', 'danger');
            return;
        }
        
        const currentStock = parseFloat(item.stock);
        const amount = prompt(`Enter amount to ${action} (in ${item.unit}):`, '1');
        
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            showAlert('Please enter a valid amount!', 'warning');
            return;
        }
        
        const quantity = parseFloat(amount);
        
        if (action === 'remove' && quantity > currentStock) {
            showAlert(`Cannot remove more than available stock (${currentStock} ${item.unit})!`, 'danger');
            return;
        }
        
        // Update stock
        if (action === 'add') {
            item.stock = currentStock + quantity;
        } else {
            item.stock = currentStock - quantity;
        }
        
        item.lastUpdated = new Date().toISOString();
        
        // Save updated item
        const success = saveInventoryItemToStorage(item);
        
        if (success) {
            loadInventory();
            loadInventoryStats();
            loadStockAlerts();
            
            showAlert(`Stock ${action === 'add' ? 'added to' : 'removed from'} "${item.name}"`, 'success');
        } else {
            showAlert('Error updating stock!', 'danger');
        }
    } catch (error) {
        console.error('Error updating stock:', error);
        showAlert('Error updating stock: ' + error.message, 'danger');
    }
}

// Restock item
function restockItem(itemId) {
    try {
        const inventory = getInventoryFromStorage();
        const item = inventory.find(item => item.id === itemId);
        
        if (!item) {
            showAlert('Item not found!', 'danger');
            return;
        }
        
        const amount = prompt(`Enter restock amount for "${item.name}" (in ${item.unit}):`, '10');
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            showAlert('Please enter a valid amount!', 'warning');
            return;
        }
        
        item.stock = parseFloat(amount);
        item.lastUpdated = new Date().toISOString();
        
        const success = saveInventoryItemToStorage(item);
        
        if (success) {
            loadInventory();
            loadInventoryStats();
            loadStockAlerts();
            
            showAlert(`"${item.name}" restocked to ${item.stock} ${item.unit}`, 'success');
        } else {
            showAlert('Error restocking item!', 'danger');
        }
    } catch (error) {
        console.error('Error restocking item:', error);
        showAlert('Error restocking item: ' + error.message, 'danger');
    }
}

// Export inventory
function exportInventory() {
    try {
        const inventory = getInventoryFromStorage();
        if (inventory.length === 0) {
            showAlert('No inventory data to export!', 'warning');
            return;
        }
        
        const csvContent = convertToCSV(inventory);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('Inventory exported to CSV!', 'success');
    } catch (error) {
        console.error('Error exporting inventory:', error);
        showAlert('Error exporting inventory: ' + error.message, 'danger');
    }
}

// Convert inventory to CSV
function convertToCSV(data) {
    try {
        const headers = ['ID', 'Name', 'Category', 'Type', 'Stock', 'Unit', 'Cost Price', 'Selling Price', 'Reorder Level', 'Supplier', 'Last Updated'];
        const rows = data.map(item => [
            item.id,
            `"${item.name}"`,
            `"${item.category}"`,
            `"${item.type}"`,
            item.stock,
            `"${item.unit}"`,
            item.costPrice,
            item.sellingPrice,
            item.reorderLevel || '',
            `"${item.supplier || ''}"`,
            new Date(item.lastUpdated).toLocaleDateString()
        ]);
        
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    } catch (error) {
        console.error('Error converting to CSV:', error);
        return 'Error generating CSV';
    }
}

// Print inventory
function printInventory() {
    try {
        const printContent = document.querySelector('.card')?.outerHTML;
        if (!printContent) {
            showAlert('No inventory data to print!', 'warning');
            return;
        }
        
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <html>
            <head>
                <title>Inventory Report - Billing System Pro</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .badge { padding: 2px 6px; border-radius: 4px; font-size: 12px; }
                    @media print { 
                        @page { margin: 0.5in; }
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <h2>Inventory Report</h2>
                <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Total Items:</strong> ${currentInventory.length}</p>
                ${printContent}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        
    } catch (error) {
        console.error('Error printing inventory:', error);
        showAlert('Error printing inventory: ' + error.message, 'danger');
    }
}

// Show alert
function showAlert(message, type) {
    try {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => {
            if (alert.parentNode) alert.remove();
        });
        
        const icons = {
            success: 'check-circle',
            danger: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
        alertDiv.innerHTML = `
            <i class="fas fa-${icons[type] || 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const container = document.querySelector('.container');
        if (container) {
            container.parentNode.insertBefore(alertDiv, container);
        }
        
        // Auto-remove after 5 seconds
        if (type !== 'danger') {
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    } catch (error) {
        console.error('Error showing alert:', error);
    }
}

// Initialize categories on load
loadCategories();