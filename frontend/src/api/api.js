import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const getPurchases = () => axios.get(`${API_URL}/purchases`);
export const createPurchase = (data) => axios.post(`${API_URL}/purchases`, data);
export const updatePurchase = (id, data) => axios.put(`${API_URL}/purchases/${id}`, data);
export const deletePurchase = (id) => axios.delete(`${API_URL}/purchases/${id}`);

// Sales APIs
export const getSales = () => axios.get(`${API_URL}/sales`);
export const createSale = (data) => axios.post(`${API_URL}/sales`, data);
export const updateSale = (id, data) => axios.put(`${API_URL}/sales/${id}`, data);
export const deleteSale = (id) => axios.delete(`${API_URL}/sales/${id}`);

// Payments APIs
export const getPayments = () => axios.get(`${API_URL}/payments`);
export const createPayment = (data) => axios.post(`${API_URL}/payments`, data);
export const updatePayment = (id, data) => axios.put(`${API_URL}/payments/${id}`, data);
export const deletePayment = (id) => axios.delete(`${API_URL}/payments/${id}`);
