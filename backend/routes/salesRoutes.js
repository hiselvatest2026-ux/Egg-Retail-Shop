const express = require('express');
const router = express.Router();
const { getSales, createSale, updateSale, deleteSale, getSaleInvoice } = require('../controllers/salesController');

router.get('/', getSales);
router.post('/', createSale);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);
router.get('/:id/invoice', getSaleInvoice);

module.exports = router;

