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

// Attach current shop header to every request
axios.interceptors.request.use((config) => {
  try {
    const shopId = (typeof window !== 'undefined') ? window.localStorage.getItem('currentShopId') : null;
    if (shopId) {
      config.headers = config.headers || {};
      config.headers['X-Shop-Id'] = shopId;
    }
  } catch (_) {}
  return config;
});

// Set a sane global timeout to avoid hanging spinners (e.g., cold starts)
axios.defaults.timeout = 10000; // 10 seconds
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
export const getPaymentsFiltered = (params) => axios.get(`${API_URL}/payments`, { params });

// Products APIs
export const getProducts = () => axios.get(`${API_URL}/products`);
export const getStock = (params) => axios.get(`${API_URL}/products/stock`, { params });
export const getAvailable = (params) => axios.get(`${API_URL}/products/available`, { params });
export const getInventoryInsights = () => axios.get(`${API_URL}/inventory/insights`);
export const getInventoryInsightsByLocation = (params) => axios.get(`${API_URL}/inventory/insights`, { params });
export const getLocations = () => axios.get(`${API_URL}/locations`);
export const runSeed = () => axios.post(`${API_URL}/admin/seed`);

// Purchase Orders removed

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

// Vendors APIs
export const getVendors = () => axios.get(`${API_URL}/vendors`);
export const createVendor = (data) => axios.post(`${API_URL}/vendors`, data);
export const updateVendor = (id, data) => axios.put(`${API_URL}/vendors/${id}`, data);
export const deleteVendor = (id) => axios.delete(`${API_URL}/vendors/${id}`);

// Shops
export const getShops = () => axios.get(`${API_URL}/shops`);

// Invoice detail
export const getSaleInvoice = (id) => axios.get(`${API_URL}/sales/${id}/invoice`);

// Pricing for sales
export const getPricingForSale = (params) => {
  console.log('getPricingForSale called with params:', params, 'API_URL:', API_URL);
  return axios.get(`${API_URL}/sales/pricing`, { params });
};

// Latest purchase unit price for a material
export const getLastPurchasePrice = (params) => axios.get(`${API_URL}/sales/last-purchase-price`, { params });

// Dashboard
export const getDashboard = () => axios.get(`${API_URL}/dashboard`);
// Collection APIs
export const getCreditCollection = (params) => axios.get(`${API_URL}/collection-api/credit`, { params });
export const getRouteCollection = (params) => axios.get(`${API_URL}/collection-api/routes`, { params });
export const getWalkinCollection = (params) => axios.get(`${API_URL}/collection-api/walkin`, { params });
export const getTotalCollection = (params) => axios.get(`${API_URL}/collection-api/total`, { params });
// Routes and Route Trips
// (Routes removed)

// Admin utilities
export const clearTransactions = () => axios.post(`${API_URL}/admin/clear-transactions`);
export const recomputeOpening = () => axios.post(`${API_URL}/admin/opening/recompute`);

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
