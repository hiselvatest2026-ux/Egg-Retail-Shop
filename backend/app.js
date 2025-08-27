const express = require('express');
const cors = require('cors');
const purchaseRoutes = require('./routes/purchaseRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/purchases', purchaseRoutes);

app.get('/', (req, res) => res.send('Egg Retail Shop Backend Running'));
module.exports = app;