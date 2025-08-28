import axios from 'axios';

let API_URL = process.env.REACT_APP_API_URL;
if (!API_URL && typeof window !== 'undefined') {
  const { origin, hostname, protocol } = window.location;
  if (/onrender\.com$/.test(hostname)) {
    const guessed = origin.replace('frontend', 'backend');
    API_URL = guessed;
  } else {
    API_URL = 'http://localhost:5000';
  }
}
if (!API_URL) {
  API_URL = 'http://localhost:5000';
}
console.log('API_URL resolved to:', API_URL);
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
export const getStock = (params) => axios.get(`${API_URL}/products/stock`, { params });
export const getInventoryInsights = () => axios.get(`${API_URL}/inventory/insights`);
export const getInventoryInsightsByLocation = (params) => axios.get(`${API_URL}/inventory/insights`, { params });
export const getLocations = () => axios.get(`${API_URL}/locations`);

// Purchase Orders
export const getPurchaseOrders = () => axios.get(`${API_URL}/purchase-orders`);
export const createPurchaseOrder = (data) => axios.post(`${API_URL}/purchase-orders`, data);
export const updatePurchaseOrder = (id, data) => axios.put(`${API_URL}/purchase-orders/${id}`, data);
export const deletePurchaseOrder = (id) => axios.delete(`${API_URL}/purchase-orders/${id}`);
export const addPurchaseOrderItem = (id, data) => axios.post(`${API_URL}/purchase-orders/${id}/items`, data);
export const receivePurchaseOrder = (id) => axios.post(`${API_URL}/purchase-orders/${id}/receive`);
export const getReorderSuggestions = () => axios.get(`${API_URL}/purchase-orders/reorder/suggestions`);
export const getSupplierPerformance = () => axios.get(`${API_URL}/purchase-orders/suppliers/performance`);

// Metal Master
export const getMetals = () => {
  console.log('getMetals called, API_URL:', API_URL);
  return axios.get(`${API_URL}/metal-master`);
};
export const createMetal = (data) => {
  console.log('createMetal called with data:', data, 'API_URL:', API_URL);
  return axios.post(`${API_URL}/metal-master`, data);
};
export const updateMetal = (id, data) => {
  console.log('updateMetal called with id:', id, 'data:', data, 'API_URL:', API_URL);
  return axios.put(`${API_URL}/metal-master/${id}`, data);
};
export const deleteMetal = (id) => {
  console.log('deleteMetal called with id:', id, 'API_URL:', API_URL);
  return axios.delete(`${API_URL}/metal-master/${id}`);
};

// Pricing Master
export const getPricing = () => {
  console.log('getPricing called, API_URL:', API_URL);
  return axios.get(`${API_URL}/pricing-master`);
};
export const createPricing = (data) => {
  console.log('createPricing called with data:', data, 'API_URL:', API_URL);
  return axios.post(`${API_URL}/pricing-master`, data);
};
export const updatePricing = (id, data) => {
  console.log('updatePricing called with id:', id, 'data:', data, 'API_URL:', API_URL);
  return axios.put(`${API_URL}/pricing-master/${id}`, data);
};
export const deletePricing = (id) => {
  console.log('deletePricing called with id:', id, 'API_URL:', API_URL);
  return axios.delete(`${API_URL}/pricing-master/${id}`);
};
// Stock adjustments
export const getAdjustments = () => axios.get(`${API_URL}/stock-adjustments`);
export const createAdjustment = (data) => axios.post(`${API_URL}/stock-adjustments`, data);
export const deleteAdjustmentApi = (id) => axios.delete(`${API_URL}/stock-adjustments/${id}`);
export const createProduct = (data) => axios.post(`${API_URL}/products`, data);
export const updateProduct = (id, data) => axios.put(`${API_URL}/products/${id}`, data);
export const deleteProduct = (id) => axios.delete(`${API_URL}/products/${id}`);

// Customers APIs
export const getCustomers = () => {
  console.log('getCustomers called, API_URL:', API_URL);
  return axios.get(`${API_URL}/customers`);
};
export const createCustomer = (data) => {
  console.log('createCustomer called with data:', data, 'API_URL:', API_URL);
  return axios.post(`${API_URL}/customers`, data);
};
export const updateCustomer = (id, data) => {
  console.log('updateCustomer called with id:', id, 'data:', data, 'API_URL:', API_URL);
  return axios.put(`${API_URL}/customers/${id}`, data);
};
export const deleteCustomer = (id) => {
  console.log('deleteCustomer called with id:', id, 'API_URL:', API_URL);
  return axios.delete(`${API_URL}/customers/${id}`);
};

// Suppliers APIs
export const getSuppliers = () => axios.get(`${API_URL}/suppliers`);
export const createSupplier = (data) => axios.post(`${API_URL}/suppliers`, data);
export const updateSupplier = (id, data) => axios.put(`${API_URL}/suppliers/${id}`, data);
export const deleteSupplier = (id) => axios.delete(`${API_URL}/suppliers/${id}`);

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
