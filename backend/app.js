const express = require('express');
const cors = require('cors');
const purchaseRoutes = require('./routes/purchaseRoutes');
const salesRoutes = require('./routes/salesRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/purchases', purchaseRoutes);
app.use('/sales', salesRoutes);
app.use('/payments', paymentRoutes);
app.use('/products', productRoutes);
app.use('/customers', customerRoutes);
app.use('/dashboard', dashboardRoutes);

app.get('/', (req, res) => res.send('Egg Retail Shop Backend Running'));
module.exports = app;