// Charts and Analytics JavaScript - Fixed Version
// Compatible with storage.js and script.js

// Chart instances
let monthlyChart = null;
let yearlyChart = null;
let categoryChart = null;
let topProductsChart = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Charts Page Initializing...');
    
    // Check if we're on charts page
    if (!document.getElementById('monthlyChart')) {
        console.log('Not on charts page');
        return;
    }
    
    // Initialize charts
    initializeCharts();
    
    console.log('Charts Page Initialized');
});

// Initialize all charts
function initializeCharts() {
    try {
        // Populate year selectors
        populateYearSelectors();
        
        // Update all charts
        updateCharts();
        
        // Load statistics
        loadStatistics();
        
        // Hide loading states
        hideChartLoading();
        
    } catch (error) {
        console.error('Error initializing charts:', error);
        showAlert('Error initializing charts: ' + error.message, 'danger');
    }
}

// ==================== STORAGE FUNCTIONS ====================

function getBillsFromStorage() {
    try {
        const bills = localStorage.getItem('bills');
        return bills ? JSON.parse(bills) : [];
    } catch (error) {
        console.error('Error loading bills from storage:', error);
        return [];
    }
}

function getInventoryFromStorage() {
    try {
        const inventory = localStorage.getItem('inventory');
        return inventory ? JSON.parse(inventory) : [];
    } catch (error) {
        console.error('Error loading inventory from storage:', error);
        return [];
    }
}

// ==================== DATA PROCESSING FUNCTIONS ====================

// Get all unique years from bills
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

// Get monthly revenue for specific year
function getMonthlyRevenue(year) {
    try {
        const bills = getBillsFromStorage();
        const monthlyData = new Array(12).fill(0);
        const targetYear = year || new Date().getFullYear();
        
        bills.forEach(bill => {
            if (bill.date && bill.amount) {
                const billDate = new Date(bill.date);
                const billYear = billDate.getFullYear();
                const billMonth = billDate.getMonth(); // 0-11
                const amount = parseFloat(bill.amount) || 0;
                
                if (billYear === targetYear) {
                    monthlyData[billMonth] += amount;
                }
            }
        });
        
        return monthlyData;
    } catch (error) {
        console.error('Error getting monthly revenue:', error);
        return new Array(12).fill(0);
    }
}

