import API from './api';

export const tankService = {
    getAll: () => API.get('/tanks'),
    getOne: (id) => API.get(`/tanks/${id}`),
    create: (data) => API.post('/tanks', data),
    update: (id, data) => API.put(`/tanks/${id}`, data),
    delete: (id) => API.delete(`/tanks/${id}`),
    getTankDetails: (id) => API.get(`/tanks/${id}/details`),
    updateDipReading: (id, reading) => API.put(`/tanks/${id}/dip-reading`, { reading }),
};
