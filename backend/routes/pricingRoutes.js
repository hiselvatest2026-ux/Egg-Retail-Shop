const express = require('express');
const router = express.Router();
const { getPricing, createPricing, updatePricing, deletePricing } = require('../controllers/pricingController');

router.get('/', getPricing);
router.post('/', createPricing);
router.put('/:id', updatePricing);
router.delete('/:id', deletePricing);

module.exports = router;