import API from './api';

export const supplierService = {
    getAll: () => API.get('/suppliers'),
    getOne: (id) => API.get(`/suppliers/${id}`),
    create: (data) => API.post('/suppliers', data),
    update: (id, data) => API.put(`/suppliers/${id}`, data),
    delete: (id) => API.delete(`/suppliers/${id}`),
};
