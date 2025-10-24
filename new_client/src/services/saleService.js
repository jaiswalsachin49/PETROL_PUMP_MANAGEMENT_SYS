import API from './api';

export const saleService = {
    getAll: () => API.get('/sales'),
    getOne: (id) => API.get(`/sales/${id}`),
    create: (data) => API.post('/sales', data),
    update: (id, data) => API.put(`/sales/${id}`, data),
    delete: (id) => API.delete(`/sales/${id}`),
};
