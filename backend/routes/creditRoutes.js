const express = require('express');
const router = express.Router();
const { getCreditSummary } = require('../controllers/creditController');

router.get('/summary', getCreditSummary);

module.exports = router;