// Get yearly revenue for range
function getYearlyRevenue(startYear, endYear) {
    try {
        const bills = getBillsFromStorage();
        const yearlyData = {};
        
        // Initialize all years in range
        for (let year = startYear; year <= endYear; year++) {
            yearlyData[year] = 0;
        }
        
        bills.forEach(bill => {
            if (bill.date && bill.amount) {
                const billDate = new Date(bill.date);
                const billYear = billDate.getFullYear();
                const amount = parseFloat(bill.amount) || 0;
                
                if (billYear >= startYear && billYear <= endYear) {
                    yearlyData[billYear] += amount;
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
            if (bill.productId && bill.amount) {
                const product = inventory.find(item => item.id === bill.productId);
                if (product && product.category) {
                    const category = product.category;
                    const amount = parseFloat(bill.amount) || 0;
                    
                    categorySales[category] = (categorySales[category] || 0) + amount;
                }
            }
        });
        
        // If no category data, use default
        if (Object.keys(categorySales).length === 0) {
            categorySales['General'] = bills.reduce((sum, bill) => 
                sum + (parseFloat(bill.amount) || 0), 0
            ) || 1000; // Default value for demo
        }
        
        return categorySales;
    } catch (error) {
        console.error('Error getting sales by category:', error);
        return { 'General': 1000, 'Electronics': 800, 'Clothing': 600 };
    }
}

// Get top selling products
function getTopSellingProducts(limit = 5) {
    try {
        const bills = getBillsFromStorage();
        const inventory = getInventoryFromStorage();
        const productSales = {};
        
        bills.forEach(bill => {
            if (bill.productId && bill.amount) {
                const product = inventory.find(item => item.id === bill.productId);
                if (product) {
                    const productName = product.name || 'Unknown Product';
                    const amount = parseFloat(bill.amount) || 0;
                    
                    productSales[productName] = (productSales[productName] || 0) + amount;
                }
            }
        });
        
        // Convert to array and sort
        const topProducts = Object.entries(productSales)
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, limit);
        
        // If no product data, create demo data
        if (topProducts.length === 0) {
            return [
                { name: 'Product A', sales: 5000 },
                { name: 'Product B', sales: 4000 },
                { name: 'Product C', sales: 3000 },
                { name: 'Product D', sales: 2000 },
                { name: 'Product E', sales: 1000 }
            ];
        }
        
        return topProducts;
    } catch (error) {
        console.error('Error getting top products:', error);
        return [
            { name: 'Sample Product 1', sales: 5000 },
            { name: 'Sample Product 2', sales: 4000 },
            { name: 'Sample Product 3', sales: 3000 }
        ];
    }
}

// Get statistics
function getStatistics() {
    try {
        const bills = getBillsFromStorage();
        const today = new Date().toISOString().split('T')[0];
        
        // Calculate totals
        const totalRevenue = bills.reduce((sum, bill) => 
            sum + (parseFloat(bill.amount) || 0), 0
        );
        
        const totalBalance = bills.reduce((sum, bill) => 
            sum + (parseFloat(bill.balance) || 0), 0
        );
        
        const totalBills = bills.length;
        
        // Get unique customers
        const customers = new Set(bills.map(bill => bill.customerName).filter(name => name));
        const totalCustomers = customers.size;
        
        // Today's revenue
        const todayRevenue = bills
            .filter(bill => bill.date === today)
            .reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);
        
        return {
            totalRevenue,
            totalBalance,
            totalBills,
            totalCustomers,
            todayRevenue
        };
    } catch (error) {
        console.error('Error getting statistics:', error);
        return {
            totalRevenue: 0,
            totalBalance: 0,
            totalBills: 0,
            totalCustomers: 0,
            todayRevenue: 0
        };
    }
}

// ==================== CHART FUNCTIONS ====================

// Populate year selectors
function populateYearSelectors() {
    try {
        const years = getAllYearsFromBills();
        const currentYear = new Date().getFullYear();
        
        // Populate year select for monthly chart
        const yearSelect = document.getElementById('yearSelect');
        if (yearSelect) {
            yearSelect.innerHTML = '';
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                if (year === currentYear) {
                    option.selected = true;
                }
                yearSelect.appendChild(option);
            });
        }
        
        // Populate start year select
        const startYearSelect = document.getElementById('startYear');
        if (startYearSelect) {
            startYearSelect.innerHTML = '';
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                if (year === years[0]) {
                    option.selected = true;
                }
                startYearSelect.appendChild(option);
            });
        }
        
        // Populate end year select
        const endYearSelect = document.getElementById('endYear');
        if (endYearSelect) {
            endYearSelect.innerHTML = '';
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                if (year === years[years.length - 1]) {
                    option.selected = true;
                }
                endYearSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error populating year selectors:', error);
    }
}

// Update all charts
function updateCharts() {
    try {
        showChartLoading();
        
        const selectedYear = parseInt(document.getElementById('yearSelect')?.value) || new Date().getFullYear();
        const startYear = parseInt(document.getElementById('startYear')?.value) || new Date().getFullYear() - 5;
        const endYear = parseInt(document.getElementById('endYear')?.value) || new Date().getFullYear();
        
        updateMonthlyChart(selectedYear);
        updateYearlyChart(startYear, endYear);
        updateCategoryChart();
        updateTopProductsChart();
        loadStatistics();
        loadAdditionalStatistics();
        
        setTimeout(() => {
            hideChartLoading();
        }, 500);
        
    } catch (error) {
        console.error('Error updating charts:', error);
        showAlert('Error updating charts: ' + error.message, 'danger');
        hideChartLoading();
    }
}

