const express = require('express');
const router = express.Router();
const { listLocations } = require('../controllers/locationController');

router.get('/', listLocations);

module.exports = router;

