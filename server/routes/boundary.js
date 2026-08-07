const express = require('express');
const router = express.Router();
const boundaryController = require('../controllers/boundaryController');

// GET the boundary
router.get('/', boundaryController.getBoundary);

// POST create or update the boundary
router.post('/', boundaryController.saveBoundary);

// DELETE the boundary
router.delete('/', boundaryController.deleteBoundary);

module.exports = router;
