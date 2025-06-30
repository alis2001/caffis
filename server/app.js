// server/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const inviteRoutes = require('./routes/inviteRoutes');
const requestRoutes = require('./routes/requestRoutes');

dotenv.config(); // Load environment variables

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/requests', requestRoutes);

// 404 handler - make sure this comes AFTER routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'NOT_FOUND' });
});

// Centralized error handling - comes LAST
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
