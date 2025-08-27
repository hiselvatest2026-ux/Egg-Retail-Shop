const express = require('express');
const router = express.Router();
const { getSuppliers } = require('../controllers/supplierController');

router.get('/', getSuppliers);

module.exports = router;

