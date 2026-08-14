const express = require('express');
const router = express.Router();
const featuresController = require('../controllers/featuresController');
const requireAuth = require('../middleware/auth');

// GET all features — requires login for user data isolation
router.get('/', requireAuth, featuresController.getAllFeatures);

// POST create new feature(s) — requires login
router.post('/', requireAuth, featuresController.createFeatures);

// PUT update a specific feature by ID — requires login
router.put('/:id', requireAuth, featuresController.updateFeature);

// DELETE a specific feature by ID — requires login
router.delete('/:id', requireAuth, featuresController.deleteFeature);

// POST create multiple features (batch upload) — requires login
router.post('/batch', requireAuth, featuresController.createBatchFeatures);

// DELETE all features for a specific layer — requires login
router.delete('/layer/:layerId', requireAuth, featuresController.deleteLayer);

module.exports = router;