const express = require('express');
const router = express.Router();
const { listAdjustments, createAdjustment, deleteAdjustment } = require('../controllers/adjustmentController');

router.get('/', listAdjustments);
router.post('/', createAdjustment);
router.delete('/:id', deleteAdjustment);

module.exports = router;

