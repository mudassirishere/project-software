// Professional Billing System Pro - Storage Management
// Complete Fixed Version with All Required Functions

// ==================== INITIALIZATION ====================

// Initialize storage
function initStorage() {
    try {
        // Initialize bills
        if (!localStorage.getItem('bills')) {
            localStorage.setItem('bills', JSON.stringify([]));
        }
        
        // Initialize inventory with sample data if empty
        if (!localStorage.getItem('inventory')) {
            const sampleInventory = [
                {
                    id: 'item_1',
                    name: 'Steel Rivets',
                    category: 'Hardware',
                    type: 'finished',
                    unit: 'kg',
                    stock: 100,
                    costPrice: 200,
                    sellingPrice: 250,
                    reorderLevel: 10,
                    supplier: 'Metal Works Ltd',
                    supplierContact: '0321-1234567',
                    description: 'High-quality steel rivets',
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                },
                {
                    id: 'item_2',
                    name: 'Copper Sheets',
                    category: 'Raw Material',
                    type: 'raw',
                    unit: 'kg',
                    stock: 50,
                    costPrice: 500,
                    sellingPrice: 600,
                    reorderLevel: 5,
                    supplier: 'Copper Corp',
                    description: 'Pure copper sheets',
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                }
            ];
            localStorage.setItem('inventory', JSON.stringify(sampleInventory));
        }
        
        // Initialize customers
        if (!localStorage.getItem('customers')) {
            localStorage.setItem('customers', JSON.stringify([]));
        }
        
        // Initialize settings
        if (!localStorage.getItem('settings')) {
            localStorage.setItem('settings', JSON.stringify({
                companyName: 'Professional Billing System Pro',
                companyAddress: 'Gali No.2, Heera Nand Khem Singh Road, Garden, Karachi',
                currency: 'Rs.',
                taxRate: 0,
                printHeader: true,
                invoicePrefix: 'BIL',
                defaultPaymentMethod: 'Cash',
                createdAt: new Date().toISOString()
            }));
        }
        
        // Initialize last bill number
        if (!localStorage.getItem('lastBillNo')) {
            localStorage.setItem('lastBillNo', '1000');
        }
        
        console.log('Storage initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing storage:', error);
        return false;
    }
}

// ==================== BILLS MANAGEMENT ====================

// Get all bills from storage
function getBillsFromStorage() {
    try {
        initStorage();
        const bills = localStorage.getItem('bills');
        return bills ? JSON.parse(bills) : [];
    } catch (error) {
        console.error('Error getting bills from storage:', error);
        return [];
    }
}

