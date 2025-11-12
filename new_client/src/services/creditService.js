import API from "./api";

export const creditService = {
    getAllCriditCustomers: () => API.get('/credit/customers'),
    getOverdueCredits: () => API.get('/credit/overdue'),
    getCustomerStatement: (customerId) => API.get(`/credit/statement/:${customerId}`),
    getCreditAgingReport: () => API.get('/credit/aging-report'),
    sendPaymentReminder: (customerId, message) => 
        API.post('/credit/send-reminder', { customerId, message }),
};