// Update monthly revenue chart
function updateMonthlyChart(year) {
    try {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) {
            console.error('Monthly chart canvas not found');
            return;
        }
        
        const monthlyData = getMonthlyRevenue(year);
        const chartContext = ctx.getContext('2d');
        
        // Destroy existing chart
        if (monthlyChart) {
            monthlyChart.destroy();
        }
        
        // Calculate statistics
        const totalRevenue = monthlyData.reduce((a, b) => a + b, 0);
        const nonZeroMonths = monthlyData.filter(d => d > 0).length;
        const averageMonthly = nonZeroMonths > 0 ? totalRevenue / nonZeroMonths : 0;
        
        // Find growth percentage
        let growth = 0;
        const nonZeroData = monthlyData.filter(d => d > 0);
        if (nonZeroData.length >= 2) {
            const recentMonth = nonZeroData[nonZeroData.length - 1];
            const previousMonth = nonZeroData[nonZeroData.length - 2];
            if (previousMonth > 0) {
                growth = ((recentMonth - previousMonth) / previousMonth) * 100;
            }
        }
        
        // Update statistics display
        const monthlyTotalEl = document.getElementById('monthlyTotal');
        const monthlyAverageEl = document.getElementById('monthlyAverage');
        const monthlyGrowthEl = document.getElementById('monthlyGrowth');
        
        if (monthlyTotalEl) monthlyTotalEl.textContent = `Rs. ${totalRevenue.toFixed(2)}`;
        if (monthlyAverageEl) monthlyAverageEl.textContent = `Rs. ${averageMonthly.toFixed(2)}`;
        if (monthlyGrowthEl) {
            monthlyGrowthEl.textContent = `${growth.toFixed(1)}%`;
            monthlyGrowthEl.style.color = growth >= 0 ? '#198754' : '#dc3545';
        }
        
        // Create chart
        monthlyChart = new Chart(chartContext, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: `Monthly Revenue (${year})`,
                    data: monthlyData,
                    backgroundColor: 'rgba(37, 99, 235, 0.7)',
                    borderColor: 'rgb(37, 99, 235)',
                    borderWidth: 2,
                    borderRadius: 5,
                    hoverBackgroundColor: 'rgba(37, 99, 235, 0.9)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Revenue: Rs. ${context.parsed.y.toFixed(2)}`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 12 },
                        bodyFont: { size: 12 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rs. ' + value;
                            },
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error updating monthly chart:', error);
        showAlert('Error updating monthly chart: ' + error.message, 'danger');
    }
}

