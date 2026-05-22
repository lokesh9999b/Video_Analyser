import API from './axios';

// Approved user management
export const getUsers = (params) => API.get('/admin/users', { params });
export const updateUserRole = (id, role) => API.patch(`/admin/users/${id}/role`, { role });
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);

// Pending approval management
export const getPendingUsers = () => API.get('/admin/users/pending');
export const approveUser = (id, role) => API.patch(`/admin/users/${id}/approve`, { role });
export const rejectUser = (id) => API.delete(`/admin/users/${id}/reject`);
