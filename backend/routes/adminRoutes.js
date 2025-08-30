const express = require('express');
const router = express.Router();
const ensureSchema = require('../db/ensureSchema');
const seedDefaults = require('../db/seedDefaults');

router.post('/seed', async (_req, res) => {
  try {
    await ensureSchema();
    await seedDefaults();
    res.json({ message: 'Seed completed' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

