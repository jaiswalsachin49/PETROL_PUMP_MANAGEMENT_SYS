import API from './api';

export const authService = {
    login: (credentials) => API.post('/auth/login', credentials),
    register: (data) => API.post('/auth/register', data),
    getMe: () => API.get('/auth/me'),
    logout: () => {
        localStorage.removeItem('token');
    }
};
