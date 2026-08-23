# ⚙️ WebGIS PRO — Backend Express API Server

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-v5.2-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%209-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT Auth](https://img.shields.io/badge/Authentication-JWT%20%2B%20Bcrypt-FFB703?style=for-the-badge)](https://jwt.io/)

The RESTful backend service for **WebGIS PRO**. Built with **Node.js**, **Express 5**, and **MongoDB (Mongoose)**, providing JWT-based authentication, user data isolation, and cloud database persistence for vector features and spatial boundaries.

---

## ⚡ Server Features & Specifications

* **🔒 Secure User Authentication:** Password hashing using `bcryptjs` (salt round 10) and stateless token authorization via `jsonwebtoken` (JWT).
* **🛡️ Data Isolation & Authorization:** Middleware (`middleware/auth.js`) extracts and verifies Bearer tokens on protected endpoints, enforcing strict per-user database querying via the `createdBy` field.
* **🌐 Dynamic GeoJSON Feature Persistence:** Flexible Mongoose schema (`models/Feature.js`) handling `Point`, `MultiPoint`, `LineString`, and `Polygon` geometries with dynamic attribute key-value pairs (`strict: false`).
* **📐 Spatial Boundary Store:** API support for storing, retrieving, and overwriting boundary polygon layers.
* **⚡ High-Capacity Data Ingestion:** Configured with a `50mb` Express JSON payload limit to accommodate bulk spatial feature uploads.

---

## 📂 Server Architecture

```
server/
├── controllers/
│   ├── authController.js         # User registration, authentication, & session profile
│   ├── boundaryController.js     # Polygon boundary creation, fetch, & deletion
│   └── featuresController.js     # Single feature & batch layer CRUD operations
├── middleware/
│   └── auth.js                   # JWT Bearer token extraction & verification middleware
├── models/
│   ├── Feature.js                # GeoJSON spatial feature Mongoose schema
│   └── User.js                   # User account Mongoose schema
├── routes/
│   ├── auth.js                   # Auth routes (/api/auth)
│   ├── boundary.js               # Boundary routes (/api/boundary)
│   └── features.js               # Spatial feature routes (/api/features)
├── .env                          # Environment variables configuration (ignored by git)
├── package.json                  # Server dependencies & scripts
└── server.js                     # Server entry point & DB connection setup
```

---

## 🗄️ Database Schemas (Mongoose)

### 1. User Model (`models/User.js`)
```javascript
{
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  passwordHash: { type: String, required: true },
  timestamps: true
}
```

### 2. Feature Model (`models/Feature.js`)
```javascript
{
  feature_id: { type: String },
  name: { type: String },
  category: { type: String },
  descr: { type: String },
  layer_type: { type: String, default: 'feature' }, // 'feature' or 'boundary'
  layerId: { type: String },                        // Frontend layer UUID
  createdBy: { type: String },                      // Owner username
  geometry: {
    type: { type: String, enum: ['Point', 'MultiPoint', 'LineString', 'Polygon'], required: true },
    coordinates: { type: Schema.Types.Mixed, required: true }
  },
  timestamps: true,
  strict: false                                     // Allows custom arbitrary spatial attributes
}
```

---

## 🛰️ API Endpoints Reference

### Auth Endpoints (`/api/auth`)

| Endpoint | Method | Auth Required | Request Body | Description |
|---|---|---|---|---|
| `/register` | `POST` | No | `{ username, password }` | Creates a new user account |
| `/login` | `POST` | No | `{ username, password }` | Authenticates user & returns JWT token |
| `/me` | `GET` | Yes | Header: `Authorization: Bearer <token>` | Returns current user profile |

### Feature Endpoints (`/api/features`)

| Endpoint | Method | Auth Required | Request Body / Params | Description |
|---|---|---|---|---|
| `/` | `GET` | Yes | None | Retrieves all features owned by the active user |
| `/` | `POST` | Yes | Feature JSON object | Creates a single spatial feature |
| `/batch` | `POST` | Yes | `{ layerId, features: [...] }` | Batch uploads an array of features |
| `/:id` | `PUT` | Yes | Param: `id`, Body: Updated fields | Updates a specific feature record |
| `/:id` | `DELETE` | Yes | Param: `id` | Deletes a single feature record |
| `/layer/:layerId` | `DELETE` | Yes | Param: `layerId` | Deletes all features associated with a layer |

### Boundary Endpoints (`/api/boundary`)

| Endpoint | Method | Auth Required | Request Body / Params | Description |
|---|---|---|---|---|
| `/` | `GET` | Yes | None | Retrieves the active saved boundary for the user |
| `/` | `POST` | Yes | Boundary Feature JSON object | Overwrites/saves user's custom boundary |
| `/` | `DELETE` | Yes | None | Deletes user's saved boundary |

---

## 🛠️ Environment Configuration & Setup

### 1. Environment Variables (`.env`)
Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/webgis?retryWrites=true&w=majority
JWT_SECRET=your_secure_random_jwt_secret_phrase
```

### 2. Installation & Run
```bash
# Navigate to server folder
cd server

# Install dependencies
npm install

# Start Express API server
npm start
```
*The server will start listening on the configured port (Default: `5000`).*

---

## 🛡️ Error Handling & Limits
* **Body Parser Limit:** Set to `50mb` (`express.json({ limit: '50mb' })`) to process large GeoJSON feature collections smoothly.
* **Authentication Error Responses:** Returns `401 Unauthorized` for missing/expired JWT tokens.
* **Validation Error Responses:** Returns `400 Bad Request` for missing required fields (e.g. invalid credentials or duplicate usernames).
