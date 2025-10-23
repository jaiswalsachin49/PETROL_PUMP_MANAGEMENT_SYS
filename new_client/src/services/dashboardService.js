import API from './api';

export const dashboardService = {
    getDashboardSummary: () => API.get('/reports/dashboard'),
    getShiftSalesTrend: () => API.get('/reports/shift-sales-trend'),
    getFuelDistribution: () => API.get('/reports/fuel-distribution'),
    getWeeklyPerformance: () => API.get('/reports/weekly-performance'),
    getTankLevels: () => API.get('/reports/tank-levels'),
    getRecentActivity: (limit = 10) => API.get(`/reports/recent-activity?limit=${limit}`),
    getTopPerformers: (limit = 5) => API.get(`/reports/top-performers?limit=${limit}`),
};
