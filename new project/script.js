// Professional Billing System Pro - Main Script
// Fixed and Optimized Version

// Global Elements
let elements = {};

// Storage Functions (Add these at the top)
function getBillsFromStorage() {
    try {
        const bills = localStorage.getItem('bills');
        return bills ? JSON.parse(bills) : [];
    } catch (error) {
        console.error('Error loading bills:', error);
        return [];
    }
}

function getInventoryFromStorage() {
    try {
        const inventory = localStorage.getItem('inventory');
        return inventory ? JSON.parse(inventory) : [
            { id: '1', name: 'Default Product', stock: 100, sellingPrice: 100 }
        ];
    } catch (error) {
        console.error('Error loading inventory:', error);
        return [{ id: '1', name: 'Default Product', stock: 100, sellingPrice: 100 }];
    }
}

function saveBillToStorage(billData) {
    try {
        const bills = getBillsFromStorage();
        bills.push(billData);
        localStorage.setItem('bills', JSON.stringify(bills));
        
        // Update last bill number
        const billNoMatch = billData.billNo.match(/\d+/);
        if (billNoMatch) {
            localStorage.setItem('lastBillNo', billNoMatch[0]);
        }
        
        return true;
    } catch (error) {
        console.error('Error saving bill:', error);
        return false;
    }
}

function updateInventoryStock(productId, weight) {
    try {
        const inventory = getInventoryFromStorage();
        const productIndex = inventory.findIndex(item => item.id === productId);
        
        if (productIndex !== -1) {
            // Assuming weight is in kg, convert to units if needed
            // Adjust this logic based on your inventory unit
            inventory[productIndex].stock = Math.max(0, inventory[productIndex].stock - weight);
            localStorage.setItem('inventory', JSON.stringify(inventory));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error updating inventory:', error);
        return false;
    }
}

// Initialize System
document.addEventListener('DOMContentLoaded', function() {
    console.log('Billing System Initializing...');
    
    // Initialize all elements
    initElements();
    
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    if (elements.billDate) elements.billDate.value = today;
    if (elements.chequeDate) elements.chequeDate.value = today;
    
    // Generate initial bill number (only if on billing page)
    if (elements.billNo) {
        generateBillNumber();
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadInitialData();
    
    // Load products for dropdown (only if on billing page)
    if (elements.productSelect) {
        loadProductsForBilling();
    }
    
    console.log('Billing System Initialized');
});

// Initialize all form elements
function initElements() {
    const ids = [
        'billBookNo', 'billNo', 'billDate', 'customerName',
        'productSelect', 'weight', 'rate', 'amount', 'discount',
        'netAmount', 'previousBalance', 'totalPayable',
        'receivedAmount', 'paymentMethod', 'chequeName',
        'chequeDate', 'chequeNo', 'balance', 'remarks',
        'calculateBtn', 'saveBillBtn', 'savePrintBtn', 'resetBtn',
        'recentActivityBody' // Fixed ID (was recentActivity)
    ];
    
    ids.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            elements[id] = element;
        }
    });
    
    console.log('Elements initialized:', Object.keys(elements).length);
}