// Save bill to storage
function saveBillToStorage(billData) {
    try {
        const bills = getBillsFromStorage();
        
        // Ensure bill has required fields
        if (!billData.id) {
            billData.id = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        if (!billData.timestamp) {
            billData.timestamp = new Date().toISOString();
        }
        
        // Add status based on balance
        if (billData.balance === undefined) {
            billData.balance = 0;
        }
        billData.status = parseFloat(billData.balance) > 0 ? 'pending' : 'paid';
        
        // Add to bills array
        bills.push(billData);
        
        // Save to localStorage
        localStorage.setItem('bills', JSON.stringify(bills));
        
        // Update last bill number
        if (billData.billNo) {
            const billNoMatch = billData.billNo.match(/\d+/);
            if (billNoMatch && billNoMatch[0]) {
                localStorage.setItem('lastBillNo', billNoMatch[0]);
            }
        }
        
        // Update customer data
        updateCustomerData(billData.customerName, parseFloat(billData.balance || 0));
        
        console.log('Bill saved successfully:', billData.id);
        return true;
    } catch (error) {
        console.error('Error saving bill:', error);
        return false;
    }
}

// Update existing bill
function updateBillInStorage(billData) {
    try {
        const bills = getBillsFromStorage();
        const billIndex = bills.findIndex(bill => bill.id === billData.id);
        
        if (billIndex === -1) {
            console.error('Bill not found for update:', billData.id);
            return false;
        }
        
        // Update bill data
        bills[billIndex] = {
            ...bills[billIndex],
            ...billData,
            lastUpdated: new Date().toISOString()
        };
        
        // Save updated bills
        localStorage.setItem('bills', JSON.stringify(bills));
        
        // Update customer data
        updateCustomerData(billData.customerName, parseFloat(billData.balance || 0));
        
        console.log('Bill updated successfully:', billData.id);
        return true;
    } catch (error) {
        console.error('Error updating bill:', error);
        return false;
    }
}

// Delete bill from storage
function deleteBillFromStorage(billId) {
    try {
        const bills = getBillsFromStorage();
        const initialLength = bills.length;
        
        const updatedBills = bills.filter(bill => bill.id !== billId);
        
        if (updatedBills.length === initialLength) {
            console.error('Bill not found for deletion:', billId);
            return false;
        }
        
        localStorage.setItem('bills', JSON.stringify(updatedBills));
        console.log('Bill deleted successfully:', billId);
        return true;
    } catch (error) {
        console.error('Error deleting bill:', error);
        return false;
    }
}

// Delete multiple bills
function deleteBillsFromStorage(billIds) {
    try {
        const bills = getBillsFromStorage();
        const initialLength = bills.length;
        
        const updatedBills = bills.filter(bill => !billIds.includes(bill.id));
        
        if (updatedBills.length === initialLength) {
            console.error('No bills found for deletion');
            return false;
        }
        
        localStorage.setItem('bills', JSON.stringify(updatedBills));
        console.log('Bills deleted successfully:', billIds.length);
        return true;
    } catch (error) {
        console.error('Error deleting bills:', error);
        return false;
    }
}

// Get bill by ID
function getBillById(billId) {
    try {
        const bills = getBillsFromStorage();
        return bills.find(bill => bill.id === billId) || null;
    } catch (error) {
        console.error('Error getting bill by ID:', error);
        return null;
    }
}

// Get bills by customer
function getBillsByCustomer(customerName) {
    try {
        const bills = getBillsFromStorage();
        return bills.filter(bill => 
            bill.customerName && bill.customerName.toLowerCase() === customerName.toLowerCase()
        );
    } catch (error) {
        console.error('Error getting bills by customer:', error);
        return [];
    }
}

// Get bills by date range
function getBillsByDateRange(startDate, endDate) {
    try {
        const bills = getBillsFromStorage();
        return bills.filter(bill => {
            const billDate = bill.date || bill.timestamp?.split('T')[0];
            return billDate >= startDate && billDate <= endDate;
        });
    } catch (error) {
        console.error('Error getting bills by date range:', error);
        return [];
    }
}

// ==================== INVENTORY MANAGEMENT ====================

// Get inventory from storage
function getInventoryFromStorage() {
    try {
        initStorage();
        const inventory = localStorage.getItem('inventory');
        return inventory ? JSON.parse(inventory) : [];
    } catch (error) {
        console.error('Error getting inventory from storage:', error);
        return [];
    }
}

// Save inventory item
function saveInventoryItem(itemData) {
    try {
        const inventory = getInventoryFromStorage();
        
        // Generate ID if new item
        if (!itemData.id) {
            itemData.id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

// Delete inventory item
function deleteInventoryItem(itemId) {
    try {
        const inventory = getInventoryFromStorage();
        const initialLength = inventory.length;
        
        const updatedInventory = inventory.filter(item => item.id !== itemId);
        
        if (updatedInventory.length === initialLength) {
            console.error('Item not found for deletion:', itemId);
            return false;
        }
        
        localStorage.setItem('inventory', JSON.stringify(updatedInventory));
        console.log('Inventory item deleted:', itemId);
        return true;
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        return false;
    }
}

// Update inventory stock
function updateInventoryStock(productId, quantity) {
    try {
        const inventory = getInventoryFromStorage();
        const itemIndex = inventory.findIndex(item => item.id === productId);
        
        if (itemIndex === -1) {
            console.error('Product not found:', productId);
            return false;
        }
        
        // Update stock (ensure it doesn't go negative)
        const newStock = Math.max(0, inventory[itemIndex].stock - quantity);
        inventory[itemIndex].stock = newStock;
        inventory[itemIndex].lastUpdated = new Date().toISOString();
        
        localStorage.setItem('inventory', JSON.stringify(inventory));
        console.log(`Stock updated for ${productId}: -${quantity} units`);
        return true;
    } catch (error) {
        console.error('Error updating inventory stock:', error);
        return false;
    }
}

// Get inventory item by ID
function getInventoryItemById(itemId) {
    try {
        const inventory = getInventoryFromStorage();
        return inventory.find(item => item.id === itemId) || null;
    } catch (error) {
        console.error('Error getting inventory item:', error);
        return null;
    }
}

// Get low stock items
function getLowStockItems(threshold = 10) {
    try {
        const inventory = getInventoryFromStorage();
        return inventory.filter(item => {
            const reorderLevel = item.reorderLevel || threshold;
            return item.stock > 0 && item.stock <= reorderLevel;
        });
    } catch (error) {
        console.error('Error getting low stock items:', error);
        return [];
    }
}

// Get finished goods
function getFinishedGoods() {
    try {
        const inventory = getInventoryFromStorage();
        return inventory.filter(item => item.type === 'finished');
    } catch (error) {
        console.error('Error getting finished goods:', error);
        return [];
    }
}

// Get raw materials
function getRawMaterials() {
    try {
        const inventory = getInventoryFromStorage();
        return inventory.filter(item => item.type === 'raw');
    } catch (error) {
        console.error('Error getting raw materials:', error);
        return [];
    }
}

// Get out of stock items
function getOutOfStockItems() {
    try {
        const inventory = getInventoryFromStorage();
        return inventory.filter(item => item.stock === 0);
    } catch (error) {
        console.error('Error getting out of stock items:', error);
        return [];
    }
}

// Search inventory items
function searchInventoryItems(searchTerm) {
    try {
        const inventory = getInventoryFromStorage();
        const term = searchTerm.toLowerCase();
        
        return inventory.filter(item => 
            item.name.toLowerCase().includes(term) || 
            item.category.toLowerCase().includes(term) ||
            (item.description && item.description.toLowerCase().includes(term))
        );
    } catch (error) {
        console.error('Error searching inventory:', error);
        return [];
    }
}

// ==================== CUSTOMERS MANAGEMENT ====================

// Get all customers
function getCustomersFromStorage() {
    try {
        initStorage();
        const customers = localStorage.getItem('customers');
        return customers ? JSON.parse(customers) : [];
    } catch (error) {
        console.error('Error getting customers from storage:', error);
        return [];
    }
}

// Update customer data
function updateCustomerData(customerName, balance) {
    try {
        let customers = getCustomersFromStorage();
        const customerIndex = customers.findIndex(c => 
            c.name.toLowerCase() === customerName.toLowerCase()
        );
        
        const now = new Date().toISOString();
        
        if (customerIndex !== -1) {
            // Update existing customer
            customers[customerIndex].totalBalance = balance;
            customers[customerIndex].lastTransaction = now;
            customers[customerIndex].totalTransactions = (customers[customerIndex].totalTransactions || 0) + 1;
            customers[customerIndex].totalSpent = (customers[customerIndex].totalSpent || 0) + balance;
        } else {
            // Add new customer
            customers.push({
                id: `cust_${Date.now()}`,
                name: customerName,
                totalBalance: balance,
                totalSpent: balance,
                firstTransaction: now,
                lastTransaction: now,
                totalTransactions: 1,
                createdAt: now
            });
        }
        
        localStorage.setItem('customers', JSON.stringify(customers));
        return true;
    } catch (error) {
        console.error('Error updating customer:', error);
        return false;
    }
}

// Get customer by name
function getCustomerData(customerName) {
    try {
        const customers = getCustomersFromStorage();
        return customers.find(c => 
            c.name.toLowerCase() === customerName.toLowerCase()
        ) || null;
    } catch (error) {
        console.error('Error getting customer data:', error);
        return null;
    }
}

// Get top customers
function getTopCustomers(limit = 10) {
    try {
        const customers = getCustomersFromStorage();
        return customers
            .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
            .slice(0, limit);
    } catch (error) {
        console.error('Error getting top customers:', error);
        return [];
    }
}

// ==================== ANALYTICS & REPORTS ====================

// Get monthly revenue data
function getMonthlyRevenue(year) {
    try {
        const bills = getBillsFromStorage();
        const monthlyData = new Array(12).fill(0);
        
        bills.forEach(bill => {
            if (bill.date) {
                const billDate = new Date(bill.date);
                const billYear = billDate.getFullYear();
                if (billYear === year) {
                    const month = billDate.getMonth();
                    monthlyData[month] += parseFloat(bill.amount || bill.netAmount || 0);
                }
            }
        });
        
        return monthlyData;
    } catch (error) {
        console.error('Error getting monthly revenue:', error);
        return new Array(12).fill(0);
    }
}

// Get yearly revenue data
function getYearlyRevenue(startYear, endYear) {
    try {
        const bills = getBillsFromStorage();
        const yearlyData = {};
        
        // Initialize years
        for (let year = startYear; year <= endYear; year++) {
            yearlyData[year] = 0;
        }
        
        bills.forEach(bill => {
            if (bill.date) {
                const billYear = new Date(bill.date).getFullYear();
                if (billYear >= startYear && billYear <= endYear) {
                    yearlyData[billYear] += parseFloat(bill.amount || bill.netAmount || 0);
                }
            }
        });
        
        return yearlyData;
    } catch (error) {
        console.error('Error getting yearly revenue:', error);
        const result = {};
        for (let year = startYear; year <= endYear; year++) {
            result[year] = 0;
        }
        return result;
    }
}

// Get sales by category
function getSalesByCategory() {
    try {
        const bills = getBillsFromStorage();
        const inventory = getInventoryFromStorage();
        const categorySales = {};
        
        bills.forEach(bill => {
            if (bill.productId) {
                const product = inventory.find(item => item.id === bill.productId);
                if (product && product.category) {
                    const amount = parseFloat(bill.amount || bill.netAmount || 0);
                    categorySales[product.category] = (categorySales[product.category] || 0) + amount;
                }
            }
        });
        
        // If no category data, use default categories
        if (Object.keys(categorySales).length === 0) {
            const totalRevenue = bills.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0);
            if (totalRevenue > 0) {
                categorySales['General'] = totalRevenue;
            }
        }
        
        return categorySales;
    } catch (error) {
        console.error('Error getting sales by category:', error);
        return { 'General': 0 };
    }
}

// Get top selling products
function getTopSellingProducts(limit = 5) {
    try {
        const bills = getBillsFromStorage();
        const inventory = getInventoryFromStorage();
        const productSales = {};
        
        bills.forEach(bill => {
            if (bill.productId) {
                const product = inventory.find(item => item.id === bill.productId);
                if (product) {
                    const amount = parseFloat(bill.amount || bill.netAmount || 0);
                    productSales[product.id] = {
                        id: product.id,
                        name: product.name,
                        category: product.category,
                        sales: (productSales[product.id]?.sales || 0) + amount,
                        quantity: (productSales[product.id]?.quantity || 0) + parseFloat(bill.weight || 1)
                    };
                }
            }
        });
        
        // Convert to array and sort
        const sortedProducts = Object.values(productSales)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, limit);
        
        return sortedProducts;
    } catch (error) {
        console.error('Error getting top selling products:', error);
        return [];
    }
}

// Get statistics
function getStatistics() {
    try {
        const bills = getBillsFromStorage();
        const inventory = getInventoryFromStorage();
        const customers = getCustomersFromStorage();
        
        const today = new Date().toISOString().split('T')[0];
        const todayBills = bills.filter(bill => bill.date === today);
        
        // Calculate totals
        const totalRevenue = bills.reduce((sum, bill) => sum + parseFloat(bill.amount || bill.netAmount || 0), 0);
        const totalReceived = bills.reduce((sum, bill) => sum + parseFloat(bill.receivedAmount || 0), 0);
        const totalBalance = bills.reduce((sum, bill) => sum + parseFloat(bill.balance || 0), 0);
        
        const stats = {
            // Bill stats
            totalBills: bills.length,
            totalRevenue: totalRevenue,
            totalReceived: totalReceived,
            totalBalance: totalBalance,
            todayBills: todayBills.length,
            todayRevenue: todayBills.reduce((sum, bill) => sum + parseFloat(bill.amount || bill.netAmount || 0), 0),
            averageBill: bills.length > 0 ? totalRevenue / bills.length : 0,
            
            // Customer stats
            totalCustomers: customers.length,
            activeCustomers: customers.filter(c => c.totalBalance > 0).length,
            topCustomer: customers.length > 0 ? 
                customers.reduce((max, c) => (c.totalSpent || 0) > (max.totalSpent || 0) ? c : max, customers[0]).name : 'None',
            
            // Inventory stats
            totalProducts: inventory.length,
            lowStockItems: getLowStockItems().length,
            outOfStockItems: getOutOfStockItems().length,
            inventoryValue: inventory.reduce((sum, item) => sum + (item.stock * parseFloat(item.costPrice || 0)), 0),
            
            // Payment stats
            cashPayments: bills.filter(bill => bill.paymentMethod === 'Cash').length,
            chequePayments: bills.filter(bill => bill.paymentMethod === 'Cheque').length,
            onlinePayments: bills.filter(bill => bill.paymentMethod === 'Online').length,
            cardPayments: bills.filter(bill => bill.paymentMethod === 'Card').length,
            
            // Dates
            firstBillDate: bills.length > 0 ? 
                bills.reduce((min, b) => b.date < min.date ? b : min, bills[0]).date : 'N/A',
            lastBillDate: bills.length > 0 ? 
                bills.reduce((max, b) => b.date > max.date ? b : max, bills[0]).date : 'N/A'
        };
        
        return stats;
    } catch (error) {
        console.error('Error getting statistics:', error);
        return {
            totalBills: 0,
            totalRevenue: 0,
            totalBalance: 0,
            todayBills: 0,
            todayRevenue: 0,
            totalCustomers: 0,
            totalProducts: 0,
            lowStockItems: 0,
            outOfStockItems: 0
        };
    }
}

// Get all years with bills
function getAllYearsFromBills() {
    try {
        const bills = getBillsFromStorage();
        const years = new Set();
        
        bills.forEach(bill => {
            if (bill.date) {
                const year = new Date(bill.date).getFullYear();
                if (!isNaN(year)) {
                    years.add(year);
                }
            }
        });
        
        // Add current year if no bills
        if (years.size === 0) {
            years.add(new Date().getFullYear());
        }
        
        return Array.from(years).sort((a, b) => a - b);
    } catch (error) {
        console.error('Error getting years from bills:', error);
        return [new Date().getFullYear()];
    }
}

// Search bills with filters
function searchBills(searchParams) {
    try {
        const bills = getBillsFromStorage();
        
        return bills.filter(bill => {
            // Search by customer name
            if (searchParams.customerName && 
                !bill.customerName.toLowerCase().includes(searchParams.customerName.toLowerCase())) {
                return false;
            }
            
            // Search by bill number
            if (searchParams.billNo && 
                !bill.billNo.toLowerCase().includes(searchParams.billNo.toLowerCase())) {
                return false;
            }
            
            // Search by date range
            if (searchParams.startDate && bill.date < searchParams.startDate) {
                return false;
            }
            if (searchParams.endDate && bill.date > searchParams.endDate) {
                return false;
            }
            
            // Search by amount range
            const billAmount = parseFloat(bill.amount || bill.netAmount || 0);
            if (searchParams.minAmount && billAmount < parseFloat(searchParams.minAmount)) {
                return false;
            }
            if (searchParams.maxAmount && billAmount > parseFloat(searchParams.maxAmount)) {
                return false;
            }
            
            // Search by payment method
            if (searchParams.paymentMethod && bill.paymentMethod !== searchParams.paymentMethod) {
                return false;
            }
            
            // Search by status
            if (searchParams.status) {
                const balance = parseFloat(bill.balance || 0);
                if (searchParams.status === 'paid' && balance > 0) return false;
                if (searchParams.status === 'pending' && balance <= 0) return false;
            }
            
            return true;
        });
    } catch (error) {
        console.error('Error searching bills:', error);
        return [];
    }
}

// ==================== BACKUP & RESTORE ====================

// Backup all data
function backupData() {
    try {
        const data = {
            bills: getBillsFromStorage(),
            inventory: getInventoryFromStorage(),
            customers: getCustomersFromStorage(),
            settings: JSON.parse(localStorage.getItem('settings') || '{}'),
            backupDate: new Date().toISOString(),
            system: 'Professional Billing System Pro',
            version: '1.0',
            totalRecords: {
                bills: getBillsFromStorage().length,
                inventory: getInventoryFromStorage().length,
                customers: getCustomersFromStorage().length
            }
        };
        
        return JSON.stringify(data, null, 2);
    } catch (error) {
        console.error('Error creating backup:', error);
        return '{}';
    }
}

// Restore data from backup
function restoreData(backupData) {
    try {
        const data = JSON.parse(backupData);
        
        // Validate backup data
        if (!data.bills || !data.inventory || !data.customers) {
            throw new Error('Invalid backup data format');
        }
        
        // Save data with confirmation
        if (confirm('This will replace ALL current data. Continue?')) {
            localStorage.setItem('bills', JSON.stringify(data.bills || []));
            localStorage.setItem('inventory', JSON.stringify(data.inventory || []));
            localStorage.setItem('customers', JSON.stringify(data.customers || []));
            
            if (data.settings) {
                localStorage.setItem('settings', JSON.stringify(data.settings));
            }
            
            console.log('Data restored successfully from backup');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error restoring data:', error);
        alert('Error restoring data: ' + error.message);
        return false;
    }
}

// Export data as CSV
function exportDataAsCSV(dataType) {
    try {
        let data = [];
        let filename = '';
        
        switch(dataType) {
            case 'bills':
                data = getBillsFromStorage();
                filename = `bills-export-${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'inventory':
                data = getInventoryFromStorage();
                filename = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'customers':
                data = getCustomersFromStorage();
                filename = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;
                break;
            default:
                throw new Error('Invalid data type');
        }
        
        if (data.length === 0) {
            return { success: false, message: 'No data to export' };
        }
        
        // Convert to CSV
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            }).join(','))
        ].join('\n');
        
        return { success: true, filename: filename, content: csvContent };
    } catch (error) {
        console.error('Error exporting data:', error);
        return { success: false, message: error.message };
    }
}

// Clear all data
function clearAllData() {
    try {
        if (confirm('⚠️ WARNING: This will delete ALL data including bills, inventory, and customers.\n\nThis action cannot be undone!\n\nAre you ABSOLUTELY sure?')) {
            localStorage.clear();
            initStorage();
            console.log('All data cleared successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error clearing data:', error);
        return false;
    }
}

// ==================== SETTINGS ====================

// Get settings
function getSettings() {
    try {
        initStorage();
        return JSON.parse(localStorage.getItem('settings') || '{}');
    } catch (error) {
        console.error('Error getting settings:', error);
        return {};
    }
}

// Update settings
function updateSettings(newSettings) {
    try {
        const currentSettings = getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings, lastUpdated: new Date().toISOString() };
        localStorage.setItem('settings', JSON.stringify(updatedSettings));
        return true;
    } catch (error) {
        console.error('Error updating settings:', error);
        return false;
    }
}

// ==================== UTILITIES ====================

// Get next bill number
function getNextBillNumber() {
    try {
        const lastBillNo = localStorage.getItem('lastBillNo') || '1000';
        const settings = getSettings();
        const prefix = settings.invoicePrefix || 'BIL';
        const nextNumber = String(parseInt(lastBillNo) + 1).padStart(4, '0');
        return `${prefix}${nextNumber}`;
    } catch (error) {
        console.error('Error getting next bill number:', error);
        return `BIL${Date.now().toString().slice(-4)}`;
    }
}

// Get storage usage info
function getStorageInfo() {
    try {
        const totalBytes = new Blob([localStorage.getItem('bills') || '']).size +
                          new Blob([localStorage.getItem('inventory') || '']).size +
                          new Blob([localStorage.getItem('customers') || '']).size;
        
        const totalKB = (totalBytes / 1024).toFixed(2);
        const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
        
        return {
            billsCount: getBillsFromStorage().length,
            inventoryCount: getInventoryFromStorage().length,
            customersCount: getCustomersFromStorage().length,
            totalBytes: totalBytes,
            totalKB: totalKB,
            totalMB: totalMB,
            lastBackup: localStorage.getItem('lastBackupDate') || 'Never'
        };
    } catch (error) {
        console.error('Error getting storage info:', error);
        return {
            billsCount: 0,
            inventoryCount: 0,
            customersCount: 0,
            totalBytes: 0,
            totalKB: '0.00',
            totalMB: '0.00',
            lastBackup: 'Never'
        };
    }
}

// ==================== INITIALIZE ====================

// Initialize storage on load
initStorage();

// Export all functions
window.storageAPI = {
    // Initialization
    initStorage,
    
    // Bills Management
    getBillsFromStorage,
    saveBillToStorage,
    updateBillInStorage,
    deleteBillFromStorage,
    deleteBillsFromStorage,
    getBillById,
    getBillsByCustomer,
    getBillsByDateRange,
    
    // Inventory Management
    getInventoryFromStorage,
    saveInventoryItem,
    deleteInventoryItem,
    updateInventoryStock,
    getInventoryItemById,
    getLowStockItems,
    getFinishedGoods,
    getRawMaterials,
    getOutOfStockItems,
    searchInventoryItems,
    
    // Customers Management
    getCustomersFromStorage,
    updateCustomerData,
    getCustomerData,
    getTopCustomers,
    
    // Analytics & Reports
    getMonthlyRevenue,
    getYearlyRevenue,
    getSalesByCategory,
    getTopSellingProducts,
    getStatistics,
    getAllYearsFromBills,
    searchBills,
    
    // Backup & Restore
    backupData,
    restoreData,
    exportDataAsCSV,
    clearAllData,
    
    // Settings
    getSettings,
    updateSettings,
    
    // Utilities
    getNextBillNumber,
    getStorageInfo
};

console.log('Storage Management Module Loaded Successfully');