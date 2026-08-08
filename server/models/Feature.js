const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  feature_id: { type: String, required: false },
  name: { type: String },
  category: { type: String },
  descr: { type: String },
  layer_type: { type: String, default: 'feature' }, // 'feature' or 'boundary'
  layerId: { type: String }, // Maps to the frontend's generated layer UUID
  createdBy: { type: String }, // Username of the account that saved this feature
  geometry: {
    type: {
      type: String,
      enum: ['Point', 'MultiPoint', 'LineString', 'Polygon'],
      required: true
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Feature', featureSchema);