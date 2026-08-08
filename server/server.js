require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const featuresRoutes = require('./routes/features');
const boundaryRoutes = require('./routes/boundary');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Connection error:', err));

// Root route
app.get('/', (req, res) => res.send('Server is running'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/boundary', boundaryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));