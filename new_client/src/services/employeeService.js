import API from './api';

export const employeeService = {
    getAll: () => API.get('/employees'),
    getOne: (id) => API.get(`/employees/${id}`),
    create: (data) => API.post('/employees', data),
    update: (id, data) => API.put(`/employees/${id}`, data),
    delete: (id) => API.delete(`/employees/${id}`),
    getSummary: () => API.get('/employees/summary'),
};
