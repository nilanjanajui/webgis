const express = require('express');
const router = express.Router();
const boundaryController = require('../controllers/boundaryController');
const requireAuth = require('../middleware/auth');

// GET the boundary — requires login for user data isolation
router.get('/', requireAuth, boundaryController.getBoundary);

// POST create or update the boundary — requires login
router.post('/', requireAuth, boundaryController.saveBoundary);

// DELETE the boundary — requires login
router.delete('/', requireAuth, boundaryController.deleteBoundary);

module.exports = router;