import API from './api';

export const shiftService = {
    getAll: () => API.get('/shifts'),
    getOne: (id) => API.get(`/shifts/${id}`),
    create: (data) => API.post('/shifts', data),
    update: (id, data) => API.put(`/shifts/${id}`, data),
    delete: (id) => API.delete(`/shifts/${id}`),
    closeShift: (id, data) => API.post(`/shifts/${id}/close`, data),
    getShiftReport: (id) => API.get(`/reports/shift/${id}`),
};
