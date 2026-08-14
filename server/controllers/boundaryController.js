const Feature = require('../models/Feature');
const { toGeoJSONCoords, fromGeoJSONCoords } = require('../utils/geo');

// Get the area boundary for the logged-in user
exports.getBoundary = async (req, res) => {
  try {
    const boundary = await Feature.findOne({ layer_type: 'boundary', createdBy: req.user.username });
    if (!boundary) return res.status(200).json(null);
    res.json(boundary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create or update the area boundary for the logged-in user
exports.saveBoundary = async (req, res) => {
  try {
    const boundaryData = {
      ...req.body,
      layer_type: 'boundary',
      feature_id: `boundary_${req.user.username}`,
      createdBy: req.user.username
    };

    // Upsert the boundary for this specific user
    const savedBoundary = await Feature.findOneAndUpdate(
      { layer_type: 'boundary', createdBy: req.user.username },
      boundaryData,
      { new: true, upsert: true }
    );
    
    res.status(201).json(savedBoundary);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete the boundary for the logged-in user
exports.deleteBoundary = async (req, res) => {
  try {
    const deleted = await Feature.findOneAndDelete({ layer_type: 'boundary', createdBy: req.user.username });
    if (!deleted) return res.status(404).json({ error: 'Boundary not found' });
    res.json({ message: 'Boundary deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
