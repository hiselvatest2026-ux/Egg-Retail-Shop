const express = require('express');
const router = express.Router();
const { listRoutes, createRoute, updateRoute, deleteRoute } = require('../controllers/routeController');

router.get('/', listRoutes);
router.post('/', createRoute);
router.put('/:id', updateRoute);
router.delete('/:id', deleteRoute);

module.exports = router;

