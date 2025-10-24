import API from './api';

export const customerService = {
    getAll: () => API.get('/customers'),
    getOne: (id) => API.get(`/customers/${id}`),
    create: (data) => API.post('/customers', data),
    update: (id, data) => API.put(`/customers/${id}`, data),
    delete: (id) => API.delete(`/customers/${id}`),
};
