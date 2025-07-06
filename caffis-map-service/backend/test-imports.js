console.log('Testing individual imports...');

try {
  console.log('1. Testing logger...');
  const logger = require('./src/utils/logger');
  console.log('✅ Logger OK');
} catch (error) {
  console.error('❌ Logger failed:', error.message);
}

try {
  console.log('2. Testing authMiddleware...');
  const authMiddleware = require('./src/middleware/authMiddleware');
  console.log('✅ Auth middleware OK');
} catch (error) {
  console.error('❌ Auth middleware failed:', error.message);
}

try {
  console.log('3. Testing mapController...');
  const mapController = require('./src/controllers/mapController');
  console.log('✅ Map controller OK');
} catch (error) {
  console.error('❌ Map controller failed:', error.message);
  console.error('Stack:', error.stack);
}

try {
  console.log('4. Testing healthRoutes...');
  const healthRoutes = require('./src/routes/healthRoutes');
  console.log('✅ Health routes OK');
} catch (error) {
  console.error('❌ Health routes failed:', error.message);
  console.error('Stack:', error.stack);
}

try {
  console.log('5. Testing mapRoutes...');
  const mapRoutes = require('./src/routes/mapRoutes');
  console.log('✅ Map routes OK');
} catch (error) {
  console.error('❌ Map routes failed:', error.message);
  console.error('Stack:', error.stack);
}

console.log('Import testing completed.');
