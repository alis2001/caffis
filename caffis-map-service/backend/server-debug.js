console.log('🐛 DEBUG: Starting step-by-step server...');

try {
  console.log('🐛 Step 1: Loading core modules...');
  const express = require('express');
  const http = require('http');
  const cors = require('cors');
  console.log('✅ Core modules loaded');

  console.log('🐛 Step 2: Creating app and server...');
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT || 5001;
  console.log('✅ App and server created');

  console.log('🐛 Step 3: Loading dotenv...');
  require('dotenv').config();
  console.log('✅ Dotenv loaded');

  console.log('🐛 Step 4: Setting up basic middleware...');
  app.use(cors());
  app.use(express.json());
  console.log('✅ Basic middleware set');

  console.log('🐛 Step 5: Adding basic health route...');
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', step: 'basic-server' });
  });
  console.log('✅ Basic health route added');

  console.log('🐛 Step 6: Loading logger...');
  const logger = require('./src/utils/logger');
  console.log('✅ Logger loaded');

  console.log('🐛 Step 7: Loading auth middleware...');
  const authMiddleware = require('./src/middleware/authMiddleware');
  console.log('✅ Auth middleware loaded');

  console.log('🐛 Step 8: Loading map controller...');
  const mapController = require('./src/controllers/mapController');
  console.log('✅ Map controller loaded');

  console.log('🐛 Step 9: Loading health routes...');
  const healthRoutes = require('./src/routes/healthRoutes');
  app.use('/api/health', healthRoutes);
  console.log('✅ Health routes loaded and mounted');

  console.log('🐛 Step 10: Loading map routes...');
  const mapRoutes = require('./src/routes/mapRoutes');
  app.use('/api/map', mapRoutes);
  console.log('✅ Map routes loaded and mounted');

  console.log('🐛 Step 11: Starting server...');
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DEBUG SERVER: Running on port ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
  });

} catch (error) {
  console.error('💥 ERROR at step:', error.message);
  console.error('💥 Stack:', error.stack);
  process.exit(1);
}
