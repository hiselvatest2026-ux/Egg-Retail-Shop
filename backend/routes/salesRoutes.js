const express = require('express');
const router = express.Router();
const { getSales, createSale, updateSale, deleteSale, getSaleInvoice } = require('../controllers/salesController');
const saleItems = require('../controllers/saleItemController');

router.get('/', getSales);
router.post('/', createSale);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);
router.get('/:id/invoice', getSaleInvoice);

// nested items
router.get('/:id/items', saleItems.listItems);
router.post('/:id/items', saleItems.createItem);
router.put('/:saleId/items/:itemId', saleItems.updateItem);
router.delete('/:saleId/items/:itemId', saleItems.deleteItem);

module.exports = router;

