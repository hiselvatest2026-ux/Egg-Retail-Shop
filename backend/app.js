const express = require('express');
const cors = require('cors');
const purchaseRoutes = require('./routes/purchaseRoutes');
const salesRoutes = require('./routes/salesRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/purchases', purchaseRoutes);
app.use('/sales', salesRoutes);
app.use('/payments', paymentRoutes);

app.get('/', (req, res) => res.send('Egg Retail Shop Backend Running'));
module.exports = app;