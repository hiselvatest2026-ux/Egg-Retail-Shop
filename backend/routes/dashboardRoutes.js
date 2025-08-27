const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/dashboardController');

router.get('/', getSummary);

module.exports = router;

