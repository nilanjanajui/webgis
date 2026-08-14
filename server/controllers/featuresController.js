const Feature = require('../models/Feature');
const { toGeoJSONCoords, fromGeoJSONCoords } = require('../utils/geo');

// Get all standard features for the logged-in user
exports.getAllFeatures = async (req, res) => {
  try {
    const features = await Feature.find({ layer_type: 'feature', createdBy: req.user.username });
    res.json(features);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create one or more features
exports.createFeatures = async (req, res) => {
  try {
    const data = Array.isArray(req.body) ? req.body : [req.body];

    const savedFeatures = await Feature.insertMany(
      data.map(f => ({ ...f, layer_type: 'feature', createdBy: req.user.username }))
    );
    res.status(201).json(savedFeatures);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update a feature
exports.updateFeature = async (req, res) => {
  try {
    const featureId = req.params.id;
    // We update based on the custom feature_id if provided, else fall back to _id
    const updated = await Feature.findOneAndUpdate(
      { $or: [{ feature_id: featureId }, { _id: featureId }], layer_type: 'feature', createdBy: req.user.username },
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Feature not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a feature
exports.deleteFeature = async (req, res) => {
  try {
    const featureId = req.params.id;
    const deleted = await Feature.findOneAndDelete({
      $or: [{ feature_id: featureId }, { _id: featureId }],
      layer_type: 'feature',
      createdBy: req.user.username
    });

    if (!deleted) return res.status(404).json({ error: 'Feature not found' });
    res.json({ message: 'Feature deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create multiple features in batch
exports.createBatchFeatures = async (req, res) => {
  try {
    const { features } = req.body;
    if (!features || !Array.isArray(features)) {
      return res.status(400).json({ error: 'Expected an array of features in req.body.features' });
    }
    const savedFeatures = await Feature.insertMany(
      features.map(f => ({ ...f, layer_type: 'feature', createdBy: req.user.username }))
    );
    res.status(201).json(savedFeatures);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete an entire layer's features
exports.deleteLayer = async (req, res) => {
  try {
    const { layerId } = req.params;
    const result = await Feature.deleteMany({ layerId, layer_type: 'feature', createdBy: req.user.username });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};