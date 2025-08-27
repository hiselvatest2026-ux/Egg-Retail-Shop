const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct, getStock } = require('../controllers/productController');

router.get('/', getProducts);
router.get('/stock', getStock);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;

