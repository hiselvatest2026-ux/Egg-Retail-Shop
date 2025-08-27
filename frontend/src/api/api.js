import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const getPurchases = () => axios.get(`${API_URL}/purchases`);
export const createPurchase = (data) => axios.post(`${API_URL}/purchases`, data);
export const updatePurchase = (id, data) => axios.put(`${API_URL}/purchases/${id}`, data);
export const deletePurchase = (id) => axios.delete(`${API_URL}/purchases/${id}`);
