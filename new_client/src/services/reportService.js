import API from './api';

export const reportService = {
    getDashboardSummary: () => API.get('/reports/dashboard'),
    getShiftSalesTrends: () => API.get('/reports/shift-sales-trend'),
    getFuelDistribution: (shiftId) => API.get(`/reports/fuel-distribution${shiftId ? `?shiftId=${shiftId}` : ''}`),
    getWeeklyPerformance: () => API.get('/reports/weekly-performance'),
    getTankLevels: () => API.get('/reports/tank-levels'),
    getRecentActivity: (limit = 10) => API.get(`/reports/recent-activity?limit=${limit}`),
    getTopPerformers: (limit = 5) => API.get(`/reports/top-performers?limit=${limit}`),
    getShiftDetail: (shiftId) => API.get(`/reports/shift/${shiftId}`),
    getCreditCustomers: () => API.get('/reports/credit-customers'),
    getInventoryStatus: () => API.get('/reports/inventory-status'),

    // New Reports
    getSalesReport: (params) => API.get('/reports/sales-report', { params }),
    getFinancialReport: () => API.get('/reports/financial-report'),
    getFuelInventoryReport: () => API.get('/reports/fuel-inventory-report'),
    getAnalyticsDashboard: () => API.get('/reports/analytics-dashboard'),

    // Reconciliation
    getFuelReconciliation: () => API.get('/reports/fuel-reconciliation'),
    getDailyReconciliation: () => API.get('/reports/daily-reconciliation'),
    getAnomalies: () => API.get('/reports/anomalies'),
};
