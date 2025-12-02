import API from './api';

export const organizationService = {
    getOrganization: () => API.get('/organization'),
    updateOrganization: (data) => API.put('/organization', data),
    updateFuelPrices: (prices) => API.put('/organization/fuel-prices', prices),
};
