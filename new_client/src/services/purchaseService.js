import API from './api';

export const purchaseService = {
    getAll: () => API.get('/purchases'),
    getOne: (id) => API.get(`/purchases/${id}`),
    create: (data) => API.post('/purchases', data),
    update: (id, data) => API.put(`/purchases/${id}`, data),
    delete: (id) => API.delete(`/purchases/${id}`),
    getRecent: (limit) => API.get(`/purchases/recent?limit=${limit}`),
};
