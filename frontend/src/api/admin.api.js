import API from './axios';

export const getUsers = (params) => API.get('/admin/users', { params });
export const updateUserRole = (id, role) => API.patch(`/admin/users/${id}/role`, { role });
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);
