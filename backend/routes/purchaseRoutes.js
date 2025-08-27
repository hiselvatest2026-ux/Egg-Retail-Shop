const express = require('express');
const router = express.Router();
const { getPurchases, createPurchase, updatePurchase, deletePurchase } = require('../controllers/purchaseController');
router.get('/', getPurchases);
router.post('/', createPurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);
module.exports = router;