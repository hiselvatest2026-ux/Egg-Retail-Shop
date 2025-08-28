const express = require('express');
const router = express.Router();
const { getInsights } = require('../controllers/inventoryInsightsController');

router.get('/insights', getInsights);

module.exports = router;

