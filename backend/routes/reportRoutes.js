const express = require('express');
const router = express.Router();
const { purchasesCsv, salesCsv, collectionsCsv, stockCsv } = require('../controllers/reportsController');

router.get('/purchases.csv', purchasesCsv);
router.get('/sales.csv', salesCsv);
router.get('/collections.csv', collectionsCsv);
router.get('/stock.csv', stockCsv);

module.exports = router;

