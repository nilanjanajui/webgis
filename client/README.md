# 🎨 WebGIS PRO — Client Frontend Application

[![React Version](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Vite Version](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Leaflet Maps](https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Live Deployment](https://img.shields.io/badge/Live%20App-webgis--drab.vercel.app-06B6D4?style=for-the-badge&logo=vercel&logoColor=white)](https://webgis-drab.vercel.app)

The client-side single-page WebGIS application powering **WebGIS PRO**. Built with **React 19**, **Vite**, **Leaflet**, and **React-Leaflet**, featuring modern dark/light themes, multi-format spatial data ingestion, real-time geodetic measurements, and automated PDF/Shapefile exporting.

---

## ⚡ Client Features Overview

* **🗺️ Interactive Map Canvas:** Driven by Leaflet rendering tile layers (OpenStreetMap, CartoDB Dark/Light basemaps) with responsive zoom controls, interactive point tooltips, vector popups, and boundary overlays.
* **📁 Universal Spatial Ingestion Engine:**
  * **GeoJSON (`.json`/`.geojson`):** Direct spatial vector ingestion.
  * **ESRI Shapefiles (`.zip`):** Parsed asynchronously in-browser using `shpjs`.
  * **CSV & Excel (`.csv`, `.xlsx`, `.xls`):** Parsed with `papaparse` and `xlsx`, featuring automated column header matching (`latitude`, `longitude`, `lat`, `lon`, `y`, `x`) and interactive field mismatch warning modals.
* **📊 Spatial Analytics & Containment Engine:**
  * **Convex Hull Engine:** Computes bounding convex polygons across point layers using Andrew's Monotone Chain algorithm.
  * **Point Containment:** Real-time checking of points inside active polygon boundaries.
  * **Interactive Attribute Table:** Tabular viewer supporting real-time filtering, column sorting, pagination, and map geometry highlighting.
* **📏 Precision Geodetic Tools:**
  * Interactive distance measurement (Haversine geodetic calculation in meters & kilometers).
  * Interactive polygon area measurement (in $\text{m}^2$ and $\text{km}^2$).
  * Vector point marker creation form with instant custom attributes.
* **💾 Export Suite:**
  * **Shapefile Export:** Client-side zip bundling of active layers to ESRI Shapefile format (`.zip`) using `@mapbox/shp-write`.
  * **Map PDF Generator:** Converts active canvas views into styled printable PDF documents complete with title tags, legends, and timestamps using `jspdf` and `html2canvas`.
* **🌓 Dual Theme Engine:** Reactive Day and Night visual modes with glassmorphic UI elements and CSS custom variables.

---

## 📂 Project Architecture

```
client/
├── public/                     # Favicons, base maps, and sample assets
├── src/
│   ├── assets/                 # SVGs and static visual resources
│   ├── components/
│   │   ├── auth/
│   │   │   └── AuthModal.jsx             # Login & Registration modal
│   │   ├── layout/
│   │   │   ├── LeftSidebar.jsx           # Layer management, upload, & tool controls
│   │   │   ├── MapView.jsx               # Main Leaflet map view wrapper
│   │   │   └── RightSidebar.jsx          # Collapsible panel container
│   │   ├── map/
│   │   │   ├── BoundaryDrawTool.jsx      # Polyline/Polygon boundary drawer
│   │   │   ├── FeatureLayer.jsx          # Leaflet layer vector visualizer
│   │   │   ├── MeasureTool.jsx           # Distance and area measurement tools
│   │   │   └── PointForm.jsx             # Custom point addition form
│   │   ├── panels/
│   │   │   ├── AttributeTable.jsx        # Data grid for active spatial features
│   │   │   ├── FeatureDetails.jsx        # Selected element property inspector
│   │   │   ├── Legend.jsx                # Map layer legend & category swatches
│   │   │   └── SpatialAnalytics.jsx      # Convex hull & spatial metrics summary
│   │   └── upload/
│   │       ├── ConfirmationPreview.jsx   # Ingestion data column mapper & preview
│   │       ├── FieldMismatchWarning.jsx  # Column validation alert modal
│   │       └── UploadControl.jsx         # Drag-and-drop file uploader
│   ├── constants/
│   │   └── categoryColors.js             # Categorical vector color mappings
│   ├── services/
│   │   └── api.js                        # REST API service client (Auth, Features, Boundary)
│   ├── state/
│   │   ├── authStore.jsx                 # User state & JWT auth context provider
│   │   └── layersStore.jsx               # GIS layers, active feature selection, & theme store
│   ├── utils/
│   │   ├── convexHull.js                 # Monotone chain convex hull computation
│   │   ├── exportToPdf.js                # Canvas capture & PDF document builder
│   │   ├── geometryLabel.js              # Geometry type formatter
│   │   └── shapefileExport.js            # Shapefile binary packager
│   ├── App.jsx                           # Application root layout & header bar
│   ├── index.css                         # Global CSS variable design system
│   └── main.jsx                          # React application entry point
├── index.html                            # HTML5 root template
├── package.json                          # Client dependencies & scripts
└── vite.config.js                        # Vite build engine setup
```

---

## 🛠️ Key Libraries & Technical Dependencies

| Library | Role / Usage |
|---|---|
| **React 19** | Component framework and reactive DOM rendering engine |
| **Leaflet & React-Leaflet** | Map tile loading, vector rendering, popups, and event listeners |
| **`shpjs`** | Client-side unzipping and conversion of ESRI Shapefiles to GeoJSON |
| **`papaparse`** | Fast in-browser CSV parsing with header auto-detection |
| **`xlsx`** | SheetJS spreadsheet parser for Microsoft Excel `.xlsx` / `.xls` files |
| **`@mapbox/shp-write`** | In-browser GeoJSON to ESRI Shapefile `.zip` zip generator |
| **`html2canvas` & `jspdf`** | DOM-to-canvas rendering and map report PDF generation |
| **`lucide-react`** | UI vector icon package |
| **Vite** | Next-generation frontend build engine with HMR |

---

## 🚀 Environment Setup & Available Scripts

### Environment Configuration
Create a `.env.local` file in the `client/` root folder:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
*(In production deployment, set `VITE_API_BASE_URL` to your live Express backend endpoint).*

### Development Scripts

#### 1. Start Development Server
Runs Vite in hot-reloading development mode at `http://localhost:5173`.
```bash
npm run dev
```

#### 2. Build for Production
Compiles optimized assets to the `dist/` directory.
```bash
npm run build
```

#### 3. Preview Production Build
Locally tests the production assets generated in `dist/`.
```bash
npm run preview
```

#### 4. Run ESLint
Lints client codebase for formatting and potential errors.
```bash
npm run lint
```

---

## 🔗 Main Application Link
Live WebGIS Application: [https://webgis-drab.vercel.app](https://webgis-drab.vercel.app)