// Generate unique bill number
function generateBillNumber() {
    if (!elements.billNo) return;
    
    try {
        const lastBillNo = localStorage.getItem('lastBillNo') || '1000';
        const newBillNo = String(parseInt(lastBillNo) + 1).padStart(4, '0');
        elements.billNo.value = `BIL${newBillNo}`;
        console.log('Generated bill number:', elements.billNo.value);
    } catch (error) {
        console.error('Error generating bill number:', error);
        elements.billNo.value = `BIL${Date.now().toString().slice(-4)}`;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Auto-calculations (only if elements exist)
    if (elements.weight) elements.weight.addEventListener('input', calculateAmount);
    if (elements.rate) elements.rate.addEventListener('input', calculateAmount);
    if (elements.discount) elements.discount.addEventListener('input', calculateNetAmount);
    if (elements.receivedAmount) elements.receivedAmount.addEventListener('input', calculateBalance);
    
    // Customer name change - fetch previous balance
    if (elements.customerName) {
        elements.customerName.addEventListener('blur', function() {
            if (this.value.trim()) {
                fetchPreviousBalance(this.value);
            }
        });
    }
    
    // Payment method change
    if (elements.paymentMethod) {
        elements.paymentMethod.addEventListener('change', toggleChequeFields);
        // Initial toggle
        toggleChequeFields();
    }
    
    // Product selection change
    if (elements.productSelect) {
        elements.productSelect.addEventListener('change', loadProductDetails);
    }
    
    // Button events (check if buttons exist)
    if (elements.calculateBtn) {
        elements.calculateBtn.addEventListener('click', function() {
            calculateAll();
            showAlert('All calculations completed!', 'success');
        });
    }
    
    if (elements.saveBillBtn) elements.saveBillBtn.addEventListener('click', saveBill);
    if (elements.savePrintBtn) elements.savePrintBtn.addEventListener('click', saveAndPrint);
    if (elements.resetBtn) elements.resetBtn.addEventListener('click', resetForm);
}

// Calculate Amount = Weight × Rate
function calculateAmount() {
    if (!elements.weight || !elements.rate || !elements.amount) return;
    
    try {
        const weight = parseFloat(elements.weight.value) || 0;
        const rate = parseFloat(elements.rate.value) || 0;
        const amount = weight * rate;
        elements.amount.value = amount.toFixed(2);
        calculateNetAmount();
        highlightField(elements.amount);
    } catch (error) {
        console.error('Error calculating amount:', error);
        elements.amount.value = '0.00';
    }
}

// Calculate Net Amount = Amount - Discount
function calculateNetAmount() {
    if (!elements.amount || !elements.discount || !elements.netAmount) return;
    
    try {
        const amount = parseFloat(elements.amount.value) || 0;
        const discount = parseFloat(elements.discount.value) || 0;
        const netAmount = amount - discount;
        elements.netAmount.value = netAmount.toFixed(2);
        calculateTotalPayable();
        highlightField(elements.netAmount);
    } catch (error) {
        console.error('Error calculating net amount:', error);
        elements.netAmount.value = '0.00';
    }
}

// Calculate Total Payable = Net Amount + Previous Balance
function calculateTotalPayable() {
    if (!elements.netAmount || !elements.previousBalance || !elements.totalPayable) return;
    
    try {
        const netAmount = parseFloat(elements.netAmount.value) || 0;
        const prevBalance = parseFloat(elements.previousBalance.value) || 0;
        const total = netAmount + prevBalance;
        elements.totalPayable.value = total.toFixed(2);
        calculateBalance();
        highlightField(elements.totalPayable);
    } catch (error) {
        console.error('Error calculating total payable:', error);
        elements.totalPayable.value = '0.00';
    }
}

// Calculate Balance = Total Payable - Received Amount
function calculateBalance() {
    if (!elements.totalPayable || !elements.receivedAmount || !elements.balance) return;
    
    try {
        const totalPayable = parseFloat(elements.totalPayable.value) || 0;
        const received = parseFloat(elements.receivedAmount.value) || 0;
        let balance = totalPayable - received;
        
        // Validate received amount
        if (balance < 0) {
            showAlert('Received amount cannot exceed total payable!', 'warning');
            elements.receivedAmount.value = totalPayable.toFixed(2);
            balance = 0;
        }
        
        elements.balance.value = balance.toFixed(2);
        highlightField(elements.balance);
    } catch (error) {
        console.error('Error calculating balance:', error);
        elements.balance.value = '0.00';
    }
}

// Calculate all fields
function calculateAll() {
    calculateAmount();
    calculateNetAmount();
    calculateTotalPayable();
    calculateBalance();
}

// Fetch previous balance for customer
function fetchPreviousBalance(customerName) {
    if (!elements.previousBalance) return;
    
    try {
        const bills = getBillsFromStorage();
        const customerBills = bills.filter(bill => 
            bill.customerName.toLowerCase() === customerName.toLowerCase() && 
            parseFloat(bill.balance) > 0
        );
        
        if (customerBills.length > 0) {
            const totalBalance = customerBills.reduce((sum, bill) => 
                sum + parseFloat(bill.balance), 0
            );
            elements.previousBalance.value = totalBalance.toFixed(2);
            showAlert(`Previous balance found: Rs. ${totalBalance.toFixed(2)}`, 'info');
        } else {
            elements.previousBalance.value = '0.00';
        }
        calculateTotalPayable();
    } catch (error) {
        console.error('Error fetching previous balance:', error);
        elements.previousBalance.value = '0.00';
    }
}

// Toggle cheque fields based on payment method
function toggleChequeFields() {
    if (!elements.paymentMethod || !elements.chequeName || !elements.chequeDate || !elements.chequeNo) return;
    
    const method = elements.paymentMethod.value;
    const isCheque = method === 'Cheque';
    
    // Enable/disable cheque fields
    elements.chequeName.disabled = !isCheque;
    elements.chequeDate.disabled = !isCheque;
    elements.chequeNo.disabled = !isCheque;
    
    // Set required attribute
    elements.chequeName.required = isCheque;
    elements.chequeDate.required = isCheque;
    elements.chequeNo.required = isCheque;
    
    // Clear fields if not cheque
    if (!isCheque) {
        elements.chequeName.value = '';
        elements.chequeDate.value = '';
        elements.chequeNo.value = '';
    }
    
    // Update cheque date to today if enabled
    if (isCheque && elements.chequeDate) {
        elements.chequeDate.value = new Date().toISOString().split('T')[0];
    }
}

// Load product details when selected
function loadProductDetails() {
    if (!elements.productSelect || !elements.rate) return;
    
    const productId = elements.productSelect.value;
    if (!productId) return;
    
    try {
        const inventory = getInventoryFromStorage();
        const product = inventory.find(item => item.id === productId);
        
        if (product) {
            elements.rate.value = parseFloat(product.sellingPrice).toFixed(2);
            calculateAmount();
            
            // Show stock info
            showAlert(`${product.name} selected. Stock: ${product.stock} units`, 'info');
        }
    } catch (error) {
        console.error('Error loading product details:', error);
    }
}

// Load products for billing dropdown
function loadProductsForBilling() {
    if (!elements.productSelect) return;
    
    try {
        const inventory = getInventoryFromStorage();
        const select = elements.productSelect;
        
        // Clear existing options except first
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add inventory items
        inventory.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} - Rs. ${parseFloat(item.sellingPrice).toFixed(2)} (Stock: ${item.stock})`;
            select.appendChild(option);
        });
        
        // Load customer list for datalist
        loadCustomerList();
        
        console.log('Loaded products for billing:', inventory.length);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load customer list for autocomplete
function loadCustomerList() {
    try {
        const bills = getBillsFromStorage();
        const customers = [...new Set(bills.map(bill => bill.customerName).filter(name => name.trim()))];
        const datalist = document.getElementById('customerList');
        
        if (!datalist) return;
        
        datalist.innerHTML = '';
        customers.forEach(customer => {
            if (customer.trim()) {
                const option = document.createElement('option');
                option.value = customer;
                datalist.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error loading customer list:', error);
    }
}

// Validate form
function validateForm() {
    if (!elements.billBookNo || !elements.customerName) return false;
    
    let isValid = true;
    let errors = [];
    
    // Required fields
    const requiredFields = [
        { element: elements.billBookNo, name: 'Bill Book No' },
        { element: elements.customerName, name: 'Customer Name' },
        { element: elements.weight, name: 'Weight' },
        { element: elements.rate, name: 'Rate' },
        { element: elements.receivedAmount, name: 'Received Amount' },
        { element: elements.paymentMethod, name: 'Payment Method' }
    ];
    
    requiredFields.forEach(field => {
        if (field.element && !field.element.value.trim()) {
            field.element.classList.add('is-invalid');
            errors.push(`${field.name} is required`);
            isValid = false;
        } else if (field.element) {
            field.element.classList.remove('is-invalid');
            field.element.classList.add('is-valid');
        }
    });
    
    // Numeric validation
    const numericFields = ['weight', 'rate', 'receivedAmount'];
    numericFields.forEach(field => {
        const element = elements[field];
        if (element) {
            const value = parseFloat(element.value);
            if (isNaN(value) || value < 0) {
                element.classList.add('is-invalid');
                errors.push(`${field} must be a positive number`);
                isValid = false;
            }
        }
    });
    
    // Cheque validation
    if (elements.paymentMethod && elements.paymentMethod.value === 'Cheque') {
        const chequeFields = ['chequeName', 'chequeDate', 'chequeNo'];
        chequeFields.forEach(field => {
            const element = elements[field];
            if (element && !element.value.trim()) {
                element.classList.add('is-invalid');
                errors.push(`${field.replace('cheque', 'Cheque ')} is required for cheque payment`);
                isValid = false;
            }
        });
    }
    
    // Show errors if any
    if (errors.length > 0) {
        showAlert('Please fix the following errors:<br>' + errors.join('<br>'), 'danger');
    }
    
    return isValid;
}

// Save bill to storage
function saveBill() {
    if (!validateForm()) return;
    
    try {
        const billData = {
            id: `bill_${Date.now()}`,
            billBookNo: elements.billBookNo.value,
            billNo: elements.billNo.value,
            date: elements.billDate.value,
            customerName: elements.customerName.value,
            productId: elements.productSelect ? elements.productSelect.value : '',
            weight: parseFloat(elements.weight.value),
            rate: parseFloat(elements.rate.value),
            amount: parseFloat(elements.amount.value),
            discount: parseFloat(elements.discount.value) || 0,
            netAmount: parseFloat(elements.netAmount.value),
            previousBalance: parseFloat(elements.previousBalance.value) || 0,
            totalPayable: parseFloat(elements.totalPayable.value),
            receivedAmount: parseFloat(elements.receivedAmount.value),
            balance: parseFloat(elements.balance.value),
            paymentMethod: elements.paymentMethod.value,
            chequeName: elements.chequeName ? elements.chequeName.value : '',
            chequeDate: elements.chequeDate ? elements.chequeDate.value : '',
            chequeNo: elements.chequeNo ? elements.chequeNo.value : '',
            remarks: elements.remarks ? elements.remarks.value : '',
            timestamp: new Date().toISOString(),
            status: parseFloat(elements.balance.value) > 0 ? 'pending' : 'paid'
        };
        
        // Update inventory stock if product selected
        if (billData.productId) {
            updateInventoryStock(billData.productId, billData.weight);
        }
        
        // Save to storage
        const success = saveBillToStorage(billData);
        
        if (success) {
            showAlert(`Bill ${billData.billNo} saved successfully!`, 'success');
            
            // Update dashboard if functions exist
            if (typeof loadDashboardStats === 'function') loadDashboardStats();
            if (typeof loadRecentActivity === 'function') loadRecentActivity();
            if (typeof updateQuickStatsChart === 'function') updateQuickStatsChart();
            
            // Reset form for next entry
            resetForm();
            generateBillNumber();
            
            // Reload products (stock updated)
            loadProductsForBilling();
        } else {
            showAlert('Error saving bill!', 'danger');
        }
    } catch (error) {
        console.error('Error saving bill:', error);
        showAlert('Error saving bill: ' + error.message, 'danger');
    }
}

// Save and print bill
function saveAndPrint() {
    saveBill();
    setTimeout(() => {
        if (elements.billNo && elements.billNo.value) {
            printBill();
        }
    }, 1000);
}

// Reset form
function resetForm() {
    if (!elements.billBookNo) return;
    
    try {
        // Clear form fields
        elements.billBookNo.value = '';
        if (elements.customerName) elements.customerName.value = '';
        if (elements.productSelect) elements.productSelect.selectedIndex = 0;
        if (elements.weight) elements.weight.value = '';
        if (elements.rate) elements.rate.value = '';
        if (elements.amount) elements.amount.value = '';
        if (elements.discount) elements.discount.value = '0';
        if (elements.netAmount) elements.netAmount.value = '';
        if (elements.previousBalance) elements.previousBalance.value = '0';
        if (elements.totalPayable) elements.totalPayable.value = '';
        if (elements.receivedAmount) elements.receivedAmount.value = '';
        if (elements.paymentMethod) elements.paymentMethod.value = 'Cash';
        if (elements.chequeName) elements.chequeName.value = '';
        if (elements.chequeDate) elements.chequeDate.value = new Date().toISOString().split('T')[0];
        if (elements.chequeNo) elements.chequeNo.value = '';
        if (elements.balance) elements.balance.value = '';
        if (elements.remarks) elements.remarks.value = '';
        
        // Reset validation classes
        const formControls = document.querySelectorAll('.form-control, .form-select');
        formControls.forEach(control => {
            control.classList.remove('is-valid', 'is-invalid');
        });
        
        // Toggle cheque fields
        toggleChequeFields();
        
        // Set focus
        elements.billBookNo.focus();
        
        showAlert('Form reset. Ready for new entry.', 'info');
    } catch (error) {
        console.error('Error resetting form:', error);
    }
}

// Print bill
function printBill() {
    if (!elements.billNo || !elements.billNo.value) {
        showAlert('No bill data to print!', 'warning');
        return;
    }
    
    try {
        // Get current bill data from form
        const printData = {
            billNo: elements.billNo.value,
            date: elements.billDate ? elements.billDate.value : new Date().toISOString().split('T')[0],
            customerName: elements.customerName ? elements.customerName.value : '',
            weight: elements.weight ? elements.weight.value : '0',
            rate: elements.rate ? elements.rate.value : '0',
            amount: elements.amount ? elements.amount.value : '0',
            discount: elements.discount ? elements.discount.value : '0',
            netAmount: elements.netAmount ? elements.netAmount.value : '0',
            previousBalance: elements.previousBalance ? elements.previousBalance.value : '0',
            totalPayable: elements.totalPayable ? elements.totalPayable.value : '0',
            receivedAmount: elements.receivedAmount ? elements.receivedAmount.value : '0',
            balance: elements.balance ? elements.balance.value : '0',
            paymentMethod: elements.paymentMethod ? elements.paymentMethod.value : 'Cash',
            chequeName: elements.chequeName ? elements.chequeName.value : '',
            chequeDate: elements.chequeDate ? elements.chequeDate.value : '',
            chequeNo: elements.chequeNo ? elements.chequeNo.value : '',
            remarks: elements.remarks ? elements.remarks.value : ''
        };
        
        // Create print window
        const printWindow = window.open('', '_blank');
        
        // Build print content
        const printContent = buildPrintContent(printData);
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Auto print
        setTimeout(() => {
            printWindow.print();
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        }, 500);
        
    } catch (error) {
        console.error('Error printing bill:', error);
        showAlert('Error printing bill: ' + error.message, 'danger');
    }
}

// Build print content (remains same as your original)
function buildPrintContent(data) {
    // Same as your original function
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Bill ${data.billNo}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .invoice { max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .details { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .details th, .details td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            .details th { background-color: #f5f5f5; }
            .total { font-weight: bold; background-color: #f0f0f0; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            .signature { margin-top: 100px; display: flex; justify-content: space-between; }
            .signature-line { border-top: 1px solid #000; width: 200px; padding-top: 5px; }
            @media print { body { margin: 0; } .invoice { border: none; } }
        </style>
    </head>
    <body>
        <div class="invoice">
            <div class="header">
                <h1>PROFESSIONAL BILLING SYSTEM</h1>
                <h2>TAX INVOICE</h2>
                <p>Bill No: <strong>${data.billNo}</strong> | Date: ${data.date}</p>
            </div>
            
            <table class="details">
                <tr><th colspan="4">Customer Details</th></tr>
                <tr>
                    <th>Customer Name:</th>
                    <td colspan="3">${data.customerName}</td>
                </tr>
                ${data.remarks ? `<tr><th>Remarks:</th><td colspan="3">${data.remarks}</td></tr>` : ''}
            </table>
            
            <table class="details">
                <tr><th colspan="4">Bill Details</th></tr>
                <tr>
                    <th>Description</th>
                    <th>Weight (kg)</th>
                    <th>Rate (Rs.)</th>
                    <th>Amount (Rs.)</th>
                </tr>
                <tr>
                    <td>Goods/Services</td>
                    <td>${data.weight}</td>
                    <td>${parseFloat(data.rate).toFixed(2)}</td>
                    <td>${parseFloat(data.amount).toFixed(2)}</td>
                </tr>
                <tr>
                    <td colspan="3" style="text-align: right;">Discount:</td>
                    <td>${parseFloat(data.discount).toFixed(2)}</td>
                </tr>
                <tr class="total">
                    <td colspan="3" style="text-align: right;">Net Amount:</td>
                    <td>${parseFloat(data.netAmount).toFixed(2)}</td>
                </tr>
                <tr>
                    <td colspan="3" style="text-align: right;">Previous Balance:</td>
                    <td>${parseFloat(data.previousBalance).toFixed(2)}</td>
                </tr>
                <tr class="total">
                    <td colspan="3" style="text-align: right;">Total Payable:</td>
                    <td>${parseFloat(data.totalPayable).toFixed(2)}</td>
                </tr>
                <tr>
                    <td colspan="3" style="text-align: right;">Amount Received:</td>
                    <td>${parseFloat(data.receivedAmount).toFixed(2)}</td>
                </tr>
                <tr class="total">
                    <td colspan="3" style="text-align: right;">Balance Amount:</td>
                    <td>${parseFloat(data.balance).toFixed(2)}</td>
                </tr>
                <tr>
                    <td colspan="2"><strong>Payment Method:</strong> ${data.paymentMethod}</td>
                    <td colspan="2">
                        ${data.paymentMethod === 'Cheque' ? 
                          `<strong>Cheque Details:</strong> ${data.chequeName} | ${data.chequeDate} | ${data.chequeNo}` : 
                          ''}
                    </td>
                </tr>
            </table>
            
            <div class="signature">
                <div style="text-align: center;">
                    <div class="signature-line"></div>
                    <p>Customer Signature</p>
                </div>
                <div style="text-align: center;">
                    <div class="signature-line"></div>
                    <p>Authorized Signature</p>
                </div>
            </div>
            
            <div class="footer">
                <p>Thank you for your business!</p>
                <p>This is a computer generated invoice.</p>
                <p>Software by: Syed Ghina Ul Hassan</p>
                <p>Printed on: ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
        
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
    `;
}

// Load dashboard statistics
function loadDashboardStats() {
    try {
        const bills = getBillsFromStorage();
        const inventory = getInventoryFromStorage();
        const today = new Date().toISOString().split('T')[0];
        
        // Today's revenue
        const todayBills = bills.filter(bill => bill.date === today);
        const todayRevenue = todayBills.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0);
        
        // Total customers (unique)
        const customers = [...new Set(bills.map(bill => bill.customerName).filter(name => name.trim()))];
        
        // Pending balance
        const pendingBalance = bills.reduce((sum, bill) => sum + parseFloat(bill.balance || 0), 0);
        
        // Update DOM if elements exist
        const todayRevenueEl = document.getElementById('todayRevenue');
        const totalCustomersEl = document.getElementById('totalCustomers');
        const pendingBalanceEl = document.getElementById('pendingBalance');
        const inventoryItemsEl = document.getElementById('inventoryItems');
        
        if (todayRevenueEl) todayRevenueEl.textContent = `Rs. ${todayRevenue.toFixed(2)}`;
        if (totalCustomersEl) totalCustomersEl.textContent = customers.length;
        if (pendingBalanceEl) pendingBalanceEl.textContent = `Rs. ${pendingBalance.toFixed(2)}`;
        if (inventoryItemsEl) inventoryItemsEl.textContent = inventory.length;
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load recent activity (FIXED - using correct element ID)
function loadRecentActivity() {
    try {
        const bills = getBillsFromStorage();
        const recentBills = bills.slice(-5).reverse(); // Last 5 bills
        const tbody = document.getElementById('recentActivityBody') || 
                      document.getElementById('recentActivity');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (recentBills.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2"></i><br>
                        No recent activity
                    </td>
                </tr>
            `;
            return;
        }
        
        recentBills.forEach(bill => {
            const time = new Date(bill.timestamp || bill.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${bill.billNo || 'N/A'}</strong></td>
                <td>${bill.customerName || 'Unknown'}</td>
                <td>${bill.date || 'N/A'}</td>
                <td>Rs. ${parseFloat(bill.amount || 0).toFixed(2)}</td>
                <td><span class="badge ${(bill.balance || 0) > 0 ? 'bg-warning' : 'bg-success'}">
                    ${(bill.balance || 0) > 0 ? 'Pending' : 'Paid'}
                </span></td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Initialize quick stats chart
function initQuickStatsChart() {
    try {
        const canvas = document.getElementById('quickStatsChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Get payment method stats
        const bills = getBillsFromStorage();
        const methods = {
            Cash: 0,
            Cheque: 0,
            Online: 0,
            Card: 0
        };
        
        bills.forEach(bill => {
            if (bill.paymentMethod && methods.hasOwnProperty(bill.paymentMethod)) {
                methods[bill.paymentMethod]++;
            }
        });
        
        const total = Object.values(methods).reduce((a, b) => a + b, 1);
        
        // Update percentages if elements exist
        const cashPercentEl = document.getElementById('cashPercent');
        const chequePercentEl = document.getElementById('chequePercent');
        const onlinePercentEl = document.getElementById('onlinePercent');
        
        if (cashPercentEl) cashPercentEl.textContent = `${((methods.Cash / total) * 100).toFixed(1)}%`;
        if (chequePercentEl) chequePercentEl.textContent = `${((methods.Cheque / total) * 100).toFixed(1)}%`;
        if (onlinePercentEl) onlinePercentEl.textContent = `${((methods.Online / total) * 100).toFixed(1)}%`;
        
        // Create chart if Chart.js is loaded
        if (typeof Chart !== 'undefined') {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Cash', 'Cheque', 'Online', 'Card'],
                    datasets: [{
                        data: [methods.Cash, methods.Cheque, methods.Online, methods.Card],
                        backgroundColor: [
                            '#10b981', // Green
                            '#0ea5e9', // Blue
                            '#8b5cf6', // Purple
                            '#f59e0b'  // Orange
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error initializing chart:', error);
    }
}

// Update quick stats chart
function updateQuickStatsChart() {
    // Reinitialize chart with updated data
    initQuickStatsChart();
}

// Show alert message
function showAlert(message, type = 'info') {
    try {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
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
        
        // Insert at the top of container
        const container = document.querySelector('.container');
        if (container) {
            container.parentNode.insertBefore(alertDiv, container);
        } else {
            document.body.insertBefore(alertDiv, document.body.firstChild);
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

// Highlight field with animation
function highlightField(field) {
    if (!field) return;
    
    field.classList.add('highlight');
    setTimeout(() => {
        if (field.classList) {
            field.classList.remove('highlight');
        }
    }, 1000);
}

// Load initial data
function loadInitialData() {
    loadDashboardStats();
    loadRecentActivity();
    initQuickStatsChart();
}

// Export data
function exportData() {
    try {
        const data = {
            bills: getBillsFromStorage(),
            inventory: getInventoryFromStorage(),
            exportDate: new Date().toISOString(),
            system: 'Professional Billing System Pro',
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', `billing-backup-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showAlert('Error exporting data: ' + error.message, 'danger');
    }
}

// Import data prompt
function importDataPrompt() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (confirm('This will replace all current data. Continue?')) {
                        // Clear existing data
                        localStorage.clear();
                        
                        // Import bills
                        if (data.bills && Array.isArray(data.bills)) {
                            localStorage.setItem('bills', JSON.stringify(data.bills));
                        }
                        
                        // Import inventory
                        if (data.inventory && Array.isArray(data.inventory)) {
                            localStorage.setItem('inventory', JSON.stringify(data.inventory));
                        }
                        
                        showAlert('Data imported successfully! Page will reload.', 'success');
                        
                        // Reload page
                        setTimeout(() => location.reload(), 1500);
                    }
                } catch (error) {
                    showAlert('Error importing data: ' + error.message, 'danger');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    } catch (error) {
        console.error('Error in import prompt:', error);
        showAlert('Error importing data: ' + error.message, 'danger');
    }
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showAlert('An error occurred: ' + e.message, 'danger');
});