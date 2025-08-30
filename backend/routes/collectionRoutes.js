const express = require('express');
const router = express.Router();
const { creditCollection, routeCollection, walkinCollection, totalCollection } = require('../controllers/collectionController');

router.get('/credit', creditCollection);
router.get('/routes', routeCollection);
router.get('/walkin', walkinCollection);
router.get('/total', totalCollection);

module.exports = router;

