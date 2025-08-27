const express = require('express');
const router = express.Router();
const { getPurchases, createPurchase, updatePurchase, deletePurchase } = require('../controllers/purchaseController');
const purchaseItems = require('../controllers/purchaseItemController');
router.get('/', getPurchases);
router.post('/', createPurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);
// nested items
router.get('/:id/items', purchaseItems.listItems);
router.post('/:id/items', purchaseItems.createItem);
router.put('/:purchaseId/items/:itemId', purchaseItems.updateItem);
router.delete('/:purchaseId/items/:itemId', purchaseItems.deleteItem);
module.exports = router;