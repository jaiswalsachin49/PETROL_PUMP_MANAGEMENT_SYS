import API from './api';

export const pumpService = {
    getAll: () => API.get('/pumps'),
    getOne: (id) => API.get(`/pumps/${id}`),
    create: (data) => API.post('/pumps', data),
    update: (id, data) => API.put(`/pumps/${id}`, data),
    getByStatus: (state) => API.get(`/pumps/status/${state}`),
    delete: (id) => API.delete(`/pumps/${id}`),
    getPumpsWithSales: () => API.get('/pumps/with-sales'),
    addNozzle: (pumpId, data) => API.post(`/pumps/${pumpId}/nozzles`, data),
    updateNozzleReading: (pumpId, nozzleId, data) => API.put(`/pumps/${pumpId}/nozzles/${nozzleId}`, data),
    assignNozzle: (pumpId, nozzleId, data) => API.put(`/pumps/${pumpId}/nozzles/${nozzleId}/assign`, data),
};
