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

// Products APIs
export const getProducts = () => axios.get(`${API_URL}/products`);
export const createProduct = (data) => axios.post(`${API_URL}/products`, data);
export const updateProduct = (id, data) => axios.put(`${API_URL}/products/${id}`, data);
export const deleteProduct = (id) => axios.delete(`${API_URL}/products/${id}`);

// Customers APIs
export const getCustomers = () => axios.get(`${API_URL}/customers`);
export const createCustomer = (data) => axios.post(`${API_URL}/customers`, data);
export const updateCustomer = (id, data) => axios.put(`${API_URL}/customers/${id}`, data);
export const deleteCustomer = (id) => axios.delete(`${API_URL}/customers/${id}`);

// Invoice detail
export const getSaleInvoice = (id) => axios.get(`${API_URL}/sales/${id}/invoice`);

// Dashboard
export const getDashboard = () => axios.get(`${API_URL}/dashboard`);

// Sale Items
export const getSaleItems = (saleId) => axios.get(`${API_URL}/sales/${saleId}/items`);
export const createSaleItem = (saleId, data) => axios.post(`${API_URL}/sales/${saleId}/items`, data);
export const updateSaleItem = (saleId, itemId, data) => axios.put(`${API_URL}/sales/${saleId}/items/${itemId}`, data);
export const deleteSaleItem = (saleId, itemId) => axios.delete(`${API_URL}/sales/${saleId}/items/${itemId}`);

// Purchase Items
export const getPurchaseItems = (purchaseId) => axios.get(`${API_URL}/purchases/${purchaseId}/items`);
export const createPurchaseItem = (purchaseId, data) => axios.post(`${API_URL}/purchases/${purchaseId}/items`, data);
export const updatePurchaseItem = (purchaseId, itemId, data) => axios.put(`${API_URL}/purchases/${purchaseId}/items/${itemId}`, data);
export const deletePurchaseItem = (purchaseId, itemId) => axios.delete(`${API_URL}/purchases/${purchaseId}/items/${itemId}`);
