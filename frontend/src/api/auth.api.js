import API from './axios';

// Auth API calls
export const registerOrg = (data) => API.post('/auth/org/register', data);
export const registerUserJoin = (data) => API.post('/auth/user/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const getOrganisations = () => API.get('/auth/orgs');
