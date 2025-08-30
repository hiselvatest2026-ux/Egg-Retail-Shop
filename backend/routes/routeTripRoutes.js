const express = require('express');
const router = express.Router();
const { listTrips, createTrip, updateTrip, deleteTrip } = require('../controllers/routeTripController');

router.get('/', listTrips);
router.post('/', createTrip);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

module.exports = router;

