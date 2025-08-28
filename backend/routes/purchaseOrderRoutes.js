const express = require('express');
const router = express.Router();
const { listPOs, createPO, addItem, updatePO, deletePO, receivePO, reorderSuggestions, supplierPerformance } = require('../controllers/purchaseOrderController');

router.get('/', listPOs);
router.post('/', createPO);
router.post('/:id/items', addItem);
router.put('/:id', updatePO);
router.delete('/:id', deletePO);
router.post('/:id/receive', receivePO);
router.get('/reorder/suggestions', reorderSuggestions);
router.get('/suppliers/performance', supplierPerformance);

module.exports = router;

