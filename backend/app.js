const express = require('express');
const cors = require('cors');
const purchaseRoutes = require('./routes/purchaseRoutes');
const salesRoutes = require('./routes/salesRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const ensureSchema = require('./db/ensureSchema');
const seedDefaults = require('./db/seedDefaults');
app.use(cors());
app.use(express.json());

ensureSchema().then(()=>seedDefaults()).catch(()=>{});
app.use('/purchases', purchaseRoutes);
app.use('/sales', salesRoutes);
app.use('/payments', paymentRoutes);
app.use('/products', productRoutes);
app.use('/customers', customerRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/reports', reportRoutes);

app.get('/', (req, res) => res.send('Egg Retail Shop Backend Running'));
module.exports = app;