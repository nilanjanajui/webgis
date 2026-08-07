const express = require('express');
const router = express.Router();
const featuresController = require('../controllers/featuresController');

// GET all features
router.get('/', featuresController.getAllFeatures);

// POST create new feature(s)
router.post('/', featuresController.createFeatures);

// PUT update a specific feature by ID
router.put('/:id', featuresController.updateFeature);

// DELETE a specific feature by ID
router.delete('/:id', featuresController.deleteFeature);

// POST create multiple features (batch upload)
router.post('/batch', featuresController.createBatchFeatures);

// DELETE all features for a specific layer
router.delete('/layer/:layerId', featuresController.deleteLayer);

module.exports = router;