// Update yearly revenue chart
function updateYearlyChart(startYear, endYear) {
    try {
        const ctx = document.getElementById('yearlyChart');
        if (!ctx) {
            console.error('Yearly chart canvas not found');
            return;
        }
        
        const yearlyData = getYearlyRevenue(startYear, endYear);
        const chartContext = ctx.getContext('2d');
        
        // Destroy existing chart
        if (yearlyChart) {
            yearlyChart.destroy();
        }
        
        // Prepare data
        const labels = [];
        const data = [];
        
        for (let year = startYear; year <= endYear; year++) {
            labels.push(year.toString());
            data.push(yearlyData[year] || 0);
        }
        
        // Calculate statistics
        const totalRevenue = data.reduce((a, b) => a + b, 0);
        const nonZeroYears = data.filter(d => d > 0).length;
        const averageYearly = nonZeroYears > 0 ? totalRevenue / nonZeroYears : 0;
        
        // Find growth percentage
        let growth = 0;
        const nonZeroData = data.filter(d => d > 0);
        if (nonZeroData.length >= 2) {
            const recentYear = nonZeroData[nonZeroData.length - 1];
            const previousYear = nonZeroData[nonZeroData.length - 2];
            if (previousYear > 0) {
                growth = ((recentYear - previousYear) / previousYear) * 100;
            }
        }
        
        // Update statistics display
        const yearlyTotalEl = document.getElementById('yearlyTotal');
        const yearlyAverageEl = document.getElementById('yearlyAverage');
        const yearlyGrowthEl = document.getElementById('yearlyGrowth');
        
        if (yearlyTotalEl) yearlyTotalEl.textContent = `Rs. ${totalRevenue.toFixed(2)}`;
        if (yearlyAverageEl) yearlyAverageEl.textContent = `Rs. ${averageYearly.toFixed(2)}`;
        if (yearlyGrowthEl) {
            yearlyGrowthEl.textContent = `${growth.toFixed(1)}%`;
            yearlyGrowthEl.style.color = growth >= 0 ? '#198754' : '#dc3545';
        }
        
        // Create chart
        yearlyChart = new Chart(chartContext, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Yearly Revenue',
                    data: data,
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    borderColor: 'rgb(245, 158, 11)',
                    borderWidth: 3,
                    tension: 0.1,
                    fill: true,
                    pointBackgroundColor: 'rgb(245, 158, 11)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Revenue: Rs. ${context.parsed.y.toFixed(2)}`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 12 },
                        bodyFont: { size: 12 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rs. ' + value;
                            },
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error updating yearly chart:', error);
        showAlert('Error updating yearly chart: ' + error.message, 'danger');
    }
}

// Update category chart
function updateCategoryChart() {
    try {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) {
            console.error('Category chart canvas not found');
            return;
        }
        
        const salesByCategory = getSalesByCategory();
        const chartContext = ctx.getContext('2d');
        
        // Destroy existing chart
        if (categoryChart) {
            categoryChart.destroy();
        }
        
        const labels = Object.keys(salesByCategory);
        const data = Object.values(salesByCategory);
        
        // Color palette
        const colors = [
            '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6'
        ];
        
        categoryChart = new Chart(chartContext, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverBorderColor: '#000',
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: Rs. ${value.toFixed(2)} (${percentage}%)`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 12 },
                        bodyFont: { size: 12 }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error updating category chart:', error);
        showAlert('Error updating category chart: ' + error.message, 'danger');
    }
}

// Update top products chart
function updateTopProductsChart() {
    try {
        const ctx = document.getElementById('topProductsChart');
        if (!ctx) {
            console.error('Top products chart canvas not found');
            return;
        }
        
        const topProducts = getTopSellingProducts(5);
        const chartContext = ctx.getContext('2d');
        
        // Destroy existing chart
        if (topProductsChart) {
            topProductsChart.destroy();
        }
        
        const labels = topProducts.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name);
        const data = topProducts.map(p => p.sales);
        
        topProductsChart = new Chart(chartContext, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sales Revenue (Rs.)',
                    data: data,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: 'rgb(239, 68, 68)',
                    borderWidth: 2,
                    borderRadius: 5,
                    hoverBackgroundColor: 'rgba(239, 68, 68, 0.9)'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const productName = topProducts[context.dataIndex].name;
                                const sales = context.parsed.x;
                                return `${productName}: Rs. ${sales.toFixed(2)}`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 12 },
                        bodyFont: { size: 12 }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rs. ' + value;
                            },
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error updating top products chart:', error);
        showAlert('Error updating top products chart: ' + error.message, 'danger');
    }
}

// Load statistics
function loadStatistics() {
    try {
        const stats = getStatistics();
        const today = new Date();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();
        const monthlyData = getMonthlyRevenue(thisYear);
        
        // Update statistics cards
        const totalRevenueEl = document.getElementById('totalRevenue');
        const totalPendingEl = document.getElementById('totalPending');
        const thisMonthRevenueEl = document.getElementById('thisMonthRevenue');
        const averageBillEl = document.getElementById('averageBill');
        
        if (totalRevenueEl) totalRevenueEl.textContent = `Rs. ${stats.totalRevenue.toFixed(2)}`;
        if (totalPendingEl) totalPendingEl.textContent = `Rs. ${stats.totalBalance.toFixed(2)}`;
        if (thisMonthRevenueEl) thisMonthRevenueEl.textContent = `Rs. ${(monthlyData[thisMonth] || 0).toFixed(2)}`;
        
        // Calculate average bill
        const averageBill = stats.totalBills > 0 ? stats.totalRevenue / stats.totalBills : 0;
        if (averageBillEl) averageBillEl.textContent = `Rs. ${averageBill.toFixed(2)}`;
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load additional statistics
function loadAdditionalStatistics() {
    try {
        const stats = getStatistics();
        const bills = getBillsFromStorage();
        
        // Calculate additional stats
        const totalCustomers = stats.totalCustomers;
        const avgMonthlyBills = stats.totalBills > 0 ? (stats.totalBills / 12).toFixed(1) : '0';
        
        // Find best month and year
        const currentYear = new Date().getFullYear();
        const monthlyData = getMonthlyRevenue(currentYear);
        const maxMonthValue = Math.max(...monthlyData);
        const bestMonthIndex = monthlyData.indexOf(maxMonthValue);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const bestMonth = maxMonthValue > 0 ? monthNames[bestMonthIndex] : 'N/A';
        
        // Find best product
        const topProducts = getTopSellingProducts(1);
        const bestProduct = topProducts.length > 0 ? topProducts[0].name : 'N/A';
        
        // Find best year
        const startYear = currentYear - 5;
        const endYear = currentYear;
        const yearlyData = getYearlyRevenue(startYear, endYear);
        let bestYear = 'N/A';
        let maxYearValue = 0;
        
        for (const [year, value] of Object.entries(yearlyData)) {
            if (value > maxYearValue) {
                maxYearValue = value;
                bestYear = year;
            }
        }
        
        // Update DOM elements
        const elements = {
            'totalBillsCount': stats.totalBills,
            'totalCustomersCount': totalCustomers,
            'avgMonthlyBills': avgMonthlyBills,
            'bestMonth': bestMonth,
            'bestYear': bestYear,
            'bestProduct': bestProduct.length > 25 ? bestProduct.substring(0, 25) + '...' : bestProduct
        };
        
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
        
    } catch (error) {
        console.error('Error loading additional statistics:', error);
    }
}

// ==================== UTILITY FUNCTIONS ====================

// Show loading for charts
function showChartLoading() {
    const loaders = [
        'monthlyChartLoading',
        'yearlyChartLoading',
        'categoryChartLoading',
        'topProductsChartLoading'
    ];
    
    loaders.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'flex';
        }
    });
}

// Hide loading for charts
function hideChartLoading() {
    const loaders = [
        'monthlyChartLoading',
        'yearlyChartLoading',
        'categoryChartLoading',
        'topProductsChartLoading'
    ];
    
    loaders.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
}

// Refresh all charts
function refreshCharts() {
    updateCharts();
    showAlert('Charts refreshed successfully!', 'success');
}

// Export charts data
function exportChartData() {
    try {
        const stats = getStatistics();
        const selectedYear = parseInt(document.getElementById('yearSelect')?.value) || new Date().getFullYear();
        const startYear = parseInt(document.getElementById('startYear')?.value) || new Date().getFullYear() - 5;
        const endYear = parseInt(document.getElementById('endYear')?.value) || new Date().getFullYear();
        
        const exportData = {
            reportDate: new Date().toISOString(),
            period: {
                monthlyChartYear: selectedYear,
                yearlyChartStart: startYear,
                yearlyChartEnd: endYear
            },
            statistics: stats,
            monthlyData: getMonthlyRevenue(selectedYear),
            yearlyData: getYearlyRevenue(startYear, endYear),
            categoryData: getSalesByCategory(),
            topProducts: getTopSellingProducts(5)
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', `charts-export-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('Chart data exported successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting chart data:', error);
        showAlert('Error exporting chart data: ' + error.message, 'danger');
    }
}

// Export charts as images (combined report)
function exportCharts() {
    try {
        // Create print window with all charts
        const printWindow = window.open('', '_blank');
        
        // Get chart data URLs
        const charts = ['monthlyChart', 'yearlyChart', 'categoryChart', 'topProductsChart'];
        const chartImages = [];
        
        charts.forEach(chartId => {
            const canvas = document.getElementById(chartId);
            if (canvas) {
                chartImages.push({
                    name: chartId.replace('Chart', ' Chart'),
                    dataUrl: canvas.toDataURL('image/png')
                });
            }
        });
        
        // Get statistics
        const stats = getStatistics();
        
        // Build report content
        const reportContent = buildReportContent(chartImages, stats);
        
        printWindow.document.write(reportContent);
        printWindow.document.close();
        
        // Auto print
        setTimeout(() => {
            printWindow.print();
            printWindow.onafterprint = function() {
                setTimeout(() => {
                    printWindow.close();
                }, 500);
            };
        }, 500);
        
    } catch (error) {
        console.error('Error exporting charts:', error);
        showAlert('Error exporting charts: ' + error.message, 'danger');
    }
}

// Build report content for printing
function buildReportContent(chartImages, stats) {
    const selectedYear = parseInt(document.getElementById('yearSelect')?.value) || new Date().getFullYear();
    const startYear = parseInt(document.getElementById('startYear')?.value) || new Date().getFullYear() - 5;
    const endYear = parseInt(document.getElementById('endYear')?.value) || new Date().getFullYear();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Revenue Analytics Report</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                color: #333;
            }
            .report-header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #000; 
                padding-bottom: 20px; 
            }
            .stats-grid { 
                display: grid; 
                grid-template-columns: repeat(4, 1fr); 
                gap: 15px; 
                margin: 20px 0; 
            }
            .stat-item { 
                background: #f8f9fa; 
                padding: 15px; 
                border-radius: 5px; 
                text-align: center;
                border: 1px solid #dee2e6;
            }
            .chart-section { 
                margin: 30px 0; 
                page-break-inside: avoid;
            }
            .chart-title { 
                background: #e9ecef; 
                padding: 10px; 
                border-radius: 5px 5px 0 0;
                font-weight: bold;
                border: 1px solid #dee2e6;
                border-bottom: none;
            }
            .chart-image { 
                width: 100%; 
                border: 1px solid #dee2e6;
                border-top: none;
                display: block;
            }
            @media print { 
                @page { margin: 0.5in; }
                body { margin: 0; }
                .chart-section { break-inside: avoid; }
            }
            .footer { 
                margin-top: 40px; 
                text-align: center; 
                font-size: 12px; 
                color: #666; 
                padding-top: 20px; 
                border-top: 1px solid #ddd; 
            }
        </style>
    </head>
    <body>
        <div class="report-header">
            <h1>REVENUE ANALYTICS REPORT</h1>
            <h3>Professional Billing System Pro</h3>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Period: Monthly (${selectedYear}) | Yearly (${startYear}-${endYear})</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-item">
                <h4>Total Revenue</h4>
                <h3>Rs. ${stats.totalRevenue.toFixed(2)}</h3>
            </div>
            <div class="stat-item">
                <h4>Total Bills</h4>
                <h3>${stats.totalBills}</h3>
            </div>
            <div class="stat-item">
                <h4>Total Customers</h4>
                <h3>${stats.totalCustomers}</h3>
            </div>
            <div class="stat-item">
                <h4>Pending Balance</h4>
                <h3>Rs. ${stats.totalBalance.toFixed(2)}</h3>
            </div>
        </div>
        
        ${chartImages.map(chart => `
            <div class="chart-section">
                <div class="chart-title">${chart.name}</div>
                <img src="${chart.dataUrl}" class="chart-image" alt="${chart.name}">
            </div>
        `).join('')}
        
        <div class="footer">
            <p><strong>Software by: Syed Ghina Ul Hassan</strong></p>
            <p>Professional Billing System Pro - Revenue Analytics Module</p>
            <p>Report ID: ${Date.now()}</p>
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