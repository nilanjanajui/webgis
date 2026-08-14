/**
 * Field label mappings:
 * Internal database/DBF field names (max 10 chars) mapped to human-readable UI display labels.
 */

export const FIELD_LABELS = {
  point_id: "Point ID",
  point_name: "Point Name",
  name: "Name",
  latitude: "Latitude",
  longitude: "Longitude",
  category: "Category",
  descr: "Description",
  description: "Description",
  layer_type: "Layer Type",
  created_at: "Created At"
};

/**
 * Returns human-readable label for a given field key.
 * @param {string} key 
 * @returns {string}
 */
export function getFieldLabel(key) {
  if (!key) return "";
  const lowerKey = key.toLowerCase();
  return FIELD_LABELS[lowerKey] || FIELD_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Map DB long names to 10-char DBF compliant field names for export/storage
 */
export const INTERNAL_FIELD_MAP = {
  "point id": "point_id",
  "pointid": "point_id",
  "pnt_id": "point_id",
  "pntid": "point_id",
  "id": "point_id",
  "fid": "point_id",
  "objectid": "point_id",

  "point name": "point_name",
  "pointname": "point_name",
  "pnt_name": "point_name",
  "pntname": "point_name",
  "name": "point_name",
  "location": "point_name",
  "label": "point_name",
  "site_name": "point_name",
  "sitename": "point_name",
  "site": "point_name",
  "title": "point_name",
  "place": "point_name",
  "station": "point_name",

  "lat": "latitude",
  "latitude": "latitude",
  "y": "latitude",

  "lng": "longitude",
  "long": "longitude",
  "longitude": "longitude",
  "x": "longitude",

  "cat": "category",
  "category": "category",
  "type": "category",

  "description": "descr",
  "desc": "descr",
  "descr": "descr"
};
