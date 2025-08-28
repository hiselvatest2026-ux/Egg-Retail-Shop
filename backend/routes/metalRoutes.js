const express = require('express');
const router = express.Router();
const { listMetals, createMetal, updateMetal, deleteMetal } = require('../controllers/metalController');

router.get('/', listMetals);
router.post('/', createMetal);
router.put('/:id', updateMetal);
router.delete('/:id', deleteMetal);

module.exports = router;

