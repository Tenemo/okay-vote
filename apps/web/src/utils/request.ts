import axios from 'axios';

const apiBaseUrl = process.env.API_BASE_URL?.trim().replace(/\/+$/, '');

export default axios.create({
    ...(apiBaseUrl ? { baseURL: apiBaseUrl } : {}),
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});
