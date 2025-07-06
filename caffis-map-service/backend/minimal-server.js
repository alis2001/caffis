const express = require('express');
require('dotenv').config();

console.log('🚀 MINIMAL: Starting basic map service...');

const app = express();
const PORT = process.env.PORT || 5001;

// Very basic middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  console.log('Health check received');
  res.json({
    status: 'OK',
    service: 'caffis-map-service-minimal',
    timestamp: new Date().toISOString()
  });
});

// Basic map endpoint
app.get('/api/map/test', (req, res) => {
  res.json({ message: 'Minimal map service working!' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎯 MINIMAL MAP SERVICE: Running on port ${PORT}`);
  console.log(`✅ Available at: http://localhost:${PORT}/health`);
});
