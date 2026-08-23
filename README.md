# 🌐 WebGIS PRO — Advanced Spatial Analytics & Mapping Platform

[![Live Application](https://img.shields.io/badge/Live%20Demo-webgis--drab.vercel.app-06B6D4?style=for-the-badge&logo=vercel&logoColor=white)](https://webgis-drab.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Leaflet-10B981?style=for-the-badge)](https://webgis-drab.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-3B82F6?style=for-the-badge)](LICENSE)

An enterprise-grade **WebGIS Platform** engineered for spatial data visualization, vector data processing, real-time geometric analytics, dynamic map export, and full-stack session persistence. Designed with a sleek, modern UI, reactive day/night themes, and instant client-side file parsing paired with a secure MongoDB database backend.

🚀 **Live App URL:** [https://webgis-drab.vercel.app](https://webgis-drab.vercel.app)

---

## ✨ 3 Core Flagship Features

### 1. 📂 Multi-Format Spatial Data Engine & Geo-Visualizer
* **Universal File Import:** Drag-and-drop support for **GeoJSON (`.json`/`.geojson`)**, **ESRI Shapefiles (`.zip`)**, **CSV (`.csv`)**, and **Excel (`.xlsx`/`.xls`)** files with instant client-side parsing using `shpjs`, `papaparse`, and `xlsx`.
* **Smart Coordinate Auto-Detection:** Intelligently maps header columns (`latitude`, `longitude`, `lat`, `lon`, `y`, `x`) to spatial vector point geometries with interactive field-mismatch preview modals.
* **Dynamic Map Layer Control:** Multi-layer management with toggleable visibility, custom layer color coding, record counters, and spatial dataset isolation.
* **Instant Sample GIS Preset:** Built-in one-click demo data preset enabling instant feature evaluation across NYC, London, Tokyo, and Paris nodes.

### 2. 📐 Real-Time Spatial Analytics & Geometric Computation Suite
* **Convex Hull Boundary Generation:** Automatically computes and projects minimum enclosing convex polygons encompassing all loaded vector point datasets.
* **Point-In-Polygon Containment Analysis:** Computes spatial containment metrics in real time to verify which vector features reside within user-drawn or system-generated boundaries.
* **Interactive Geodetic Measurement Tools:** Real-time distance measuring (Haversine & Euclidean meters/kilometers) and polygon area calculation ($\text{m}^2$ and $\text{km}^2$).
* **Attribute Table & Details Panel:** Search, filter, and inspect tabular feature attributes dynamically linked to map vector selections.

### 3. 💾 Full-Stack Cloud Persistence, Security & Export Engine
* **Per-User Spatial Data Isolation:** Secure JWT authentication (bcrypt password hashing & Bearer token verification) providing dedicated cloud database persistence per account.
* **Shapefile Data Export:** Convert active vector layers back into downloadable ESRI Shapefile (`.zip`) archives powered by `@mapbox/shp-write`.
* **High-Resolution Map PDF Reports:** Generate publication-ready PDF maps containing canvas rendering, custom titles, legends, timestamps, and scale bars (`jspdf` + `html2canvas`).

---

## 🛠️ Architecture & Tech Stack

```
                     ┌─────────────────────────────────────────┐
                     │          WebGIS PRO Frontend            │
                     │    (React 19 + Vite + Leaflet Maps)    │
                     └────────────────────┬────────────────────┘
                                          │
                                 REST API │ JSON / JWT Bearer
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │           WebGIS Express Server         │
                     │    (Node.js + Express 5 + Mongoose)     │
                     └────────────────────┬────────────────────┘
                                          │
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │            MongoDB Database             │
                     │    (User Credentials & Geo Features)    │
                     └─────────────────────────────────────────┘
```

| Layer | Technologies & Tools |
|---|---|
| **Frontend UI** | React 19, Vite, Leaflet, React-Leaflet, Lucide Icons, Custom Modern CSS |
| **Spatial Ingestion** | `shpjs`, `papaparse`, `xlsx`, `@mapbox/shp-write`, `html2canvas`, `jspdf` |
| **Backend API** | Node.js, Express.js 5, JWT (`jsonwebtoken`), `bcryptjs`, CORS |
| **Database** | MongoDB Atlas / Local MongoDB via Mongoose ORM |
| **Deployment** | Vercel (Client App & Server Hosting) |

---

## 📁 Repository Structure

```
webgis/
├── client/                     # Frontend React + Vite Application
│   ├── public/                 # Static assets & map icons
│   ├── src/
│   │   ├── components/         # Map tools, sidebars, panels, auth modals
│   │   ├── constants/          # Map styling constants & color definitions
│   │   ├── services/           # Axios-like Fetch API service wrapper
│   │   ├── state/              # Global layers & authentication stores
│   │   └── utils/              # Convex hull, shapefile export, PDF generator
│   ├── package.json
│   └── vite.config.js
└── server/                     # Backend Node.js + Express API
    ├── controllers/            # Auth, Feature, and Boundary logic controllers
    ├── middleware/             # JWT authentication middleware
    ├── models/                 # Mongoose schemas (User, Feature)
    ├── routes/                 # Express API endpoints (/api/auth, /api/features, /api/boundary)
    ├── server.js               # Express application entry point
    └── package.json
```

---

## ⚡ Quick Start & Local Setup

### Prerequisites
* **Node.js** v18+ and **npm** v9+ installed
* **MongoDB** instance (Local MongoDB server or MongoDB Atlas connection string)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/webgis.git
cd webgis
```

### 2. Configure Backend Server
```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/webgis
JWT_SECRET=your_super_secret_jwt_key_here
```

Start the backend server:
```bash
npm start
```
*Backend server will run at `http://localhost:5000`.*

### 3. Configure Frontend Client
Open a new terminal tab and navigate to the client folder:
```bash
cd client
npm install
```

Create a `.env.local` file inside the `client/` directory:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the Vite development server:
```bash
npm run dev
```
*Frontend client will open at `http://localhost:5173`.*

---

## 🛰️ REST API Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Private | Retrieve current user profile session |
| `GET` | `/api/features` | Private | Fetch user's saved GIS features |
| `POST` | `/api/features` | Private | Save individual feature to database |
| `POST` | `/api/features/batch` | Private | Save multiple GIS layer features in bulk |
| `PUT` | `/api/features/:id` | Private | Update spatial feature attributes |
| `DELETE` | `/api/features/:id` | Private | Remove a single feature record |
| `DELETE` | `/api/features/layer/:layerId` | Private | Delete all features belonging to a layer |
| `GET` | `/api/boundary` | Private | Fetch user's saved boundary geometry |
| `POST` | `/api/boundary` | Private | Save/Update custom boundary geometry |
| `DELETE` | `/api/boundary` | Private | Reset user boundary record |

---

## 🔗 Submodule Documentation
* For frontend component architecture, styling rules, and export utilities, visit the [Client README](client/README.md).
* For database schemas, JWT authentication middleware, and API controller specs, visit the [Server README](server/README.md).

---

## 🤝 Contributing & License
Distributed under the **MIT License**. Contributions, feature requests, and pull requests are welcome!

Made with ❤️ for GIS Engineers & Urban Data Analysts. Live at [webgis-drab.vercel.app](https://webgis-drab.vercel.app).
