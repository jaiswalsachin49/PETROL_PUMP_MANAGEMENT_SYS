import API from './api';

export const userService = {
    getUsers: () => API.get('/users'),
    createUser: (userData) => API.post('/users', userData),
    updateUser: (id, userData) => API.put(`/users/${id}`, userData),
    deleteUser: (id) => API.delete(`/users/${id}`),
    updateProfile: (data) => API.put('/users/profile', data),
    changePassword: (passwords) => API.put('/users/change-password', passwords),
};
