import API from './api';

export const transactionService = {
    getAll: () => API.get('/transactions'),
    getOne: (id) => API.get(`/transactions/${id}`),
    create: (data) => API.post('/transactions', data),
    update: (id, data) => API.put(`/transactions/${id}`, data),
    delete: (id) => API.delete(`/transactions/${id}`),
};
