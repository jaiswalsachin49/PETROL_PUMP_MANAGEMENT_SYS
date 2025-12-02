import API from './api';

export const inventoryService = {
    getAll: () => API.get('/inventory'),
    getOne: (id) => API.get(`/inventory/${id}`),
    create: (data) => API.post('/inventory', data),
    update: (id, data) => API.put(`/inventory/${id}`, data),
    delete: (id) => API.delete(`/inventory/${id}`),
};
