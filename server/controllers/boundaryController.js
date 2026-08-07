const Feature = require('../models/Feature');
const { toGeoJSONCoords, fromGeoJSONCoords } = require('../utils/geo');

// Get the area boundary
exports.getBoundary = async (req, res) => {
  try {
    const boundary = await Feature.findOne({ layer_type: 'boundary' });
    if (!boundary) return res.status(200).json(null);
    res.json(boundary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create or update the area boundary
exports.saveBoundary = async (req, res) => {
  try {
    const boundaryData = {
      ...req.body,
      layer_type: 'boundary',
      feature_id: 'boundary_01'
    };

    // Upsert the boundary so there is only ever one area boundary
    const savedBoundary = await Feature.findOneAndUpdate(
      { layer_type: 'boundary' },
      boundaryData,
      { new: true, upsert: true }
    );
    
    res.status(201).json(savedBoundary);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete the boundary
exports.deleteBoundary = async (req, res) => {
  try {
    const deleted = await Feature.findOneAndDelete({ layer_type: 'boundary' });
    if (!deleted) return res.status(404).json({ error: 'Boundary not found' });
    res.json({ message: 'Boundary deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
